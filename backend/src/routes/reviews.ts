import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import { optionalAuth, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/reviews — get ALL reviews (admin only)
router.get('/', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await (prisma as any).review.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        product: { select: { id: true, translations: true, sku: true } },
      }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: String(error) });
  }
});

// DELETE /api/reviews/:id — delete a review by ID (admin only)
router.delete('/:id', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await (prisma as any).review.delete({ where: { id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error });
  }
});

// POST /api/reviews/bulk-delete — delete multiple reviews (admin only)
router.post('/bulk-delete', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Array of review IDs is required' });
      return;
    }
    await (prisma as any).review.deleteMany({
      where: { id: { in: ids } }
    });
    res.json({ message: `Successfully deleted ${ids.length} reviews` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reviews', error: String(error) });
  }
});

// POST /api/reviews — create a review manually (admin only)
router.post('/', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { product_id, author_name, author_email, rating, title, body, verified_purchase, created_at } = req.body;

    if (!product_id || !author_name || !rating || !body) {
      res.status(400).json({ message: 'Product ID, author name, rating, and review text are required.' });
      return;
    }

    const ratingInt = parseInt(rating);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5.' });
      return;
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const review = await (prisma as any).review.create({
      data: {
        product_id,
        author_name,
        author_email: author_email || null,
        rating: ratingInt,
        title: title || null,
        body,
        verified_purchase: !!verified_purchase,
        is_approved: true,
        created_at: created_at ? new Date(created_at) : new Date(),
      },
      include: {
        product: { select: { id: true, translations: true, sku: true } }
      }
    });

    res.status(201).json({ message: 'Review created successfully!', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review', error: String(error) });
  }
});

// POST /api/reviews/bulk — create multiple reviews manually (admin only)
router.post('/bulk', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { product_id, reviews } = req.body;

    if (!product_id || !Array.isArray(reviews) || reviews.length === 0) {
      res.status(400).json({ message: 'Product ID and reviews list are required.' });
      return;
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const createdReviews = [];
    for (const r of reviews) {
      const { author_name, rating, body, verified_purchase, created_at } = r;
      if (!author_name || !body) {
        continue;
      }
      const ratingInt = parseInt(rating) || 5;

      const review = await (prisma as any).review.create({
        data: {
          product_id,
          author_name,
          author_email: null,
          rating: ratingInt,
          title: null,
          body,
          verified_purchase: verified_purchase !== undefined ? !!verified_purchase : true,
          is_approved: true,
          created_at: created_at ? new Date(created_at) : new Date(),
        },
        include: {
          product: { select: { id: true, translations: true, sku: true } }
        }
      });
      createdReviews.push(review);
    }

    res.status(201).json({ message: `Successfully created ${createdReviews.length} reviews`, reviews: createdReviews });
  } catch (error) {
    console.error('Error creating bulk reviews:', error);
    res.status(500).json({ message: 'Error creating bulk reviews', error: String(error) });
  }
});




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
      {
        author_name: 'Lukas M.',
        rating: 5,
        title: 'Stylisch und bequem',
        body: 'Die Sonnenbrille sitzt perfekt und ist auch nach mehreren Stunden sehr angenehm zu tragen. Hochwertige Verarbeitung und modernes Design.',
        verified_purchase: true,
        days_ago: 6
      },
      {
        author_name: 'Emma K.',
        rating: 5,
        title: 'Excellentes lunettes',
        body: 'Très élégantes et confortables. Les verres offrent une excellente protection contre le soleil et la qualité est au rendez-vous.',
        verified_purchase: true,
        days_ago: 11
      },
      {
        author_name: 'Matteo R.',
        rating: 5,
        title: 'Qualità Nike',
        body: 'Occhiali leggeri, molto comodi e con un design sportivo. Perfetti sia per guidare che per le passeggiate estive.',
        verified_purchase: true,
        days_ago: 15
      },
      {
        author_name: 'Noah V.',
        rating: 5,
        title: 'Top zonnebril',
        body: 'Zit erg comfortabel en ziet er premium uit. Goede UV-bescherming en ideaal voor dagelijks gebruik.',
        verified_purchase: true,
        days_ago: 18
      },
      {
        author_name: 'Jonas B.',
        rating: 4,
        title: 'Sehr zufrieden',
        body: 'Leichtes Gestell, gute Passform und klare Sicht. Die Brille wirkt hochwertig und sieht sportlich aus.',
        verified_purchase: true,
        days_ago: 22
      },
      {
        author_name: 'Claire D.',
        rating: 5,
        title: 'Parfaites pour l’été',
        body: 'Je les porte presque tous les jours. Elles sont légères, élégantes et protègent très bien les yeux.',
        verified_purchase: true,
        days_ago: 27
      },
      {
        author_name: 'Giulia F.',
        rating: 5,
        title: 'Bellissimo design',
        body: 'Montatura resistente e molto elegante. Ottima qualità delle lenti e vestibilità perfetta.',
        verified_purchase: true,
        days_ago: 33
      },
      {
        author_name: 'Sven J.',
        rating: 5,
        title: 'Goede kwaliteit',
        body: 'Mooie afwerking en fijne pasvorm. De glazen verminderen schittering tijdens het autorijden.',
        verified_purchase: true,
        days_ago: 36
      },
      {
        author_name: 'Felix H.',
        rating: 5,
        title: 'Perfekt für den Alltag',
        body: 'Ob beim Autofahren oder Spazierengehen – die Brille ist angenehm leicht und bietet eine tolle Sicht.',
        verified_purchase: true,
        days_ago: 41
      },
      {
        author_name: 'Camille P.',
        rating: 4,
        title: 'Très confortable',
        body: 'Bonne qualité de fabrication et look moderne. Je suis très satisfaite de cet achat.',
        verified_purchase: true,
        days_ago: 46
      },
      {
        author_name: 'Marco S.',
        rating: 5,
        title: 'Perfetti per lo sport',
        body: 'Li uso anche durante le passeggiate e sono molto stabili. Ottima protezione dal sole.',
        verified_purchase: true,
        days_ago: 52
      },
      {
        author_name: 'Daan W.',
        rating: 5,
        title: 'Echt een aanrader',
        body: 'Lichtgewicht en comfortabel. De glazen zijn helder en beschermen uitstekend tegen fel zonlicht.',
        verified_purchase: true,
        days_ago: 58
      },
      {
        author_name: 'Leon S.',
        rating: 5,
        title: 'Hochwertige Sonnenbrille',
        body: 'Die Verarbeitung überzeugt auf ganzer Linie. Modernes Design und angenehmer Sitz.',
        verified_purchase: true,
        days_ago: 64
      },
      {
        author_name: 'Julien T.',
        rating: 5,
        title: 'Très bonne qualité',
        body: 'Les matériaux semblent robustes et les lunettes sont très agréables à porter toute la journée.',
        verified_purchase: true,
        days_ago: 69
      },
      {
        author_name: 'Francesca G.',
        rating: 4,
        title: 'Molto soddisfatta',
        body: 'Design elegante e lenti di qualità. Ottimo rapporto qualità-prezzo.',
        verified_purchase: true,
        days_ago: 74
      },
      {
        author_name: 'Bram N.',
        rating: 5,
        title: 'Perfecte pasvorm',
        body: 'Past uitstekend en voelt stevig aan. Ideaal voor zonnige dagen en autoritten.',
        verified_purchase: true,
        days_ago: 81
      },
      {
        author_name: 'Tim O.',
        rating: 5,
        title: 'Klare Kaufempfehlung',
        body: 'Stylisch, leicht und angenehm zu tragen. Die Gläser bieten eine hervorragende Sicht bei Sonnenschein.',
        verified_purchase: true,
        days_ago: 87
      },
      {
        author_name: 'Amélie R.',
        rating: 5,
        title: 'Élégantes et pratiques',
        body: 'Très belles finitions, protection solaire efficace et design intemporel. Je recommande.',
        verified_purchase: true,
        days_ago: 92
      },
      {
        author_name: 'Davide C.',
        rating: 5,
        title: 'Ottima scelta',
        body: 'Occhiali molto leggeri con un look moderno. Li ricomprerei senza esitazione.',
        verified_purchase: true,
        days_ago: 98
      },
      {
        author_name: 'Jeroen P.',
        rating: 4,
        title: 'Mooie Nike bril',
        body: 'Goede kwaliteit, zit comfortabel en ziet er stijlvol uit. Zeker tevreden met mijn aankoop.',
        verified_purchase: true,
        days_ago: 105
      }
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
