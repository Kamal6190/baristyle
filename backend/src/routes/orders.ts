import { Router, Response } from 'express';
import prisma from '../prismaClient';
import { optionalAuth, AuthRequest, requireRole } from '../middleware/auth';
import { OrderStatus } from '@prisma/client';
import { sendOrderInvoiceEmail, sendDigitalKeyDeliveryEmail } from '../mailer';
import { log } from '../utils/logger';

const router = Router();

// GET /api/orders/my-orders — Fetch current user's orders (Authenticated users)
router.get('/my-orders', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    let emailSearch = req.user.email;
    if (!emailSearch) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } });
      if (dbUser) {
        emailSearch = dbUser.email;
      }
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          ...(emailSearch ? [{ customer_email: emailSearch }] : [])
        ]
      },
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });

    // Enrich order items with product details (image_url, digital keys, instructions)
    const productIds = new Set<string>();
    const skus = new Set<string>();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.product_id) productIds.add(item.product_id);
        if (item.sku) skus.add(item.sku);
      }
    }

    const products = (productIds.size > 0 || skus.size > 0) ? await prisma.product.findMany({
      where: {
        OR: [
          ...(productIds.size > 0 ? [{ id: { in: Array.from(productIds) } }] : []),
          ...(skus.size > 0 ? [{ sku: { in: Array.from(skus) } }] : [])
        ]
      },
      select: {
        id: true,
        sku: true,
        image_url: true,
        translations: true,
        attributes: true
      }
    }) : [];

    const productMapById = new Map<string, any>();
    const productMapBySku = new Map<string, any>();
    for (const p of products) {
      productMapById.set(p.id, p);
      if (p.sku) productMapBySku.set(p.sku, p);
    }

    const enrichedOrders = orders.map(order => {
      const enrichedItems = order.items.map(item => {
        const prod = (item.product_id && productMapById.get(item.product_id))
          || (item.sku && productMapBySku.get(item.sku))
          || null;

        const attrs = (prod?.attributes as any) || {};
        const isDigital = Boolean(attrs.isDigital);
        const soldKeys = attrs.soldKeys || {};
        let digitalKeys: string[] = soldKeys[order.id] || [];

        // Fallback: if courier is email and tracking_number looks like a key/code
        if (digitalKeys.length === 0 && order.shipping_provider?.toLowerCase().includes('email') && order.tracking_number) {
          if (!order.tracking_number.startsWith('http')) {
            digitalKeys = [order.tracking_number];
          }
        }

        const orderInstMap = attrs.digitalInstructionsOrder || {};
        const digitalInstructions = orderInstMap[order.id]
          || (typeof attrs.digitalInstructions === 'object'
              ? (attrs.digitalInstructions[order.locale || 'de'] || attrs.digitalInstructions['de'] || attrs.digitalInstructions['en'] || attrs.digitalInstructions['ar'])
              : attrs.digitalInstructions)
          || '';

        return {
          ...item,
          product_id: item.product_id || prod?.id || null,
          sku: item.sku || prod?.sku || null,
          image_url: item.image_url || prod?.image_url || null,
          isDigital,
          digitalKeys,
          digitalInstructions
        };
      });

      return {
        ...order,
        items: enrichedItems
      };
    });

    res.json(enrichedOrders);
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// GET /api/orders/:id/invoice — Fetch single order details for invoice download (Owner or Admin)
router.get('/:id/invoice', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const isOwner = order.user_id === req.user.id || (order.customer_email && req.user.email && order.customer_email.toLowerCase() === req.user.email.toLowerCase());
    const isAdmin = req.user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const productIds = order.items.map(i => i.product_id).filter(Boolean) as string[];
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, image_url: true, attributes: true }
    }) : [];
    const prodMap = new Map(products.map(p => [p.id, p]));

    const enrichedItems = order.items.map(item => {
      const prod = item.product_id ? prodMap.get(item.product_id) : null;
      const attrs = (prod?.attributes as any) || {};
      const soldKeys = attrs.soldKeys || {};
      let digitalKeys = soldKeys[order.id] || [];
      if (digitalKeys.length === 0 && order.shipping_provider?.toLowerCase().includes('email') && order.tracking_number && !order.tracking_number.startsWith('http')) {
        digitalKeys = [order.tracking_number];
      }
      return {
        ...item,
        image_url: item.image_url || prod?.image_url || null,
        digitalKeys
      };
    });

    res.json({
      ...order,
      items: enrichedItems
    });
  } catch (error) {
    console.error('Fetch invoice error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// GET /api/orders/customers — Aggregated unique customer directory (Admin only)
router.get('/customers', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          not: 'PENDING',
        },
        customer_email: {
          not: null,
        },
      },
      select: {
        customer_name: true,
        customer_email: true,
        customer_phone: true,
        shipping_address: true,
        order_type: true,
        total_amount: true,
        status: true,
        created_at: true,
        user: {
          select: { id: true, role: true, created_at: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Group by email to get unique customers
    const customerMap = new Map<string, any>();

    for (const order of orders) {
      const email = order.customer_email || 'unknown';
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          name: order.customer_name || '—',
          email,
          phone: order.customer_phone || '—',
          address: order.shipping_address || '—',
          order_type: order.order_type || 'Retail',
          order_count: 0,
          total_spent: 0,
          last_order: order.created_at,
          user_role: order.user?.role || null,
        });
      }
      const c = customerMap.get(email);
      c.order_count += 1;
      c.total_spent += parseFloat(order.total_amount as any) || 0;
      // Update name/phone if we get better data later
      if (order.customer_name && c.name === '—') c.name = order.customer_name;
      if (order.customer_phone && c.phone === '—') c.phone = order.customer_phone;
    }

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.total_spent - a.total_spent);

    res.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// GET /api/orders — Fetch all orders with items (Admin only)
router.get('/', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// PUT /api/orders/:id/status — Update order fulfillment status (Admin only)
router.put('/:id/status', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: 'Status is required' });
      return;
    }

    // Map common display status variants (e.g. Processing -> PAID, etc.) to Prisma OrderStatus enum values
    let orderStatus: OrderStatus;
    const cleanStatus = String(status).toUpperCase();

    if (cleanStatus === 'PENDING') {
      orderStatus = OrderStatus.PENDING;
    } else if (cleanStatus === 'PAID' || cleanStatus === 'PROCESSING') {
      orderStatus = OrderStatus.PAID;
    } else if (cleanStatus === 'SHIPPED') {
      orderStatus = OrderStatus.SHIPPED;
    } else if (cleanStatus === 'DELIVERED') {
      orderStatus = OrderStatus.DELIVERED;
    } else if (cleanStatus === 'CANCELLED') {
      orderStatus = OrderStatus.CANCELLED;
    } else if (cleanStatus === 'REFUNDED') {
      orderStatus = OrderStatus.REFUNDED;
    } else {
      res.status(400).json({ message: `Invalid status code: ${status}` });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: orderStatus },
      include: { items: true }
    });

    if (orderStatus === OrderStatus.CANCELLED) {
      await releaseDigitalKeys(updatedOrder);
    }

    await log({
      action: 'ORDER_STATUS_UPDATED',
      category: 'orders',
      actor: req.user?.email || 'admin',
      target: `Order ${id.substring(0, 8).toUpperCase()}`,
      target_id: id,
      details: { new_status: orderStatus },
      req
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// PUT /api/orders/:id — Update order customer details (Admin only)
router.put('/:id', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { customer_name, customer_email, customer_phone, shipping_address, order_type } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        order_type
      },
      include: { items: true }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// PUT /api/orders/:id/ship — Update order status to SHIPPED and set courier details or digital key (Admin only)
router.put('/:id/ship', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { shipping_provider, tracking_number, digital_keys, digital_instructions } = req.body;

    if (!shipping_provider || !tracking_number) {
      res.status(400).json({ message: 'Shipping provider and tracking number are required' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.SHIPPED,
        shipping_provider,
        tracking_number
      },
      include: { items: true }
    });

    // Auto-allocate digital keys if available in stock
    await assignDigitalKeys(updatedOrder);

    // Save custom digital key(s) & instructions if provided
    if (digital_keys || digital_instructions) {
      const keysArr = typeof digital_keys === 'string'
        ? digital_keys.split('\n').map(k => k.trim()).filter(Boolean)
        : Array.isArray(digital_keys) ? digital_keys : [];

      for (const item of updatedOrder.items) {
        if (!item.product_id) continue;
        try {
          const product = await prisma.product.findUnique({ where: { id: item.product_id } });
          if (product) {
            const attrs = (product.attributes as any) || {};
            let nextStock: number | undefined = undefined;

            if (keysArr.length > 0) {
              const soldKeys = attrs.soldKeys || {};
              soldKeys[updatedOrder.id] = keysArr;
              soldKeys[id] = keysArr;
              attrs.soldKeys = soldKeys;

              // Deplete sold keys from available stock array if not multi-use
              if (!attrs.isMultiUse) {
                const keysSet = new Set(keysArr.map((k: string) => k.trim()));
                const currentKeys: string[] = Array.isArray(attrs.digitalKeys)
                  ? attrs.digitalKeys
                  : (typeof attrs.digitalKeys === 'string' ? attrs.digitalKeys.split('\n').map((k: string) => k.trim()).filter(Boolean) : []);

                const remainingKeys = currentKeys.filter((k: string) => !keysSet.has(k.trim()));
                attrs.digitalKeys = remainingKeys;
                nextStock = remainingKeys.length;
              }
            }

            if (digital_instructions) {
              const orderInstMap = attrs.digitalInstructionsOrder || {};
              orderInstMap[updatedOrder.id] = digital_instructions;
              orderInstMap[id] = digital_instructions;
              attrs.digitalInstructionsOrder = orderInstMap;
            }

            attrs.isDigital = true;
            await prisma.product.update({
              where: { id: product.id },
              data: {
                attributes: attrs,
                ...(nextStock !== undefined ? { stock_quantity: nextStock } : {})
              }
            });
          }
        } catch (err) {
          console.error(`Error saving digital key for product ${item.product_id}:`, err);
        }
      }
    }

    // Send shipment notification email & dedicated digital delivery email
    try {
      if (updatedOrder.customer_email) {
        // Send dedicated Digital Product Delivery & Activation email
        await sendDigitalKeyDeliveryEmail(updatedOrder);
        // Send Order Invoice email
        await sendOrderInvoiceEmail(updatedOrder.customer_email, updatedOrder);
      }
    } catch (mailError) {
      console.error('Failed to send shipping confirmation email:', mailError);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// POST /api/orders/:id/resend-email — Send/Resend premium order invoice HTML email (Admin only)
router.post('/:id/resend-email', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!order.customer_email) {
      res.status(400).json({ message: 'Customer email is not available on this order' });
      return;
    }

    await sendOrderInvoiceEmail(order.customer_email, order);

    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Resend invoice email error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

import { assignDigitalKeys, releaseDigitalKeys } from './checkout';

function getTranslation(field: any, lang: string): string {
  if (!field) return '';
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return parsed[lang] || parsed['de'] || parsed['en'] || parsed['ar'] || Object.values(parsed)[0] || '';
    } catch {
      return field;
    }
  }
  if (typeof field === 'object') {
    return field[lang] || field['de'] || field['en'] || field['ar'] || Object.values(field)[0] || '';
  }
  return '';
}

// PUT /api/orders/:id/items/:itemId/link — link an order item to a local product manually (Admin only)
router.put('/:id/items/:itemId/link', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ message: 'Product ID is required.' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    // Update the item details
    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        product_id: productId,
        sku: product.sku,
        name: getTranslation(product.translations, 'de') || getTranslation(product.translations, 'en') || ''
      }
    });

    // Reload order with its items
    let order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    // Check if the linked product is digital
    const attrs = (product.attributes as any) || {};
    if (attrs.isDigital) {
      // Allocate digital keys to this order
      await assignDigitalKeys(order);

      // Update status to DELIVERED
      order = await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.DELIVERED },
        include: { items: true }
      });

      // Dispatch license key email
      if (order.customer_email) {
        try {
          await sendOrderInvoiceEmail(order.customer_email, order);
        } catch (mailErr) {
          console.error('Failed to send invoice email after manual link:', mailErr);
        }
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Link order item error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// GET /api/orders/track — Public order tracking info
router.get('/track', async (req, res): Promise<void> => {
  try {
    const { orderId, email } = req.query;
    if (!orderId || !email) {
      res.status(400).json({ message: 'Order ID and Email are required' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOrderId = String(orderId).trim().toUpperCase().replace(/^ORD-/, '').toLowerCase();

    // Retrieve the first order matching the ID prefix
    const matchedOrder = await prisma.order.findFirst({
      where: {
        id: { startsWith: cleanOrderId }
      },
      include: { items: true }
    });

    if (!matchedOrder || matchedOrder.customer_email?.trim().toLowerCase() !== cleanEmail) {
      res.status(404).json({ message: 'No matching order found with the provided details.' });
      return;
    }

    res.json({
      id: matchedOrder.id,
      orderId: `ORD-${matchedOrder.id.substring(0, 6).toUpperCase()}`,
      date: matchedOrder.created_at,
      status: matchedOrder.status,
      shippingProvider: matchedOrder.shipping_provider,
      trackingNumber: matchedOrder.tracking_number,
      totalAmount: matchedOrder.total_amount,
      currency: matchedOrder.currency,
      shippingAddress: matchedOrder.shipping_address,
      items: matchedOrder.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        sku: item.sku
      }))
    });
  } catch (error) {
    console.error('Order tracking lookup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/orders/:id — Delete an order (Admin only)
router.delete('/:id', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    await prisma.order.delete({ where: { id } });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

export default router;
