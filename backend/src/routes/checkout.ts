import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../prismaClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any
});

const router = Router();

// POST /api/checkout/create-session
router.post('/create-session', async (req: Request, res: Response): Promise<void> => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [],
          metadata: {
            product_id: item.id || '',
            sku: item.sku || '',
          }
        },
        unit_amount: Math.round(parseFloat(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout`,
      metadata: {
        cart_items: JSON.stringify(items.map((i: any) => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
          image_url: i.image_url,
          price: i.price,
          quantity: i.quantity,
        }))),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// GET /api/checkout/order/:sessionId — fetch order details for success page
router.get('/order/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId);
    const order = await prisma.order.findUnique({
      where: { stripe_session_id: sessionId },
      include: { items: true },
    });

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
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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
        if (session.metadata?.cart_items) {
          cartItems = JSON.parse(session.metadata.cart_items);
        }

        // Calculate amounts
        const totalAmount = (session.amount_total || 0) / 100;
        const shippingAmount = (session.shipping_cost?.amount_total || 0) / 100;

        // Check if order already exists (idempotency)
        const existingOrder = await prisma.order.findUnique({
          where: { stripe_session_id: session.id }
        });

        if (!existingOrder) {
          // Create order in database
          await prisma.order.create({
            data: {
              stripe_session_id: session.id,
              stripe_payment_id: session.payment_intent as string || null,
              customer_email: session.customer_details?.email || null,
              customer_name: session.customer_details?.name || null,
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
            }
          });
          console.log(`📦 Order saved to DB for session: ${session.id}`);
        } else {
          // Update status if needed
          await prisma.order.update({
            where: { stripe_session_id: session.id },
            data: { status: 'PAID', stripe_payment_id: session.payment_intent as string || null }
          });
          console.log(`🔄 Order status updated for session: ${session.id}`);
        }
      } catch (dbError) {
        console.error('❌ Failed to save order to DB:', dbError);
        // Still return 200 to Stripe so it doesn't retry
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

export default router;
