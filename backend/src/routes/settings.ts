import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import { optionalAuth, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// Default configurations
const DEFAULT_SETTINGS: Record<string, any> = {
  buy2get1_config: {
    active: true,
    category_ids: []
  },
  vat_config: {
    rate: 19,
    type: 'inclusive' // 'inclusive' or 'exclusive'
  },
  shipping_methods: [
    {
      id: 'dhl-standard',
      name: 'DHL Standard',
      days: '3-5 days',
      cost: 5.90,
      countries: ['Germany', 'Austria', 'France', 'Netherlands']
    },
    {
      id: 'dhl-express',
      name: 'DHL Express',
      days: '1-2 days',
      cost: 14.90,
      countries: ['Germany', 'Austria', 'France', 'Belgium', 'Luxembourg', 'Denmark']
    },
    {
      id: 'fedex-europe',
      name: 'FedEx Europe Priority',
      days: '2-3 days',
      cost: 19.99,
      countries: ['Italy', 'Spain', 'Poland', 'Sweden', 'Finland', 'Portugal']
    }
  ],
  b2b_config: {
    minimum_order_amount: 2500,
    default_b2b_min_qty: 1
  },
  hero_banners: [
    {
      id: '1',
      image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop',
      title: 'Redefining Luxury Procurement',
      subtitle: 'Access the world\'s most exclusive fragrance houses and premium retail goods. Engineered for high-volume efficiency and retail elegance.',
      accent: 'Global Distributor',
      btn1_text: 'Shop Collections',
      btn1_link: '/shop',
      btn2_text: 'Wholesale Portal',
      btn2_link: '/wholesale'
    },
    {
      id: '2',
      image_url: 'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=2000&auto=format&fit=crop',
      title: 'Summer Nocturne Collection',
      subtitle: 'Hand-picked selections from the world\'s leading perfumeries. Perfect for retail displays.',
      accent: 'Seasonal Curated',
      btn1_text: 'Shop Collections',
      btn1_link: '/shop',
      btn2_text: 'Wholesale Portal',
      btn2_link: '/wholesale'
    },
    {
      id: '3',
      image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop',
      title: 'The Artisanal Edit',
      subtitle: 'Discover unique and niche artistic scents designed by masters, available exclusively for wholesale partners.',
      accent: 'Artisanal Niche',
      btn1_text: 'Shop Collections',
      btn1_link: '/shop',
      btn2_text: 'Wholesale Portal',
      btn2_link: '/wholesale'
    },
    {
      id: '4',
      image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=2000&auto=format&fit=crop',
      title: 'Wholesale Exclusives',
      subtitle: 'Access direct factory pricing and priority bulk allocation. Apply for B2B status today.',
      accent: 'B2B Exclusive',
      btn1_text: 'Shop Collections',
      btn1_link: '/shop',
      btn2_text: 'Wholesale Portal',
      btn2_link: '/wholesale'
    }
  ],
  homepage_featured: {
    main: {
      image_url: 'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=1200&auto=format&fit=crop',
      title_en: 'Summer Nocturne Collection',
      title_ar: 'عطر نكتار الصيف الفاخر',
      subtitle_en: 'Hand-picked selections from the world\'s leading perfumeries. Perfect for retail displays.',
      subtitle_ar: 'باقة من العطور الفاخرة والساحرة تم اختيارها بعناية من أفضل دور العطور العالمية.',
      tag_en: 'Seasonal Curated',
      tag_ar: 'مجموعات المواسم الخاصة',
      link: '/shop'
    },
    card1: {
      image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
      title_en: 'The Artisanal Edit',
      title_ar: 'العطور المصممة يدوياً',
      link: '/shop'
    },
    card2: {
      image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
      title_en: 'Wholesale Exclusives',
      title_ar: 'حصريات تجارة الجملة',
      link: '/shop'
    }
  },
  homepage_stats: [
    { value: '500+', label_en: 'Premium Brands', label_ar: 'العلامات التجارية الفاخرة' },
    { value: '24h', label_en: 'Order Processing', label_ar: 'سرعة تجهيز الطلبات' },
    { value: 'Global', label_en: 'B2B Logistics', label_ar: 'الخدمات اللوجستية B2B' },
    { value: '99.8%', label_en: 'Reliability Rate', label_ar: 'معدل موثوقية الأداء' }
  ]
};

// GET a setting by key
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (setting) {
      return res.json(setting.value);
    }

    // Return default if not set in DB
    if (DEFAULT_SETTINGS[key] !== undefined) {
      return res.json(DEFAULT_SETTINGS[key]);
    }

    return res.status(404).json({ message: `Setting with key '${key}' not found` });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// GET all settings (public or admin overview)
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    
    // Merge database settings with defaults
    const mergedSettings: Record<string, any> = { ...DEFAULT_SETTINGS };
    settings.forEach(s => {
      mergedSettings[s.key as string] = s.value;
    });

    res.json(mergedSettings);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// POST to clean up unused uploaded image files
router.post('/cleanup-unused-images', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = process.env.UPLOAD_DIR 
      ? path.resolve(process.env.UPLOAD_DIR) 
      : path.resolve(__dirname, '..', '..', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({ message: 'Uploads directory not found', deletedCount: 0, freedSpaceMB: 0 });
    }

    const filesOnDisk = fs.readdirSync(uploadsDir);
    const products = await prisma.product.findMany({
      select: { image_url: true, attributes: true, description: true }
    });
    const categories = await prisma.category.findMany({ select: { image_url: true } });
    const settings = await prisma.setting.findMany();

    const usedFiles = new Set<string>();

    function markUsed(url: any) {
      if (!url || typeof url !== 'string') return;
      const clean = url.split('?')[0].split('#')[0];
      const filename = path.basename(clean);
      usedFiles.add(filename);
    }

    products.forEach((p: any) => {
      markUsed(p.image_url);
      if (p.attributes && Array.isArray((p.attributes as any).additional_images)) {
        (p.attributes as any).additional_images.forEach((img: any) => markUsed(img));
      }
      if (p.description) {
        const str = JSON.stringify(p.description);
        const matches = str.match(/uploads\/[a-zA-Z0-9._-]+/g);
        if (matches) matches.forEach((m: any) => markUsed(m));
      }
    });

    categories.forEach((c: any) => markUsed(c.image_url));

    settings.forEach((s: any) => {
      const str = JSON.stringify(s.value);
      const matches = str.match(/uploads\/[a-zA-Z0-9._-]+/g);
      if (matches) matches.forEach((m: any) => markUsed(m));
    });

    const filesToDelete = filesOnDisk.filter((f: string) => !usedFiles.has(f));
    let deletedCount = 0;
    let totalBytesFreed = 0;

    for (const f of filesToDelete) {
      const filePath = path.join(uploadsDir, f);
      try {
        const stat = fs.statSync(filePath);
        totalBytesFreed += stat.size;
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (err: any) {
        console.error(`Failed to delete unused file ${f}:`, err.message);
      }
    }

    const freedMB = (totalBytesFreed / (1024 * 1024)).toFixed(2);
    res.json({
      success: true,
      message: `Cleaned ${deletedCount} unused images, freed ${freedMB} MB.`,
      deletedCount,
      freedSpaceMB: freedMB
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// POST/PUT to save a setting (SUPER_ADMIN only)
router.post('/:key', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const key = req.params.key as string;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }

    const updatedSetting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    res.json(updatedSetting.value);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

export default router;
