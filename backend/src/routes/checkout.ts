import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../prismaClient';
import { sendOrderInvoiceEmail, sendAdminOrderNotificationEmail } from '../mailer';
import { sendTikTokPurchaseEvent } from '../utils/tiktok';
import axios from 'axios';
import { syncStockToEbayIfLinked } from '../utils/ebaySync';
import { EU_VAT_RATES } from './vat';
import { log } from '../utils/logger';

const getPayPalBaseUrl = () => {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').trim().toLowerCase();
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
};

const getPayPalAccessToken = async (): Promise<string> => {
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured in environment variables.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await axios.post(
    `${getPayPalBaseUrl()}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
    }
  );

  return response.data.access_token;
};

let _stripe: InstanceType<typeof Stripe> | null = null;
const getStripe = (): InstanceType<typeof Stripe> => {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY || '';
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = new Stripe(key, { apiVersion: '2025-01-27.acacia' as any });
  }
  return _stripe;
};

const router = Router();

async function enrichCartItems(cartItems: any[]) {
  if (!cartItems || cartItems.length === 0) return [];
  try {
    const productIds = cartItems.map((i: any) => i.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map();
    dbProducts.forEach(p => productMap.set(p.id, p));

    return cartItems.map((item: any) => {
      const dbProduct = productMap.get(item.id);
      return {
        id: item.id,
        sku: dbProduct?.sku || item.sku || null,
        name: dbProduct?.translations?.de || dbProduct?.translations?.en || dbProduct?.name || item.name || 'Product',
        image_url: dbProduct?.image_url || item.image_url || null,
        quantity: item.quantity,
        price: item.price
      };
    });
  } catch (err) {
    console.error("Failed to enrich cart items from database:", err);
    return cartItems;
  }
}

function parseCartItemsFromMetadata(metadata: any): any[] {
  if (!metadata) return [];
  let jsonStr = '';
  let chunkIdx = 0;
  while (metadata[`cart_chunk_${chunkIdx}`]) {
    jsonStr += metadata[`cart_chunk_${chunkIdx}`];
    chunkIdx++;
  }
  if (!jsonStr && metadata.cart_items) {
    jsonStr = metadata.cart_items;
  }
  if (!jsonStr) return [];
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse cart items JSON from metadata:", err);
    return [];
  }
}

// POST /api/checkout/create-session
router.post('/create-session', async (req: Request, res: Response): Promise<void> => {
  try {
    const { items: rawItems, coupon_code, order_type, shipping_fee, shipping_name, locale, customer_country, vat_number, is_reverse_charge, customer_email, customer_name, customer_phone, shipping_address } = req.body;

    if (!rawItems || rawItems.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    // Load VAT settings
    const vatSetting = await prisma.setting.findUnique({ where: { key: 'vat_config' } });
    const vatConfig = vatSetting ? (vatSetting.value as any) : { rate: 19, type: 'inclusive' };
    const defaultRate = Number(vatConfig.rate || 19);
    const isExclusive = vatConfig.type === 'exclusive' || order_type === 'Wholesale';

    const customerCountry = customer_country || 'DE';
    const isNonEU = !EU_VAT_RATES[customerCountry];

    // Validate VAT ID for reverse charge
    let isReverseCharge = false;
    if (customerCountry !== 'DE') {
      if (order_type === 'Wholesale' && vat_number) {
        isReverseCharge = true;
      } else if (vat_number) {
        const cleaned = vat_number.replace(/[\s\-\.]/g, '').toUpperCase();
        const countryCode = cleaned.slice(0, 2);
        const number = cleaned.slice(2);
        
        if (EU_VAT_RATES[countryCode] && number.length >= 4) {
          try {
            const viesRes = await axios.post(
              'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number',
              {
                countryCode,
                vatNumber: number
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 4000,
              }
            );
            isReverseCharge = viesRes.data?.valid === true;
          } catch (e) {
            console.error("VIES verification failed, fallback to frontend parameter:", e);
            isReverseCharge = is_reverse_charge === true;
          }
        } else {
          isReverseCharge = is_reverse_charge === true;
        }
      } else {
        isReverseCharge = is_reverse_charge === true;
      }
    } else {
      isReverseCharge = false;
    }

    const appliedVatRate = (isReverseCharge || isNonEU)
      ? 0
      : (EU_VAT_RATES[customerCountry] ?? defaultRate);

    const getAdjustedPrice = (priceVal: number) => {
      if (isExclusive) {
        return priceVal * (1 + appliedVatRate / 100);
      } else {
        const netPrice = priceVal / (1 + defaultRate / 100);
        return netPrice * (1 + appliedVatRate / 100);
      }
    };

    // ─────────────────────────────────────────────────────────────────
    // SECURITY: Re-fetch authoritative prices from DB. NEVER trust frontend prices.
    // ─────────────────────────────────────────────────────────────────
    const rawPriceIds = rawItems.map((i: any) => i.id).filter(Boolean);
    const dbPriceProducts = await prisma.product.findMany({
      where: { id: { in: rawPriceIds } }
    });
    const dbPriceMap = new Map<string, any>();
    dbPriceProducts.forEach((p: any) => dbPriceMap.set(p.id, p));

    // Determine B2B status from JWT
    let isAuthB2B = false;
    const authHdr = req.headers['authorization'];
    if (authHdr && authHdr.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded: any = jwt.verify(authHdr.slice(7), process.env.JWT_SECRET || 'secret');
        isAuthB2B = decoded?.role === 'SUPER_ADMIN' || decoded?.role === 'SELLER';
      } catch {}
    }

    // Validate & override item prices with server-side DB prices
    for (const item of rawItems) {
      const dbProduct = dbPriceMap.get(item.id);
      if (!dbProduct) continue;
      const isWholesaleReq = order_type === 'Wholesale';
      const realPrice = (isAuthB2B && isWholesaleReq)
        ? parseFloat(dbProduct.b2b_price || dbProduct.price || 0)
        : parseFloat(dbProduct.sales_price_with_tax || dbProduct.price || dbProduct.retail_price || 0);
      const submittedPrice = parseFloat(item.price);
      if (submittedPrice <= 0) {
        res.status(400).json({ message: `Invalid price for "${item.name || item.id}". Price cannot be zero.` });
        return;
      }
      if (realPrice > 0) {
        item.price = realPrice.toFixed(2);
      }
    }

    // Map items to VAT adjusted prices
    const items = rawItems.map((item: any) => ({
      ...item,
      price: getAdjustedPrice(parseFloat(item.price)).toFixed(2)
    }));

    const subtotal = items.reduce((acc: number, item: any) => acc + (parseFloat(item.price) * item.quantity), 0);


    // Load buy2get1 configuration
    const buy2get1Setting = await prisma.setting.findUnique({ where: { key: 'buy2get1_config' } });
    const buy2get1Config = buy2get1Setting ? (buy2get1Setting.value as any) : { active: true, category_ids: [] };

    // Fetch product details to check category eligibility and calculate buy2get1 discount
    const productIds = items.map((i: any) => i.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        productCategories: { include: { category: true } }
      }
    });
    const productMap = new Map<string, any>();
    dbProducts.forEach(p => productMap.set(p.id, p));

    const isPromoActive = buy2get1Config.active !== false && order_type !== 'Wholesale';
    
    // Support both category_ids array and category_id string fallback
    const eligibleCatIds = buy2get1Config.category_ids 
      ? buy2get1Config.category_ids 
      : (buy2get1Config.category_id ? [buy2get1Config.category_id] : []);

    const isProductEligibleForPromo = (product: any, eligibleCatIds: string[]) => {
      if (!buy2get1Config.category_ids && !buy2get1Config.category_id) return true;
      if (eligibleCatIds.includes('all') || eligibleCatIds.includes('')) return true;
      if (eligibleCatIds.length === 0) return false;
      if (!product) return false;
      if (eligibleCatIds.includes(product.category_id) || eligibleCatIds.includes(product.category?.id)) return true;
      if (product.category?.parent_id && eligibleCatIds.includes(product.category.parent_id)) return true;
      if (product.productCategories && Array.isArray(product.productCategories)) {
        for (const pc of product.productCategories) {
          if (eligibleCatIds.includes(pc.category_id) || eligibleCatIds.includes(pc.category?.id)) return true;
          if (pc.category?.parent_id && eligibleCatIds.includes(pc.category.parent_id)) return true;
        }
      }
      return false;
    };

    const expandedUnits: { price: number; id: string }[] = [];
    for (const item of items) {
      const product = productMap.get(item.id);
      const isEligible = isPromoActive && isProductEligibleForPromo(product, eligibleCatIds);
      if (isEligible) {
        for (let i = 0; i < item.quantity; i++) {
          expandedUnits.push({ price: parseFloat(item.price), id: item.id });
        }
      }
    }

    const sortedUnits = [...expandedUnits].sort((a, b) => a.price - b.price);
    const freeUnitsCount = Math.floor(sortedUnits.length / 3);
    let buy2get1Discount = 0;
    for (let i = 0; i < freeUnitsCount; i++) {
      buy2get1Discount += sortedUnits[i].price;
    }

    let coupon = null;
    let couponDiscount = 0;

    if (coupon_code) {
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: String(coupon_code).toUpperCase().trim() }
      });

      if (dbCoupon && dbCoupon.active) {
        const isNotExpired = !dbCoupon.expires_at || new Date(dbCoupon.expires_at) >= new Date();
        const matchesMinOrder = !dbCoupon.min_order_subtotal || subtotal >= Number(dbCoupon.min_order_subtotal);

        if (isNotExpired && matchesMinOrder) {
          coupon = dbCoupon;
          if (dbCoupon.discount_type === 'percentage') {
            couponDiscount = subtotal * (Number(dbCoupon.discount_value) / 100);
          } else {
            couponDiscount = Number(dbCoupon.discount_value);
          }
          couponDiscount = Math.min(couponDiscount, subtotal);
        }
      }
    }

    const discountAmount = Math.min(couponDiscount + buy2get1Discount, subtotal);
    const factor = (subtotal - discountAmount) / subtotal;

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: (() => {
            if (!item.image_url) return [];
            if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
              return [item.image_url];
            }
            const domain = process.env.FRONTEND_URL || 'https://baristyle.de';
            const base = (domain.startsWith('http://') || domain.startsWith('https://')) ? domain : `https://${domain}`;
            return [`${base.replace(/\/$/, '')}${item.image_url}`];
          })(),
          metadata: {
            product_id: item.id || '',
            sku: item.sku || '',
          }
        },
        unit_amount: Math.round(parseFloat(item.price) * factor * 100),
      },
      quantity: item.quantity,
    }));

    let session;
    try {
      // 1. Standard Stripe Checkout Session using account default live configuration
      session = await getStripe().checkout.sessions.create({
        customer_email: (customer_email && customer_email.includes('@')) ? customer_email.trim() : undefined,
        line_items: lineItems,
        mode: 'payment',
        billing_address_collection: 'auto',
        shipping_address_collection: {
          allowed_countries: customerCountry === 'OTHER'
            ? [
                'CH', 'NO', 'GB', 'US', 'CA', 'AU', 'AE', 'SA', 'EG',
                'JO', 'QA', 'BH', 'OM', 'KW', 'TR'
              ]
            : [customerCountry],
        },
        phone_number_collection: {
          enabled: true,
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout`,
        shipping_options: shipping_fee && parseFloat(String(shipping_fee)) > 0 ? [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: Math.round(parseFloat(String(shipping_fee)) * 100),
                currency: 'eur',
              },
              display_name: shipping_name || 'Standard Shipping',
            },
          },
        ] : undefined,
        metadata: (() => {
          const meta: any = {
            order_type: order_type || 'Retail',
            locale: locale || 'de',
            coupon_code: coupon ? coupon.code : '',
            discount_amount: discountAmount.toFixed(2),
            customer_name: (customer_name || '').substring(0, 100),
            customer_phone: (customer_phone || '').substring(0, 50),
            shipping_address: (shipping_address || '').substring(0, 450),
          };
          const jsonStr = JSON.stringify(items.map((i: any) => ({
            id: i.id,
            price: (parseFloat(i.price) * factor).toFixed(2),
            quantity: i.quantity,
          })));
          const chunkSize = 400;
          let chunkIdx = 0;
          for (let offset = 0; offset < jsonStr.length; offset += chunkSize) {
            meta[`cart_chunk_${chunkIdx}`] = jsonStr.substring(offset, offset + chunkSize);
            chunkIdx++;
          }
          return meta;
        })(),
      });
    } catch (primaryErr: any) {
      console.warn("⚠️ Standard session creation notice, trying payment method types fallback...", primaryErr?.message || primaryErr);
      try {
        // 2. Try explicit supported payment method types
        session = await getStripe().checkout.sessions.create({
          line_items: lineItems,
          mode: 'payment',
          payment_method_types: ['card', 'klarna', 'sepa_debit', 'giropay', 'ideal', 'eps', 'bancontact'] as any,
          billing_address_collection: 'auto',
          shipping_address_collection: {
            allowed_countries: customerCountry === 'OTHER'
              ? [
                  'CH', 'NO', 'GB', 'US', 'CA', 'AU', 'AE', 'SA', 'EG',
                  'JO', 'QA', 'BH', 'OM', 'KW', 'TR'
                ]
              : [customerCountry],
          },
          phone_number_collection: {
            enabled: true,
          },
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout`,
          shipping_options: shipping_fee && parseFloat(String(shipping_fee)) > 0 ? [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: {
                  amount: Math.round(parseFloat(String(shipping_fee)) * 100),
                  currency: 'eur',
                },
                display_name: shipping_name || 'Standard Shipping',
              },
            },
          ] : undefined,
          metadata: (() => {
            const meta: any = {
              order_type: order_type || 'Retail',
              locale: locale || 'de',
              coupon_code: coupon ? coupon.code : '',
              discount_amount: discountAmount.toFixed(2),
            };
            const jsonStr = JSON.stringify(items.map((i: any) => ({
              id: i.id,
              price: (parseFloat(i.price) * factor).toFixed(2),
              quantity: i.quantity,
            })));
            const chunkSize = 400;
            let chunkIdx = 0;
            for (let offset = 0; offset < jsonStr.length; offset += chunkSize) {
              meta[`cart_chunk_${chunkIdx}`] = jsonStr.substring(offset, offset + chunkSize);
              chunkIdx++;
            }
            return meta;
          })(),
        });
      } catch (stripeErr: any) {
        console.warn("⚠️ Explicit payment methods session creation notice, using card fallback...", stripeErr?.message || stripeErr);
        session = await getStripe().checkout.sessions.create({
          line_items: lineItems,
          mode: 'payment',
          payment_method_types: ['card'],
          billing_address_collection: 'auto',
          shipping_address_collection: {
            allowed_countries: customerCountry === 'OTHER'
              ? [
                  'CH', 'NO', 'GB', 'US', 'CA', 'AU', 'AE', 'SA', 'EG',
                  'JO', 'QA', 'BH', 'OM', 'KW', 'TR'
                ]
              : [customerCountry],
          },
          phone_number_collection: {
            enabled: true,
          },
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout`,
          shipping_options: shipping_fee && parseFloat(String(shipping_fee)) > 0 ? [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: {
                  amount: Math.round(parseFloat(String(shipping_fee)) * 100),
                  currency: 'eur',
                },
                display_name: shipping_name || 'Standard Shipping',
              },
            },
          ] : undefined,
          metadata: (() => {
            const meta: any = {
              order_type: order_type || 'Retail',
              locale: locale || 'de',
              coupon_code: coupon ? coupon.code : '',
              discount_amount: discountAmount.toFixed(2),
            };
            const jsonStr = JSON.stringify(items.map((i: any) => ({
              id: i.id,
              price: (parseFloat(i.price) * factor).toFixed(2),
              quantity: i.quantity,
            })));
            const chunkSize = 400;
            let chunkIdx = 0;
            for (let offset = 0; offset < jsonStr.length; offset += chunkSize) {
              meta[`cart_chunk_${chunkIdx}`] = jsonStr.substring(offset, offset + chunkSize);
              chunkIdx++;
            }
            return meta;
          })(),
        });
      }
    }





    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    try {
      const fs = require('fs');
      const path = require('path');
      const logMsg = `[${new Date().toISOString()}] Stripe Error: ${error?.stack || error?.message || error}\n`;
      fs.appendFileSync(path.join(__dirname, '../../checkout_error.log'), logMsg);
    } catch (e) {}
    res.status(500).json({ message: 'Failed to create checkout session', error: error?.message });
  }
});

// GET /api/checkout/order/:sessionId — fetch order details for success page
router.get('/order/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId);
    let order = await prisma.order.findUnique({
      where: { stripe_session_id: sessionId },
      include: { items: true },
    });

    if (!order) {
      // Try retrieving from Stripe directly (fallback if webhook is slow or disabled on localhost)
      if (sessionId.startsWith('cs_')) {
        try {
          const session = (await getStripe().checkout.sessions.retrieve(sessionId)) as any;
          if (session && session.payment_status === 'paid') {
            console.log(`⚠️ Order not found in DB but paid on getStripe(). Creating dynamically for: ${sessionId}`);
            let cartItems: any[] = [];
            cartItems = await enrichCartItems(parseCartItemsFromMetadata(session.metadata));

            const totalAmount = (session.amount_total || 0) / 100;
            const shippingAmount = (session.shipping_cost?.amount_total || 0) / 100;
            const orderType = session.metadata?.order_type || 'Retail';
            const locale = session.metadata?.locale || 'de';
            const couponCode = session.metadata?.coupon_code || null;
            const discountAmount = session.metadata?.discount_amount ? parseFloat(session.metadata.discount_amount) : 0;

            const phone = session.customer_details?.phone || null;
            const name = session.shipping_details?.name || session.customer_details?.name || null;
            const email = session.customer_details?.email || null;
            
            let userId: string | null = null;
            if (email) {
              const matchedUser = await prisma.user.findUnique({ where: { email } });
              if (matchedUser) {
                userId = matchedUser.id;
              }
            }

            let shippingAddress: string | null = null;
            if (session.shipping_details?.address) {
              const addr = session.shipping_details.address;
              const parts = [
                addr.line1,
                addr.line2,
                addr.postal_code,
                addr.city,
                addr.state,
                addr.country
              ].filter(Boolean);
              shippingAddress = parts.join(', ');
            }

            order = await prisma.order.create({
              data: {
                stripe_session_id: session.id,
                stripe_payment_id: session.payment_intent as string || null,
                user_id: userId,
                customer_email: email,
                customer_name: name,
                customer_phone: phone,
                shipping_address: shippingAddress,
                order_type: orderType,
                locale: locale,
                coupon_code: couponCode,
                discount_amount: discountAmount,
                status: 'PAID',
                total_amount: totalAmount,
                currency: session.currency || 'eur',
                shipping_amount: shippingAmount,
                items: {
                  create: cartItems.map((item: any) => ({
                    product_id: item.id || null,
                    sku: item.sku || null,
                    name: item.name,
                    image_url: item.image_url || null,
                    quantity: item.quantity,
                    unit_price: parseFloat(item.price),
                    total_price: parseFloat(item.price) * item.quantity,
                  }))
                }
              },
              include: { items: true }
            });

            // Assign digital product keys if any
            await assignDigitalKeys(order);
            sendTikTokPurchaseEvent(order, req.ip, req.headers['user-agent'] as string);

            // Send email confirmation to customer and admin notification
            try {
              if (order.customer_email) {
                await sendOrderInvoiceEmail(order.customer_email, order);
              }
              await sendAdminOrderNotificationEmail(order);
            } catch (mailError) {
              console.error('Failed to send order emails on success page:', mailError);
            }

            // Log order creation
            await log({
              action: 'ORDER_CREATED',
              category: 'orders',
              actor: order.customer_email || 'customer',
              target: `Order #ORD-${order.id.substring(0, 6).toUpperCase()}`,
              target_id: order.id,
              details: { customer: order.customer_name, total: order.total_amount, items: order.items?.length }
            });

            // Decrement stock
            for (const item of cartItems) {
              if (item.id) {
                try {
                  await prisma.product.update({
                    where: { id: item.id },
                    data: { stock_quantity: { decrement: item.quantity } }
                  });
                  syncStockToEbayIfLinked(item.id);
                } catch (stockError) {
                  console.error('Failed to decrement stock:', stockError);
                }
              }
            }
          }
        } catch (stripeErr) {
          console.error("Failed to recover order from Stripe session:", stripeErr);
        }
      }
    }

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// POST /api/checkout/webhook  — Stripe sends events here
// Must use raw body (not JSON parsed) so the signature is valid
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: any;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).json({ message: `Webhook Error: ${err.message}` });
    return;
  }

  // Handle payment events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      console.log(`✅ Payment completed! Session: ${session.id} | Amount: €${(session.amount_total! / 100).toFixed(2)}`);

      try {
        // Parse cart items from session metadata
        let cartItems: any[] = [];
        cartItems = await enrichCartItems(parseCartItemsFromMetadata(session.metadata));

        // Calculate amounts
        const totalAmount = (session.amount_total || 0) / 100;
        const shippingAmount = (session.shipping_cost?.amount_total || 0) / 100;

        // Order metadata
        const orderType = session.metadata?.order_type || 'Retail';
        const locale = session.metadata?.locale || 'de';
        const couponCode = session.metadata?.coupon_code || null;
        const discountAmount = session.metadata?.discount_amount ? parseFloat(session.metadata.discount_amount) : 0;

        // Check if order already exists (idempotency)
        const existingOrder = await prisma.order.findUnique({
          where: { stripe_session_id: session.id }
        });

        if (!existingOrder) {
          const phone = session.customer_details?.phone || null;
          const name = session.shipping_details?.name || session.customer_details?.name || null;
          const email = session.customer_details?.email || null;

          let userId: string | null = null;
          if (email) {
            const matchedUser = await prisma.user.findUnique({ where: { email } });
            if (matchedUser) {
              userId = matchedUser.id;
            }
          }
          
          let shippingAddress: string | null = null;
          if (session.shipping_details?.address) {
            const addr = session.shipping_details.address;
            const parts = [
              addr.line1,
              addr.line2,
              addr.postal_code,
              addr.city,
              addr.state,
              addr.country
            ].filter(Boolean);
            shippingAddress = parts.join(', ');
          }

          // Create order in database
          const newOrder = await prisma.order.create({
            data: {
              stripe_session_id: session.id,
              stripe_payment_id: session.payment_intent as string || null,
              user_id: userId,
              customer_email: email,
              customer_name: name,
              customer_phone: phone,
              shipping_address: shippingAddress,
              order_type: orderType,
              locale: locale,
              coupon_code: couponCode,
              discount_amount: discountAmount,
              status: 'PAID',
              total_amount: totalAmount,
              currency: session.currency || 'eur',
              shipping_amount: shippingAmount,
              items: {
                create: cartItems.map((item: any) => ({
                  product_id: item.id || null,
                  sku: item.sku || null,
                  name: item.name,
                  image_url: item.image_url || null,
                  quantity: item.quantity,
                  unit_price: parseFloat(item.price),
                  total_price: parseFloat(item.price) * item.quantity,
                }))
              }
            },
            include: { items: true }
          });
          console.log(`📦 Order saved to DB for session: ${session.id}`);

          // Assign digital product keys if any
          await assignDigitalKeys(newOrder);
          sendTikTokPurchaseEvent(newOrder);

          // Send email confirmation and admin notification
          try {
            if (newOrder.customer_email) {
              await sendOrderInvoiceEmail(newOrder.customer_email, newOrder);
            }
            await sendAdminOrderNotificationEmail(newOrder);
          } catch (mailError) {
            console.error('Failed to send order emails on webhook:', mailError);
          }

          // Decrement stock for each purchased product
          for (const item of cartItems) {
            if (item.id) {
              try {
                const product = await prisma.product.findUnique({ where: { id: item.id }, select: { stock_quantity: true } });
                if (product && product.stock_quantity < item.quantity) {
                  console.warn(`⚠️ Stock warning: Product ${item.id} has ${product.stock_quantity} in stock but ${item.quantity} were purchased`);
                }
                await prisma.product.update({
                  where: { id: item.id },
                  data: { stock_quantity: { decrement: item.quantity } }
                });
                syncStockToEbayIfLinked(item.id);
                console.log(`📉 Decremented stock for product ${item.id} by ${item.quantity}`);
              } catch (stockError) {
                console.error(`Failed to decrement stock for product ${item.id}:`, stockError);
              }
            }
          }
        } else {
          const phone = session.customer_details?.phone || null;
          const name = session.shipping_details?.name || session.customer_details?.name || null;
          
          let shippingAddress: string | null = null;
          if (session.shipping_details?.address) {
            const addr = session.shipping_details.address;
            const parts = [
              addr.line1,
              addr.line2,
              addr.postal_code,
              addr.city,
              addr.state,
              addr.country
            ].filter(Boolean);
            shippingAddress = parts.join(', ');
          }

          // Update status if needed
          const updatedOrder = await prisma.order.update({
            where: { stripe_session_id: session.id },
            data: { 
              status: 'PAID', 
              stripe_payment_id: session.payment_intent as string || null,
              customer_name: name,
              customer_phone: phone,
              shipping_address: shippingAddress,
              order_type: orderType,
              coupon_code: couponCode,
              discount_amount: discountAmount
            },
            include: { items: true }
          });
          console.log(`🔄 Order status updated for session: ${session.id}`);

          // Send email confirmation and admin notification if status changed to PAID
          if (existingOrder.status !== 'PAID') {
            await assignDigitalKeys(updatedOrder);
            sendTikTokPurchaseEvent(updatedOrder);
            try {
              if (updatedOrder.customer_email) {
                await sendOrderInvoiceEmail(updatedOrder.customer_email, updatedOrder);
              }
              await sendAdminOrderNotificationEmail(updatedOrder);
            } catch (mailError) {
              console.error('Failed to send order emails on webhook status update:', mailError);
            }
          }
        }
      } catch (dbError) {
        console.error('❌ Failed to save order to DB:', dbError);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as any;
      console.log(`❌ Payment failed: ${intent.id}`);
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
});

// POST /api/checkout/create-paypal-order
router.post('/create-paypal-order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { items: rawItems, coupon_code, order_type, shipping_fee, shipping_name, locale, customer_country, vat_number, is_reverse_charge, customer_email, customer_name, customer_phone, shipping_address } = req.body;

    if (!rawItems || rawItems.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    // Load VAT settings
    const vatSetting = await prisma.setting.findUnique({ where: { key: 'vat_config' } });
    const vatConfig = vatSetting ? (vatSetting.value as any) : { rate: 19, type: 'inclusive' };
    const defaultRate = Number(vatConfig.rate || 19);
    const isExclusive = vatConfig.type === 'exclusive' || order_type === 'Wholesale';

    const customerCountry = customer_country || 'DE';
    const isNonEU = !EU_VAT_RATES[customerCountry];

    // Validate VAT ID for reverse charge
    let isReverseCharge = false;
    if (customerCountry !== 'DE') {
      if (order_type === 'Wholesale' && vat_number) {
        isReverseCharge = true;
      } else if (vat_number) {
        const cleaned = vat_number.replace(/[\s\-\.]/g, '').toUpperCase();
        const countryCode = cleaned.slice(0, 2);
        const number = cleaned.slice(2);
        
        if (EU_VAT_RATES[countryCode] && number.length >= 4) {
          try {
            const viesRes = await axios.post(
              'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number',
              {
                countryCode,
                vatNumber: number
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 4000,
              }
            );
            isReverseCharge = viesRes.data?.valid === true;
          } catch (e) {
            console.error("VIES verification failed, fallback to frontend parameter:", e);
            isReverseCharge = is_reverse_charge === true;
          }
        } else {
          isReverseCharge = is_reverse_charge === true;
        }
      } else {
        isReverseCharge = is_reverse_charge === true;
      }
    } else {
      isReverseCharge = false;
    }

    const appliedVatRate = (isReverseCharge || isNonEU)
      ? 0
      : (EU_VAT_RATES[customerCountry] ?? defaultRate);

    const getAdjustedPrice = (priceVal: number) => {
      if (isExclusive) {
        return priceVal * (1 + appliedVatRate / 100);
      } else {
        const netPrice = priceVal / (1 + defaultRate / 100);
        return netPrice * (1 + appliedVatRate / 100);
      }
    };

    // ─────────────────────────────────────────────────────────────────
    // SECURITY (PayPal): Re-fetch authoritative prices from DB. NEVER trust frontend prices.
    // ─────────────────────────────────────────────────────────────────
    const rawPriceIds2 = rawItems.map((i: any) => i.id).filter(Boolean);
    const dbPriceProducts2 = await prisma.product.findMany({
      where: { id: { in: rawPriceIds2 } }
    });
    const dbPriceMap2 = new Map<string, any>();
    dbPriceProducts2.forEach((p: any) => dbPriceMap2.set(p.id, p));

    // Determine B2B status from JWT
    let isAuthB2B2 = false;
    const authHdr2 = req.headers['authorization'];
    if (authHdr2 && authHdr2.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded: any = jwt.verify(authHdr2.slice(7), process.env.JWT_SECRET || 'secret');
        isAuthB2B2 = decoded?.role === 'SUPER_ADMIN' || decoded?.role === 'SELLER';
      } catch {}
    }

    // Validate & override item prices with server-side DB prices
    for (const item of rawItems) {
      const dbProduct = dbPriceMap2.get(item.id);
      if (!dbProduct) continue;
      const isWholesaleReq2 = order_type === 'Wholesale';
      const realPrice2 = (isAuthB2B2 && isWholesaleReq2)
        ? parseFloat(dbProduct.b2b_price || dbProduct.price || 0)
        : parseFloat(dbProduct.sales_price_with_tax || dbProduct.price || dbProduct.retail_price || 0);
      const submittedPrice2 = parseFloat(item.price);
      if (submittedPrice2 <= 0) {
        res.status(400).json({ message: `Invalid price for "${item.name || item.id}". Price cannot be zero.` });
        return;
      }
      if (realPrice2 > 0) {
        item.price = realPrice2.toFixed(2);
      }
    }

    // Map items to VAT adjusted prices
    const items = rawItems.map((item: any) => ({
      ...item,
      price: getAdjustedPrice(parseFloat(item.price)).toFixed(2)
    }));

    const subtotal = items.reduce((acc: number, item: any) => acc + (parseFloat(item.price) * item.quantity), 0);


    // Load buy2get1 configuration
    const buy2get1Setting = await prisma.setting.findUnique({ where: { key: 'buy2get1_config' } });
    const buy2get1Config = buy2get1Setting ? (buy2get1Setting.value as any) : { active: true, category_ids: [] };

    // Fetch product details to check category eligibility and calculate buy2get1 discount
    const productIds = items.map((i: any) => i.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        productCategories: { include: { category: true } }
      }
    });
    const productMap = new Map<string, any>();
    dbProducts.forEach(p => productMap.set(p.id, p));

    const isPromoActive = buy2get1Config.active !== false && order_type !== 'Wholesale';
    
    // Support both category_ids array and category_id string fallback
    const eligibleCatIds = buy2get1Config.category_ids 
      ? buy2get1Config.category_ids 
      : (buy2get1Config.category_id ? [buy2get1Config.category_id] : []);

    const isProductEligibleForPromo = (product: any, eligibleCatIds: string[]) => {
      if (!buy2get1Config.category_ids && !buy2get1Config.category_id) return true;
      if (eligibleCatIds.includes('all') || eligibleCatIds.includes('')) return true;
      if (eligibleCatIds.length === 0) return false;
      if (!product) return false;
      if (eligibleCatIds.includes(product.category_id) || eligibleCatIds.includes(product.category?.id)) return true;
      if (product.category?.parent_id && eligibleCatIds.includes(product.category.parent_id)) return true;
      if (product.productCategories && Array.isArray(product.productCategories)) {
        for (const pc of product.productCategories) {
          if (eligibleCatIds.includes(pc.category_id) || eligibleCatIds.includes(pc.category?.id)) return true;
          if (pc.category?.parent_id && eligibleCatIds.includes(pc.category.parent_id)) return true;
        }
      }
      return false;
    };

    const expandedUnits: { price: number; id: string }[] = [];
    for (const item of items) {
      const product = productMap.get(item.id);
      const isEligible = isPromoActive && isProductEligibleForPromo(product, eligibleCatIds);
      if (isEligible) {
        for (let i = 0; i < item.quantity; i++) {
          expandedUnits.push({ price: parseFloat(item.price), id: item.id });
        }
      }
    }

    const sortedUnits = [...expandedUnits].sort((a, b) => a.price - b.price);
    const freeUnitsCount = Math.floor(sortedUnits.length / 3);
    let buy2get1Discount = 0;
    for (let i = 0; i < freeUnitsCount; i++) {
      buy2get1Discount += sortedUnits[i].price;
    }

    let coupon = null;
    let couponDiscount = 0;

    if (coupon_code) {
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: String(coupon_code).toUpperCase().trim() }
      });

      if (dbCoupon && dbCoupon.active) {
        const isNotExpired = !dbCoupon.expires_at || new Date(dbCoupon.expires_at) >= new Date();
        const matchesMinOrder = !dbCoupon.min_order_subtotal || subtotal >= Number(dbCoupon.min_order_subtotal);

        if (isNotExpired && matchesMinOrder) {
          coupon = dbCoupon;
          if (dbCoupon.discount_type === 'percentage') {
            couponDiscount = subtotal * (Number(dbCoupon.discount_value) / 100);
          } else {
            couponDiscount = Number(dbCoupon.discount_value);
          }
          couponDiscount = Math.min(couponDiscount, subtotal);
        }
      }
    }

    const discountAmount = Math.min(couponDiscount + buy2get1Discount, subtotal);
    const factor = (subtotal - discountAmount) / subtotal;
    const shipping = shipping_fee ? parseFloat(String(shipping_fee)) : 0;
    const finalTotal = subtotal - discountAmount + shipping;

    // Call PayPal to create Order
    const accessToken = await getPayPalAccessToken();
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/checkout/paypal-success`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout`;

    const paypalOrderPayload: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: finalTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: (subtotal - discountAmount).toFixed(2),
              },
              shipping: {
                currency_code: 'EUR',
                value: shipping.toFixed(2),
              }
            }
          }
        }
      ],
      application_context: {
        brand_name: 'BS Baristore',
        locale: locale === 'ar' ? 'ar-AE' : (locale === 'de' ? 'de-DE' : 'en-US'),
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      }
    };

    if (customer_email && customer_email.includes('@')) {
      paypalOrderPayload.payer = {
        email_address: customer_email.trim(),
      };
      if (customer_name && customer_name.trim()) {
        const parts = customer_name.trim().split(' ');
        paypalOrderPayload.payer.name = {
          given_name: parts[0] || 'Customer',
          surname: parts.slice(1).join(' ') || ''
        };
      }
    }

    const response = await axios.post(
      `${getPayPalBaseUrl()}/v2/checkout/orders`,
      paypalOrderPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    const paypalOrder = response.data;
    const approveUrlObj = paypalOrder.links.find((l: any) => l.rel === 'approve');
    if (!approveUrlObj) {
      throw new Error('PayPal approve link not found');
    }

    // Store in database with status PENDING
    // Note: stripe_session_id is unique, so we will store the PayPal Order ID there!
    // We will save the items so they can be retrieved/restored on success/verification.
    const cartItemsMetadata = items.map((i: any) => ({
      id: i.id,
      sku: i.sku,
      name: i.name,
      image_url: i.image_url,
      price: (parseFloat(i.price) * factor).toFixed(2),
      quantity: i.quantity,
    }));

    await prisma.order.create({
      data: {
        stripe_session_id: paypalOrder.id, // Using paypal order id here
        stripe_payment_id: null,
        user_id: null,
        customer_email: customer_email || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        shipping_address: shipping_address || null,
        order_type: order_type || 'Retail',
        locale: locale || 'de',
        coupon_code: coupon ? coupon.code : '',
        discount_amount: discountAmount,
        shipping_provider: customerCountry, // Store selected country code
        status: 'PENDING',
        total_amount: finalTotal,
        currency: 'eur',
        shipping_amount: shipping,
        items: {
          create: cartItemsMetadata.map((item: any) => ({
            product_id: item.id || null,
            sku: item.sku || null,
            name: item.name,
            image_url: item.image_url || null,
            quantity: item.quantity,
            unit_price: parseFloat(item.price),
            total_price: parseFloat(item.price) * item.quantity,
          }))
        }
      }
    });

    res.json({ id: paypalOrder.id, url: approveUrlObj.href });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', error?.response?.data || error);
    try {
      const fs = require('fs');
      const path = require('path');
      const logMsg = `[${new Date().toISOString()}] PayPal Error: ${JSON.stringify(error?.response?.data || error?.message || error)}\n`;
      fs.appendFileSync(path.join(__dirname, '../../checkout_error.log'), logMsg);
    } catch (e) {}
    res.status(500).json({ message: 'Failed to create PayPal order', error: error?.message || error });
  }
});

// GET /api/checkout/paypal-success
router.get('/paypal-success', async (req: Request, res: Response): Promise<void> => {
  const token = req.query.token as string;
  const payerId = req.query.PayerID as string;

  if (!token) {
    res.status(400).send('PayPal token is missing');
    return;
  }

  try {
    const accessToken = await getPayPalAccessToken();

    // 1. Retrieve order details from PayPal first to check the shipping country
    const getOrderUrl = `${getPayPalBaseUrl()}/v2/checkout/orders/${token}`;
    const orderDetailsRes = await axios.get(
      getOrderUrl,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );
    const orderDetails = orderDetailsRes.data;

    // 2. Retrieve corresponding order from DB
    const existingOrder = await prisma.order.findUnique({
      where: { stripe_session_id: token },
      include: { items: true }
    });

    if (!existingOrder) {
      console.error(`PayPal success: order with token/session_id ${token} not found in DB`);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?error=order_not_found`);
      return;
    }

    // 3. Verify shipping country code - auto-accept country from PayPal without blocking buyer
    const purchaseUnitDetails = orderDetails.purchase_units?.[0] || {};
    const paypalCountry = purchaseUnitDetails.shipping?.address?.country_code; // e.g. 'DE'

    if (existingOrder.shipping_provider && paypalCountry) {
      const selectedCountry = existingOrder.shipping_provider;
      if (selectedCountry.toUpperCase() !== paypalCountry.toUpperCase()) {
        console.log(`ℹ️ PayPal notice: Store selected country was ${selectedCountry}, PayPal shipping country is ${paypalCountry}. Proceeding with capture.`);
      }
    }

    // 4. Capture the payment using PayPal API
    const captureUrl = `${getPayPalBaseUrl()}/v2/checkout/orders/${token}/capture`;
    const response = await axios.post(
      captureUrl,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    const orderData = response.data;
    if (orderData.status !== 'COMPLETED') {
      console.error('PayPal Order Capture status is not COMPLETED:', orderData.status);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?error=paypal_failed`);
      return;
    }

    // Extract payer details
    const payer = orderData.payer || {};
    const email = payer.email_address || null;
    const firstName = payer.name?.given_name || '';
    const lastName = payer.name?.surname || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || null;
    const phone = payer.phone?.phone_number?.national_number || null;

    // Get shipping details
    const purchaseUnit = orderData.purchase_units?.[0] || {};
    const shipping = purchaseUnit.shipping || {};
    const shippingName = shipping.name?.full_name || name;
    
    let shippingAddress = null;
    if (shipping.address) {
      const addr = shipping.address;
      const parts = [
        addr.address_line_1,
        addr.address_line_2,
        addr.admin_area_2,
        addr.postal_code,
        addr.country_code
      ].filter(Boolean);
      shippingAddress = parts.join(', ');
    }

    // Try to find matching user ID by email
    let userId = existingOrder.user_id;
    if (email && !userId) {
      const matchedUser = await prisma.user.findUnique({ where: { email } });
      if (matchedUser) {
        userId = matchedUser.id;
      }
    }

    // Update order status to PAID and update client information from PayPal
    const updatedOrder = await prisma.order.update({
      where: { stripe_session_id: token },
      data: {
        status: 'PAID',
        stripe_payment_id: orderData.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        customer_email: email || existingOrder.customer_email,
        customer_name: shippingName || existingOrder.customer_name,
        customer_phone: phone || existingOrder.customer_phone,
        shipping_address: shippingAddress || existingOrder.shipping_address,
        user_id: userId,
      },
      include: { items: true }
    });

    console.log(`📦 PayPal Order ${token} captured and status set to PAID in DB.`);

    // Assign digital product keys if any
    await assignDigitalKeys(updatedOrder);
    sendTikTokPurchaseEvent(updatedOrder, req.ip, req.headers['user-agent'] as string);

    // Decrement stock
    for (const item of updatedOrder.items) {
      if (item.product_id) {
        try {
          await prisma.product.update({
            where: { id: item.product_id },
            data: { stock_quantity: { decrement: item.quantity } }
          });
          syncStockToEbayIfLinked(item.product_id);
          console.log(`📉 PayPal stock decrement: product ${item.product_id} by ${item.quantity}`);
        } catch (stockError) {
          console.error(`Failed to decrement stock for product ${item.product_id}:`, stockError);
        }
      }
    }

    // Send emails
    try {
      if (updatedOrder.customer_email) {
        await sendOrderInvoiceEmail(updatedOrder.customer_email, updatedOrder);
      }
      await sendAdminOrderNotificationEmail(updatedOrder);
    } catch (mailError) {
      console.error('Failed to send order emails on PayPal success:', mailError);
    }

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id=${token}`);
  } catch (error: any) {
    console.error('PayPal success capture error:', error?.response?.data || error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?error=paypal_capture_failed`);
  }
});

export async function assignDigitalKeys(order: any) {
  if (!order || !order.items || order.items.length === 0) return;

  for (const item of order.items) {
    if (!item.product_id) continue;

    try {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id }
      });

      if (!product) continue;

      const attrs = (product.attributes as any) || {};
      if (attrs.isDigital) {
        const digitalKeys = attrs.digitalKeys || [];
        const soldKeys = attrs.soldKeys || {};

        // Avoid double-assignment if webhook runs multiple times
        if (soldKeys[order.id]) {
          console.log(`🔑 Digital keys already assigned for order ${order.id} and product ${product.id}`);
          continue;
        }

        // Pull quantity of keys
        const qty = item.quantity;
        let assigned = [];
        let remaining = digitalKeys;
        let nextStock = product.stock_quantity;

        if (attrs.isMultiUse) {
          const keyToUse = digitalKeys[0] || 'DEMO-KEY-REPLACE-ME';
          assigned = Array(qty).fill(keyToUse);
          nextStock = Math.max(0, product.stock_quantity - qty);
        } else {
          assigned = digitalKeys.slice(0, qty);
          remaining = digitalKeys.slice(qty);
          nextStock = remaining.length;
          attrs.digitalKeys = remaining;
        }

        soldKeys[order.id] = assigned;
        attrs.soldKeys = soldKeys;

        // Update database
        await prisma.product.update({
          where: { id: product.id },
          data: {
            attributes: attrs,
            stock_quantity: nextStock
          }
        });

        console.log(`🔑 Assigned ${assigned.length} keys to order ${order.id} for digital product ${product.id}`);
      }
    } catch (err) {
      console.error(`Error assigning digital keys for item ${item.id} in order ${order.id}:`, err);
    }
  }
}

export async function releaseDigitalKeys(order: any) {
  if (!order || !order.items || order.items.length === 0) return;

  for (const item of order.items) {
    if (!item.product_id) continue;

    try {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id }
      });

      if (!product) continue;

      const attrs = (product.attributes as any) || {};
      if (attrs.isDigital) {
        const digitalKeys = attrs.digitalKeys || [];
        const soldKeys = attrs.soldKeys || {};

        // If keys were assigned to this order, return them
        const orderId = order.id;
        if (soldKeys[orderId]) {
          const assignedKeys = soldKeys[orderId] || [];
          let nextStock = product.stock_quantity;

          if (attrs.isMultiUse) {
            // Just restore stock
            nextStock = product.stock_quantity + item.quantity;
          } else {
            // Push back to unused list
            attrs.digitalKeys = [...digitalKeys, ...assignedKeys];
            nextStock = attrs.digitalKeys.length;
          }

          // Remove the keys assignment
          delete soldKeys[orderId];
          attrs.soldKeys = soldKeys;

          // Update database
          await prisma.product.update({
            where: { id: product.id },
            data: {
              attributes: attrs,
              stock_quantity: nextStock
            }
          });

          console.log(`🔑 Released ${assignedKeys.length} keys from order ${orderId} back to product ${product.id}`);
        }
      }
    } catch (err) {
      console.error(`Error releasing digital keys for item ${item.id} in order ${order.id}:`, err);
    }
  }
}

export default router;
