import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reviews/:productId — get approved reviews for a product
router.get('/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId as string;

    let actualProductId = productId;
    if (!(productId.length === 36 && productId.includes('-'))) {
      const product = await prisma.product.findUnique({ where: { sku: productId } });
      if (product) {
        actualProductId = product.id;
      }
    }

    const reviews = await (prisma as any).review.findMany({
      where: { product_id: actualProductId, is_approved: true },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        author_name: true,
        rating: true,
        title: true,
        body: true,
        verified_purchase: true,
        created_at: true,
      }
    });

    // Calculate aggregates
    const total = reviews.length;
    const avg = total > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total
      : 0;
    const distribution = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter((r: any) => r.rating === star).length
    }));

    res.json({ reviews, average: parseFloat(avg.toFixed(1)), total, distribution });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
});

// POST /api/reviews/:productId — submit a review (logged in user, 7 days after account creation)
router.post('/:productId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId as string;
    const { rating, title, body, author_name, author_email } = req.body;

    if (!rating || !body) {
      res.status(400).json({ message: 'Rating and review text are required.' });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5.' });
      return;
    }

    let verified = false;
    let userId: string | null = null;
    let resolvedName = author_name || 'Anonymous';

    if (req.user) {
      // Check account age - must be 7+ days old
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user) {
        const daysSinceJoin = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceJoin < 7) {
          res.status(403).json({
            message: 'You can submit reviews 7 days after account creation. This helps ensure authentic reviews.'
          });
          return;
        }
        userId = user.id;
        resolvedName = user.name;
        verified = true; // logged-in users are "verified"
      }
    }

    let actualProductId = productId;
    if (!(productId.length === 36 && productId.includes('-'))) {
      const productObj = await prisma.product.findUnique({ where: { sku: productId } });
      if (productObj) {
        actualProductId = productObj.id;
      } else {
        res.status(404).json({ message: 'Product not found.' });
        return;
      }
    }

    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: actualProductId } });
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const review = await (prisma as any).review.create({
      data: {
        product_id: actualProductId,
        user_id: userId,
        author_name: resolvedName,
        author_email: author_email || null,
        rating: parseInt(rating),
        title: title || null,
        body,
        verified_purchase: verified,
        is_approved: true,
      }
    });

    res.status(201).json({ message: 'Review submitted successfully!', review });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting review', error });
  }
});

// POST /api/reviews/seed/:productId — seed fake reviews (admin only)
router.post('/seed/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId as string;

    let actualProductId = productId;
    if (!(productId.length === 36 && productId.includes('-'))) {
      const product = await prisma.product.findUnique({ where: { sku: productId } });
      if (product) {
        actualProductId = product.id;
      } else {
        res.status(404).json({ message: 'Product not found.' });
        return;
      }
    }

    const fakeReviews = [
      { author_name: 'Emma K.', rating: 5, title: 'Absolutely stunning!', body: 'This fragrance is truly one of a kind. The opening is incredibly fresh, and as it dries down it reveals the most beautiful warm base. I get compliments every time I wear it. Will definitely be repurchasing!', verified_purchase: true, days_ago: 45 },
      { author_name: 'Thomas B.', rating: 5, title: 'My new signature scent', body: 'I have been searching for my perfect fragrance for years and I think I finally found it. The longevity is impressive — still noticeable after 10 hours. The sillage is perfect, not too loud but definitely present.', verified_purchase: true, days_ago: 38 },
      { author_name: 'Sara M.', rating: 4, title: 'Sophisticated and unique', body: 'Very beautiful and complex fragrance. The notes blend seamlessly together. I give 4 stars only because the price is a bit steep, but the quality definitely justifies it. Great packaging too!', verified_purchase: true, days_ago: 62 },
      { author_name: 'Lukas H.', rating: 5, title: 'Perfect for evenings', body: 'Bought this as a gift for my partner and she absolutely loves it. The bottle is elegant and the scent is warm, sensual and long-lasting. This is luxury fragrance at its finest.', verified_purchase: false, days_ago: 20 },
      { author_name: 'Julia R.', rating: 4, title: 'Worth every cent', body: 'After reading many reviews I decided to order. Not disappointed at all! The scent is rich and smooth. It feels premium from the first spray. The only downside is I wish the bottle was a bit bigger!', verified_purchase: true, days_ago: 15 },
      { author_name: 'Ahmed F.', rating: 5, title: 'Exceptional quality', body: 'I have tried many luxury fragrances but this one stands out for its depth and character. The base notes especially are incredibly well crafted. Fast shipping and great packaging from BariStyle!', verified_purchase: true, days_ago: 30 },
    ];

    const created = [];
    for (const r of fakeReviews) {
      const date = new Date();
      date.setDate(date.getDate() - r.days_ago);
      const review = await (prisma as any).review.create({
        data: {
          product_id: actualProductId,
          user_id: null,
          author_name: r.author_name,
          rating: r.rating,
          title: r.title,
          body: r.body,
          verified_purchase: r.verified_purchase,
          is_approved: true,
          created_at: date,
        }
      });
      created.push(review);
    }

    res.json({ message: `Seeded ${created.length} reviews`, count: created.length });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding reviews', error });
  }
});

export default router;
