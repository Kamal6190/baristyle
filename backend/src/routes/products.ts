import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import prisma from '../prismaClient';
import { optionalAuth, AuthRequest, requireRole } from '../middleware/auth';
import sharp from 'sharp';
import { syncStockToEbayIfLinked } from '../utils/ebaySync';
import { log } from '../utils/logger';

const uploadsPath = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR) 
  : path.resolve(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    // ── Search & pagination params ──────────────────────────────────────────
    const searchQ = (req.query.search as string || '').trim().toLowerCase();
    const limitN  = parseInt(req.query.limit as string || '0', 10);

    const products = await prisma.product.findMany({
      include: {
        category: true,
        productCategories: { include: { category: true } }
      }
    });

    const userRole = req.user?.role || 'GUEST';

    let filteredProducts = products.filter((product: any) => {
      const attributes = (product.attributes as any) || {};
      const isRetailOnly = attributes.sales_mode === 'RETAIL_ONLY';
      const isWholesaleOnly = attributes.sales_mode === 'WHOLESALE_ONLY';

      if (userRole === 'SELLER' && isRetailOnly) return false;
      if ((userRole === 'GUEST' || userRole === 'CUSTOMER') && isWholesaleOnly) return false;
      return true;
    });

    // ── Apply full-text search filter ─────────────────────────────────────
    if (searchQ) {
      filteredProducts = filteredProducts.filter((product: any) => {
        // Search in SKU
        if ((product.sku || '').toLowerCase().includes(searchQ)) return true;
        // Search in brand / tags
        if ((product.brand || '').toLowerCase().includes(searchQ)) return true;
        if ((product.tags || '').toLowerCase().includes(searchQ)) return true;
        // Search in translations (JSON object with lang keys)
        try {
          const trans = typeof product.translations === 'string'
            ? JSON.parse(product.translations)
            : product.translations || {};
          for (const lang of Object.keys(trans)) {
            const entry = trans[lang] || {};
            const name = (entry.name || '').toLowerCase();
            const desc = (entry.description || '').toLowerCase();
            if (name.includes(searchQ) || desc.includes(searchQ)) return true;
          }
        } catch { /* ignore JSON parse errors */ }
        // Also check top-level name if present
        if (product.name) {
          const n = typeof product.name === 'string' ? product.name : JSON.stringify(product.name);
          if (n.toLowerCase().includes(searchQ)) return true;
        }
        return false;
      });
    }

    // ── Apply limit ────────────────────────────────────────────────────────
    if (limitN > 0) {
      filteredProducts = filteredProducts.slice(0, limitN);
    }

    const formattedProducts = filteredProducts.map((product: any) => {
      let priceInfo = {};
      const attributes = (product.attributes as any) || {};
      const isRetailOnly = attributes.sales_mode === 'RETAIL_ONLY';
      const actualRole = isRetailOnly ? 'GUEST' : userRole;

      if (actualRole === 'SUPER_ADMIN') {
        priceInfo = {
          price: product.sales_price_with_tax,
          net_sales_price: product.net_sales_price,
          sales_price_with_tax: product.sales_price_with_tax,
          b2b_price: product.b2b_price,
          retail_price: product.retail_price
        };
      } else if (actualRole === 'SELLER') {
        priceInfo = {
          price: product.b2b_price,
          b2b_price: product.b2b_price,
          retail_price: product.retail_price
        };
      } else {
        priceInfo = {
          price: product.sales_price_with_tax || product.retail_price || product.b2b_price,
          retail_price: product.retail_price
        };
      }

      // ── Derive a display name from translations ────────────────────────
      let derivedName: Record<string, string> = {};
      try {
        const trans = typeof product.translations === 'string'
          ? JSON.parse(product.translations)
          : product.translations || {};
        for (const lang of Object.keys(trans)) {
          const entry = trans[lang] || {};
          if (entry.name) derivedName[lang] = entry.name;
        }
      } catch { /* ignore */ }

      // ── Parse images array ─────────────────────────────────────────────
      let images: string[] = [];
      try {
        const raw = product.images;
        if (Array.isArray(raw)) images = raw;
        else if (typeof raw === 'string') images = JSON.parse(raw);
      } catch { /* ignore */ }

      return {
        id: product.id,
        sku: product.sku,
        ean: product.ean,
        name: Object.keys(derivedName).length > 0 ? derivedName : product.sku,
        image_url: product.image_url,
        images,
        brand: (product.attributes as any)?.brand || product.brand || '',
        stock_quantity: product.stock_quantity,
        translations: product.translations,
        description: product.description,
        tags: product.tags,
        attributes: product.attributes,
        sales_mode: attributes.sales_mode || 'BOTH',
        category: product.category,
        categories: product.productCategories.map((pc: any) => pc.category),
        b2bMinQty: product.b2bMinQty ?? 1,
        admin_note: userRole === 'SUPER_ADMIN' ? product.admin_note : undefined,
        ...priceInfo
      };
    });

    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Create product (Super Admin only)
router.post('/', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const categoryIds: string[] = Array.isArray(data.category_ids) ? data.category_ids : [];
    const primaryCategoryId = categoryIds[0] || data.category_id;

    // Remove category_ids from the data passed directly to Prisma create
    const { category_ids, b2bMinQty, ...productData } = data;

    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        b2bMinQty: b2bMinQty !== undefined ? parseInt(b2bMinQty, 10) : undefined,
        category_id: primaryCategoryId
      }
    });

    if (categoryIds.length > 0) {
      await (prisma as any).productCategory.createMany({
        data: categoryIds.map((cat_id: string) => ({ product_id: newProduct.id, category_id: cat_id }))
      });
    }

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Import CSV (Super Admin only)
router.post('/import', optionalAuth, requireRole(['SUPER_ADMIN']), upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const results: any[] = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Find or create default category for imports if none specified
          let defaultCategory = await prisma.category.findFirst();
          if (!defaultCategory) {
            defaultCategory = await prisma.category.create({
              data: {
                name: { en: 'Uncategorized' },
                slug: 'uncategorized'
              }
            });
          }

          let importedCount = 0;
          for (const row of results) {
            // Simplified CSV structure assumption:
            // sku, ean, name, net_sales_price, sales_price_with_tax, b2b_price, retail_price, stock_quantity
            if (row.sku) {
              const product = await prisma.product.upsert({
                where: { sku: row.sku },
                update: {
                  stock_quantity: parseInt(row.stock_quantity) || 0,
                  net_sales_price: parseFloat(row.net_sales_price) || 0,
                  sales_price_with_tax: parseFloat(row.sales_price_with_tax) || 0,
                  b2b_price: parseFloat(row.b2b_price) || 0,
                  retail_price: parseFloat(row.retail_price) || 0,
                },
                create: {
                  sku: row.sku,
                  ean: row.ean,
                  category_id: defaultCategory.id,
                  stock_quantity: parseInt(row.stock_quantity) || 0,
                  translations: { en: row.name || 'Imported Product' },
                  net_sales_price: parseFloat(row.net_sales_price) || 0,
                  sales_price_with_tax: parseFloat(row.sales_price_with_tax) || 0,
                  b2b_price: parseFloat(row.b2b_price) || 0,
                  retail_price: parseFloat(row.retail_price) || 0,
                }
              });
              syncStockToEbayIfLinked(product.id);
              importedCount++;
            }
          }

          // Clean up the uploaded file
          fs.unlinkSync(filePath);
          res.status(200).json({ message: `Successfully imported ${importedCount} products` });
        } catch (dbError) {
          fs.unlinkSync(filePath);
          res.status(500).json({ message: 'Database error during import', error: dbError });
        }
      });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Import CSV Feed with custom column mappings and markup values (Super Admin only)
router.post('/import-feed', optionalAuth, requireRole(['SUPER_ADMIN']), upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { mappings, b2bMarkup, retailMarkup } = req.body;
    if (!mappings) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(400).json({ message: 'Column mappings are required' });
      return;
    }

    let map: any;
    try {
      map = typeof mappings === 'string' ? JSON.parse(mappings) : mappings;
    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(400).json({ message: 'Invalid mappings JSON string' });
      return;
    }

    const b2bPercent = parseFloat(b2bMarkup) || 0;
    const retailPercent = parseFloat(retailMarkup) || 0;

    const filePath = req.file.path;

    // Detect separator (comma vs semicolon) from the first line
    let separator = ',';
    try {
      const firstLineBuffer = Buffer.alloc(2048);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, firstLineBuffer, 0, 2048, 0);
      fs.closeSync(fd);
      const firstLine = firstLineBuffer.toString('utf8').split('\n')[0] || '';
      const commas = (firstLine.match(/,/g) || []).length;
      const semicolons = (firstLine.match(/;/g) || []).length;
      if (semicolons > commas) {
        separator = ';';
      }
    } catch (err) {
      console.error('Failed to auto-detect delimiter, defaulting to comma:', err);
    }

    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let defaultCategory = await prisma.category.findFirst();
          if (!defaultCategory) {
            defaultCategory = await prisma.category.create({
              data: {
                name: { en: 'Uncategorized', de: 'Nicht kategorisiert' },
                slug: 'uncategorized'
              }
            });
          }

          let importedCount = 0;
          for (const row of results) {
            const skuVal = row[map.skuCol]?.trim();
            const nameVal = row[map.nameCol]?.trim();
            const rawCost = String(row[map.priceCol] || '0').replace(/[^0-9.,]/g, '').replace(',', '.');
            const costVal = parseFloat(rawCost) || 0;

            if (skuVal && nameVal) {
              const b2bPrice = costVal * (1 + b2bPercent / 100);
              const retailPrice = costVal * (1 + retailPercent / 100);

              const eanVal = map.eanCol ? row[map.eanCol]?.trim() : null;
              const imgVal = map.imageCol ? row[map.imageCol]?.trim() : null;
              const stockVal = map.stockCol ? (parseInt(row[map.stockCol]) || 0) : 0;

              const product = await prisma.product.upsert({
                where: { sku: skuVal },
                update: {
                  stock_quantity: stockVal,
                  net_sales_price: b2bPrice,
                  sales_price_with_tax: retailPrice,
                  b2b_price: b2bPrice,
                  retail_price: retailPrice,
                  image_url: imgVal || undefined,
                },
                create: {
                  sku: skuVal,
                  ean: eanVal || null,
                  category_id: defaultCategory.id,
                  stock_quantity: stockVal,
                  translations: { de: nameVal, en: nameVal },
                  net_sales_price: b2bPrice,
                  sales_price_with_tax: retailPrice,
                  b2b_price: b2bPrice,
                  retail_price: retailPrice,
                  image_url: imgVal || null,
                }
              });

              syncStockToEbayIfLinked(product.id);
              importedCount++;
            }
          }

          fs.unlinkSync(filePath);
          res.status(200).json({ message: `Successfully imported ${importedCount} products` });
        } catch (dbError) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          res.status(500).json({ message: 'Database error during import', error: dbError });
        }
      });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Bulk import products from JSON array (Super Admin only)
router.post('/import-bulk', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      res.status(400).json({ message: 'Products array is required' });
      return;
    }

    let defaultCategory = await prisma.category.findFirst();
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: { en: 'Uncategorized', de: 'Nicht kategorisiert' },
          slug: 'uncategorized'
        }
      });
    }

    let importedCount = 0;
    for (const item of products) {
      const skuVal = item.sku?.trim();
      const nameVal = item.name?.trim();
      const b2bPrice = parseFloat(item.b2bPrice) || 0;
      const retailPrice = parseFloat(item.retailPrice) || 0;

      if (skuVal && nameVal) {
        const product = await prisma.product.upsert({
          where: { sku: skuVal },
          update: {
            net_sales_price: b2bPrice,
            sales_price_with_tax: retailPrice,
            b2b_price: b2bPrice,
            retail_price: retailPrice,
            stock_quantity: item.stock !== undefined ? parseInt(item.stock) : undefined
          },
          create: {
            sku: skuVal,
            ean: item.ean || null,
            category_id: defaultCategory.id,
            stock_quantity: item.stock !== undefined ? parseInt(item.stock) : 100,
            translations: { de: nameVal, en: nameVal },
            net_sales_price: b2bPrice,
            sales_price_with_tax: retailPrice,
            b2b_price: b2bPrice,
            retail_price: retailPrice,
            image_url: item.imageUrl || null
          }
        });

        syncStockToEbayIfLinked(product.id);
        importedCount++;
      }
    }

    res.status(200).json({ message: `Successfully imported ${importedCount} products` });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});



// Get all products with all fields for admin
router.get('/all', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        productCategories: { include: { category: true } }
      }
    });
    // Attach a flat categories array for convenience
    const result = (products as any[]).map((p) => ({
      ...p,
      categories: p.productCategories.map((pc: any) => pc.category)
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error', error });
  }
});

// Google & Facebook Shopping Catalog XML Feed
router.get(['/google-feed.xml', '/google_feed.xml', '/facebook-feed.xml', '/facebook_feed.xml'], async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        productCategories: { include: { category: true } }
      }
    });

    // Fetch all categories to build full paths efficiently
    const allCategories = await prisma.category.findMany();
    const categoryMap = new Map<string, any>();
    for (const cat of allCategories) {
      categoryMap.set(cat.id, cat);
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://baristyle.de';

    const escapeXml = (str: any) => {
      if (str === null || str === undefined) return '';
      let s = String(str);
      // Remove invalid XML control characters
      s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, '');
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const getTranslation = (field: any, lang: string): string => {
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
    };

    const getFullCategoryPath = (catId: string, lang: string): string => {
      const parts: string[] = [];
      let current = categoryMap.get(catId);
      while (current) {
        const name = getTranslation(current.name, lang);
        if (name) parts.unshift(name);
        current = current.parent_id ? categoryMap.get(current.parent_id) : null;
      }
      return parts.join(' > ');
    };

    const getGoogleProductCategory = (catId: string, title: string): string => {
      const titleLower = title.toLowerCase();
      if (titleLower.includes('sonnenbrille') || titleLower.includes('brille')) {
        return '178'; // Apparel & Accessories > Clothing Accessories > Sunglasses
      }
      if (titleLower.includes('smartwatch') || titleLower.includes('uhr')) {
        return '5181'; // Apparel & Accessories > Jewelry > Watches
      }
      if (titleLower.includes('hülle') || titleLower.includes('huelle') || titleLower.includes('case')) {
        return '268'; // Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases
      }
      if (titleLower.includes('kabel') || titleLower.includes('adapter') || titleLower.includes('cable')) {
        return '464'; // Electronics > Electronics Accessories > Cables
      }

      let current = categoryMap.get(catId);
      while (current) {
        const slug = current.slug?.toLowerCase() || '';
        if (['luxury-fragrances', 'reef', 'aouj-perfumes', 'osma-perfumes', 'unisex', 'herrenduft', 'damendeufte', ' öl', 'öl'].some(s => slug.includes(s))) {
          return '479'; // Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne
        }
        if (slug.includes('raumdeufte')) {
          return '592'; // Home & Garden > Decor > Home Fragrances
        }
        if (slug.includes('dukhoon')) {
          return '3686'; // Home & Garden > Decor > Home Fragrances > Incense
        }
        if (slug.includes('sonnenbrille') || slug.includes('brille')) {
          return '178'; // Apparel & Accessories > Clothing Accessories > Sunglasses
        }
        if (slug.includes('smartwatch') || slug.includes('uhr')) {
          return '5181'; // Apparel & Accessories > Jewelry > Watches
        }
        if (slug.includes('huelle') || slug.includes('case')) {
          return '268'; // Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases
        }
        if (slug.includes('kabel') || slug.includes('adapter') || slug.includes('cable')) {
          return '464'; // Electronics > Electronics Accessories > Cables
        }
        if (['elektronik', 'camera', 'android boxes'].some(s => slug.includes(s))) {
          return '222'; // Electronics
        }
        if (['computer-laptop', 'computer-und-laptopzubehoer'].some(s => slug.includes(s))) {
          return '278'; // Electronics > Computers
        }
        current = current.parent_id ? categoryMap.get(current.parent_id) : null;
      }
      return ''; // Omit GPC if not recognized
    };

    const getGender = (title: string, sku: string, catSlug: string): string => {
      const combined = `${title} ${sku} ${catSlug}`.toLowerCase();
      if (combined.includes('herren') || combined.includes('men') || combined.includes('homme')) {
        return 'male';
      }
      if (combined.includes('damen') || combined.includes('women') || combined.includes('femme') || combined.includes('lady')) {
        return 'female';
      }
      return 'unisex';
    };

    const getColor = (title: string, sku: string, attributes: any): string => {
      if (attributes && attributes.color && typeof attributes.color === 'string') return attributes.color;
      
      let typeVal = '';
      if (attributes && attributes.type && typeof attributes.type === 'string' && attributes.type !== 'Standard') {
        typeVal = attributes.type;
      }

      const combined = `${title} ${sku} ${typeVal}`.toLowerCase();
      
      const colorsMap: { [key: string]: string } = {
        'schwarz': 'schwarz',
        'schwar': 'schwarz',
        'black': 'black',
        'weiß': 'weiß',
        'weiss': 'weiß',
        'white': 'white',
        'wei': 'weiß',
        'gold': 'gold',
        'rose': 'roségold',
        'rosé': 'rosé',
        'silber': 'silber',
        'silver': 'silver',
        'blau': 'blau',
        'blue': 'blue',
        'rot': 'rot',
        'red': 'red',
        'grün': 'grün',
        'green': 'green',
        'gelb': 'gelb',
        'yellow': 'yellow',
        'braun': 'braun',
        'brown': 'brown',
        'grau': 'grau',
        'grey': 'grey',
        'pink': 'pink'
      };

      for (const [key, value] of Object.entries(colorsMap)) {
        if (combined.includes(key)) {
          return value;
        }
      }
      return '';
    };

    const getSize = (title: string, attributes: any, isSunglasses: boolean): string => {
      if (isSunglasses) {
        if (attributes && attributes.size && !isNaN(Number(attributes.size))) {
          return String(attributes.size);
        }
        if (attributes && attributes.type && !isNaN(Number(attributes.type))) {
          return String(attributes.type);
        }
        const sizeMatch = title.match(/\b(4[5-9]|5[0-9]|6[0-9]|7[0-5])\b/);
        if (sizeMatch) return sizeMatch[0];
        return 'Standard';
      }

      if (attributes && attributes.size && attributes.size !== 'null') return String(attributes.size);
      if (attributes && attributes.type && attributes.type !== 'null' && attributes.type !== 'Standard') return String(attributes.type);
      
      const mlMatch = title.match(/(\d+\s*ml)/i);
      if (mlMatch) return mlMatch[1];

      const sizeMatch = title.match(/\b(4[5-9]|5[0-9]|6[0-9])\b/);
      if (sizeMatch) return sizeMatch[0];

      return '';
    };

    const cleanDescription = (desc: string): string => {
      if (!desc) return '';
      let cleaned = desc.replace(/<[^>]*>/g, ' ');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      if (cleaned.length > 4500) {
        cleaned = cleaned.substring(0, 4497) + '...';
      }
      return cleaned;
    };

    const getAbsoluteImageUrl = (url: string | null | undefined, base: string): string => {
      if (!url) return '';
      let trimmed = url.trim();
      if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
        trimmed = trimmed.replace(/^https?:\/\/[^/]+/, '');
      }
      if (trimmed.startsWith('http')) {
        return trimmed;
      }
      if (trimmed.startsWith('/uploads/')) {
        return `${base}${trimmed}`;
      }
      if (trimmed.startsWith('uploads/')) {
        return `${base}/${trimmed}`;
      }
      return `${base}/${trimmed}`;
    };

    let xml = `<?xml version="1.0" encoding="utf-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml('BS Baristore')}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml('Universal Premium Department Store &amp; Luxury Fragrances')}</description>
    <language>de</language>
`;

    for (const product of products) {
      const attributes = (product.attributes as any) || {};
      if (attributes.sales_mode === 'WHOLESALE_ONLY') {
        continue;
      }

      const retailPriceNum = product.retail_price ? parseFloat(product.retail_price.toString()) : 0;
      const salesPriceNum = product.sales_price_with_tax ? parseFloat(product.sales_price_with_tax.toString()) : 0;
      const b2bPriceNum = product.b2b_price ? parseFloat(product.b2b_price.toString()) : 0;

      let regularPriceVal = 0;
      let salePriceVal = 0;

      if (retailPriceNum > 0 && salesPriceNum > 0 && retailPriceNum > salesPriceNum) {
        regularPriceVal = retailPriceNum;
        salePriceVal = salesPriceNum;
      } else {
        regularPriceVal = salesPriceNum > 0 ? salesPriceNum : (retailPriceNum > 0 ? retailPriceNum : b2bPriceNum);
      }

      if (regularPriceVal <= 0) {
        continue; // Google Merchant Center requires a price greater than 0
      }

      const id = product.sku && product.sku.length <= 50 ? product.sku : product.id;
      
      // Get German translation as primary (fallbacks handled by getTranslation)
      const title = getTranslation(product.translations, 'de');
      const rawDesc = getTranslation(product.description, 'de') || getTranslation(product.short_description, 'de') || `${title} — Exquisite premium quality item from BS Baristore.`;
      const desc = cleanDescription(rawDesc) || `${title} — Exquisite premium quality item from BS Baristore.`;
      
      const link = `${baseUrl}/shop/${id}`;
      const imageLink = getAbsoluteImageUrl(product.image_url, baseUrl) || `${baseUrl}/logo.png`;
      const availability = product.stock_quantity > 0 ? 'in_stock' : 'out_of_stock';
      
      const price = `${regularPriceVal.toFixed(2)} EUR`;
      const salePrice = salePriceVal > 0 ? `${salePriceVal.toFixed(2)} EUR` : '';
      const brandVal = attributes.brand || 'BS Baristore';

      let googleCategory = '';
      if (product.category_id) {
        googleCategory = getFullCategoryPath(product.category_id, 'de');
      }

      xml += `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(desc)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>\n`;

      if (salePrice) {
        xml += `      <g:sale_price>${salePrice}</g:sale_price>\n`;
      }

      xml += `      <g:brand>${escapeXml(brandVal)}</g:brand>
      <g:condition>new</g:condition>
`;

      // Add additional images if present
      if (attributes.additional_images && Array.isArray(attributes.additional_images)) {
        for (const img of attributes.additional_images) {
          const absUrl = getAbsoluteImageUrl(img, baseUrl);
          if (absUrl && absUrl !== imageLink) {
            xml += `      <g:additional_image_link>${escapeXml(absUrl)}</g:additional_image_link>\n`;
          }
        }
      }

      if (product.ean) {
        xml += `      <g:gtin>${escapeXml(product.ean)}</g:gtin>\n`;
      }
      if (product.sku) {
        xml += `      <g:mpn>${escapeXml(product.sku)}</g:mpn>\n`;
      }
      if (googleCategory) {
        xml += `      <g:product_type>${escapeXml(googleCategory)}</g:product_type>\n`;
      }
      const googleProductCategoryId = getGoogleProductCategory(product.category_id, title);
      if (googleProductCategoryId) {
        xml += `      <g:google_product_category>${googleProductCategoryId}</g:google_product_category>\n`;
        
        // Add gender, age_group, color, size if in apparel/watches categories
        if (googleProductCategoryId === '178' || googleProductCategoryId === '5181') {
          const catSlug = product.category?.slug || '';
          const gender = getGender(title, product.sku || '', catSlug);
          const ageGroup = 'adult';
          const color = getColor(title, product.sku || '', attributes);
          const size = getSize(title, attributes, googleProductCategoryId === '178');

          xml += `      <g:gender>${escapeXml(gender)}</g:gender>\n`;
          xml += `      <g:age_group>${escapeXml(ageGroup)}</g:age_group>\n`;
          if (color) {
            xml += `      <g:color>${escapeXml(color)}</g:color>\n`;
          }
          if (size) {
            xml += `      <g:size>${escapeXml(size)}</g:size>\n`;
          }
        }
      }

      if (!product.ean) {
        xml += `      <g:identifier_exists>false</g:identifier_exists>\n`;
      }

      xml += `    </item>\n`;
    }

    xml += `  </channel>
</rss>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    console.error('Error generating Google Shopping Feed:', error);
    res.status(500).send('Error generating feed');
  }
});

// eBay Seller Hub Reports CSV Feed (File Exchange Format)
router.get('/ebay-feed.csv', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        productCategories: { include: { category: true } }
      }
    });

    const baseUrl = process.env.FRONTEND_URL || 'https://baristyle.de';

    const getTranslation = (field: any, lang: string): string => {
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
    };

    const cleanDescription = (desc: string): string => {
      if (!desc) return '';
      let cleaned = desc.replace(/<[^>]*>/g, ' ');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      // eBay allows long descriptions, but let's keep it under 5000 chars for file size efficiency
      if (cleaned.length > 5000) {
        cleaned = cleaned.substring(0, 4997) + '...';
      }
      return cleaned;
    };

    const getAbsoluteImageUrl = (url: string | null | undefined, base: string): string => {
      if (!url) return '';
      let trimmed = url.trim();
      if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
        trimmed = trimmed.replace(/^https?:\/\/[^/]+/, '');
      }
      if (trimmed.startsWith('http')) {
        return trimmed;
      }
      if (trimmed.startsWith('/uploads/')) {
        return `${base}${trimmed}`;
      }
      if (trimmed.startsWith('uploads/')) {
        return `${base}/${trimmed}`;
      }
      return `${base}/${trimmed}`;
    };

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '';
      let s = String(str);
      // Replace double quotes with double double quotes
      s = s.replace(/"/g, '""');
      return `"${s}"`;
    };

    // eBay File Exchange CSV headers
    const headers = [
      'Action',
      'Category',
      'Title',
      'Description',
      'PicURL',
      'Quantity',
      'StartPrice',
      'ConditionID',
      'Format',
      'Duration',
      'Location',
      'CustomLabel',
      'DispatchTimeMax',
      'C:Brand',
      'C:Type',
      'ShippingProfileName',
      'ReturnProfileName',
      'PaymentProfileName'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const product of products) {
      const attributes = (product.attributes as any) || {};
      if (attributes.sales_mode === 'WHOLESALE_ONLY') {
        continue;
      }

      const id = product.sku || product.id;
      
      // Get title and truncate to eBay limit (80 chars)
      let title = getTranslation(product.translations, 'de');
      if (title.length > 80) {
        title = title.substring(0, 77) + '...';
      }
      
      const rawDesc = getTranslation(product.description, 'de') || getTranslation(product.short_description, 'de') || `${title} — Exquisite premium quality item from BS Baristore.`;
      const desc = cleanDescription(rawDesc);
      
      const mainImage = getAbsoluteImageUrl(product.image_url, baseUrl) || `${baseUrl}/logo.png`;
      let picUrls = [mainImage];
      
      if (attributes.additional_images && Array.isArray(attributes.additional_images)) {
        for (const img of attributes.additional_images) {
          const absUrl = getAbsoluteImageUrl(img, baseUrl);
          if (absUrl && absUrl !== mainImage && picUrls.length < 12) {
            picUrls.push(absUrl);
          }
        }
      }
      // pipe (|) is standard for eBay File Exchange multi-images
      const picUrlStr = picUrls.join('|');

      const quantity = product.stock_quantity;
      const priceVal = parseFloat(product.retail_price?.toString() || product.sales_price_with_tax?.toString() || product.b2b_price?.toString() || '0');
      const price = priceVal.toFixed(2);
      const brandVal = attributes.brand || 'BS Baristore';
      const typeVal = attributes.type || 'Perfume';

      // Fallback category 26395 (Beauty & Health > Perfumes on eBay.de)
      const categoryId = '26395';

      const row = [
        escapeCsv('Add'),             // Action
        escapeCsv(categoryId),        // Category
        escapeCsv(title),             // Title
        escapeCsv(desc),              // Description
        escapeCsv(picUrlStr),         // PicURL
        quantity.toString(),          // Quantity
        price,                        // StartPrice
        '1000',                       // ConditionID (New)
        escapeCsv('FixedPrice'),      // Format
        escapeCsv('GTC'),             // Duration
        escapeCsv('Aachen'),          // Location
        escapeCsv(id),                // CustomLabel (SKU)
        '2',                          // DispatchTimeMax (Handling time)
        escapeCsv(brandVal),          // C:Brand
        escapeCsv(typeVal),           // C:Type
        escapeCsv(''),                // ShippingProfileName (User fills in)
        escapeCsv(''),                // ReturnProfileName (User fills in)
        escapeCsv('')                 // PaymentProfileName (User fills in)
      ];

      csvContent += row.join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=ebay_feed.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error generating eBay CSV Feed:', error);
    res.status(500).send('Error generating feed');
  }
});

// Get single product by id or sku
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    let product: any = null;

    // Try finding by UUID first
    if (id.length === 36 && id.includes('-')) {
      product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          productCategories: { include: { category: true } }
        }
      });
    }

    // Try finding by SKU if not found
    if (!product) {
      product = await prisma.product.findUnique({
        where: { sku: id },
        include: {
          category: true,
          productCategories: { include: { category: true } }
        }
      });
    }

    // Try finding by prefix matching/fallback healing if not found (helps Google Search Console indexed links that changed)
    if (!product) {
      const tokens = id.split('-').filter(t => t && t !== '0');
      for (let len = tokens.length - 1; len >= 3; len--) {
        const prefix = tokens.slice(0, len).join('-');
        const potentialProducts = await prisma.product.findMany({
          where: {
            sku: {
              startsWith: prefix
            }
          },
          include: {
            category: true,
            productCategories: { include: { category: true } }
          },
          take: 1
        });
        if (potentialProducts.length > 0) {
          product = potentialProducts[0];
          break;
        }
      }
    }
    
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const userRole = req.user?.role || 'GUEST';
    const attributes = (product.attributes as any) || {};
    const isRetailOnly = attributes.sales_mode === 'RETAIL_ONLY';
    const isWholesaleOnly = attributes.sales_mode === 'WHOLESALE_ONLY';

    if (userRole === 'SELLER' && isRetailOnly) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const actualRole = isRetailOnly ? 'GUEST' : userRole;
    let priceInfo = {};

    if (actualRole === 'SUPER_ADMIN') {
      priceInfo = {
        price: product.sales_price_with_tax,
        net_sales_price: product.net_sales_price,
        sales_price_with_tax: product.sales_price_with_tax,
        b2b_price: product.b2b_price,
        retail_price: product.retail_price
      };
    } else if (actualRole === 'SELLER') {
      priceInfo = {
        price: product.b2b_price,
        b2b_price: product.b2b_price,
        retail_price: product.retail_price
      };
    } else {
      priceInfo = {
        price: isWholesaleOnly ? 0 : (product.sales_price_with_tax || product.retail_price || product.b2b_price),
        retail_price: isWholesaleOnly ? 0 : product.retail_price
      };
    }

    // Fetch sister variants sharing the same parent_sku or matching the current product's SKU
    const parentSku = attributes.parent_sku || product.sku;

    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        image_url: true,
        stock_quantity: true,
        translations: true,
        attributes: true,
        net_sales_price: true,
        sales_price_with_tax: true,
        b2b_price: true,
        retail_price: true,
        admin_note: true
      }
    });

    const variants = allProducts.filter((p: any) => {
      const pAttr = p.attributes || {};
      const vIsRetailOnly = pAttr.sales_mode === 'RETAIL_ONLY';
      const vIsWholesaleOnly = pAttr.sales_mode === 'WHOLESALE_ONLY';

      if (userRole === 'SELLER' && vIsRetailOnly) return false;
      if ((userRole === 'GUEST' || userRole === 'CUSTOMER') && vIsWholesaleOnly) return false;

      return p.sku === parentSku || pAttr.parent_sku === parentSku;
    });

    const formattedVariants = variants.map((v: any) => {
      const vAttributes = (v.attributes as any) || {};
      const vIsRetailOnly = vAttributes.sales_mode === 'RETAIL_ONLY';
      const vIsWholesaleOnly = vAttributes.sales_mode === 'WHOLESALE_ONLY';
      const vActualRole = vIsRetailOnly ? 'GUEST' : userRole;
      let vPriceInfo = {};
      if (vActualRole === 'SUPER_ADMIN') {
        vPriceInfo = {
          price: v.sales_price_with_tax,
          net_sales_price: v.net_sales_price,
          sales_price_with_tax: v.sales_price_with_tax,
          b2b_price: v.b2b_price,
          retail_price: v.retail_price
        };
      } else if (vActualRole === 'SELLER') {
        vPriceInfo = {
          price: v.b2b_price,
          b2b_price: v.b2b_price,
          retail_price: v.retail_price
        };
      } else {
        vPriceInfo = {
          price: vIsWholesaleOnly ? 0 : (v.sales_price_with_tax || v.retail_price || v.b2b_price),
          retail_price: vIsWholesaleOnly ? 0 : v.retail_price
        };
      }

      return {
        id: v.id,
        sku: v.sku,
        image_url: v.image_url,
        stock_quantity: v.stock_quantity,
        translations: v.translations,
        attributes: v.attributes,
        sales_mode: vAttributes.sales_mode || 'BOTH',
        admin_note: userRole === 'SUPER_ADMIN' ? v.admin_note : undefined,
        ...vPriceInfo
      };
    });

    res.json({
      id: product.id,
      sku: product.sku,
      ean: product.ean,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      translations: product.translations,
      description: product.description,
      short_description: product.short_description,
      scent_notes: product.scent_notes,
      tags: product.tags,
      attributes: product.attributes,
      sales_mode: attributes.sales_mode || 'BOTH',
      category: product.category,
      categories: product.productCategories.map((pc: any) => pc.category),
      b2bMinQty: product.b2bMinQty ?? 1,
      admin_note: userRole === 'SUPER_ADMIN' ? product.admin_note : undefined,
      ...priceInfo,
      variants: formattedVariants
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error });
  }
});

// Update product (Full Update supported, multi-category)
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    // category_ids is an array of all selected category IDs
    const categoryIds: string[] = Array.isArray(data.category_ids) ? data.category_ids : [];
    // The primary category_id is the first selected, or kept from data.category_id
    const primaryCategoryId = categoryIds[0] || data.category_id;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        category_id: primaryCategoryId,
        sku: data.sku,
        ean: data.ean,
        image_url: data.image_url,
        translations: data.translations,
        description: data.description,
        short_description: data.short_description,
        scent_notes: data.scent_notes,
        tags: data.tags,
        net_sales_price: data.net_sales_price !== undefined ? parseFloat(data.net_sales_price) : undefined,
        sales_price_with_tax: data.sales_price_with_tax !== undefined ? parseFloat(data.sales_price_with_tax) : undefined,
        b2b_price: data.b2b_price !== undefined ? parseFloat(data.b2b_price) : undefined,
        retail_price: data.retail_price !== undefined ? (data.retail_price === null ? null : parseFloat(data.retail_price)) : undefined,
        stock_quantity: data.stock_quantity !== undefined ? parseInt(data.stock_quantity, 10) : undefined,
        b2bMinQty: data.b2bMinQty !== undefined ? parseInt(data.b2bMinQty, 10) : undefined,
        attributes: data.attributes ? data.attributes : undefined,
        admin_note: data.admin_note !== undefined ? data.admin_note : undefined,
      }
    });

    // Sync many-to-many categories if category_ids provided
    if (categoryIds.length > 0) {
      await (prisma as any).productCategory.deleteMany({ where: { product_id: id } });
      await (prisma as any).productCategory.createMany({
        data: categoryIds.map((cat_id: string) => ({ product_id: id, category_id: cat_id }))
      });
    }

    // Sync shared fields across sister variants if requested
    if (data.sync_variants) {
      const currentAttr = (updatedProduct.attributes as any) || {};
      const parentSku = currentAttr.parent_sku || updatedProduct.sku;
      if (parentSku) {
        const allProducts = await prisma.product.findMany();
        const sisterVariants = allProducts.filter((p: any) => {
          const pAttr = (p.attributes as any) || {};
          return (p.sku === parentSku || pAttr.parent_sku === parentSku) && p.id !== updatedProduct.id;
        });

        for (const variant of sisterVariants) {
          const vAttr = (variant.attributes as any) || {};
          const mergedAttr = {
            ...vAttr,
            brand: currentAttr.brand,
            sales_mode: currentAttr.sales_mode,
            is_sample: currentAttr.is_sample,
          };

          await prisma.product.update({
            where: { id: variant.id },
            data: {
              category_id: primaryCategoryId,
              translations: data.translations,
              description: data.description,
              short_description: data.short_description,
              scent_notes: data.scent_notes,
              tags: data.tags,
              attributes: mergedAttr,
              admin_note: data.admin_note !== undefined ? data.admin_note : undefined,
            }
          });

          // Sync many-to-many categories for sister variant
          if (categoryIds.length > 0) {
            await (prisma as any).productCategory.deleteMany({ where: { product_id: variant.id } });
            await (prisma as any).productCategory.createMany({
              data: categoryIds.map((cat_id: string) => ({ product_id: variant.id, category_id: cat_id }))
            });
          }
        }
      }
    }

    syncStockToEbayIfLinked(updatedProduct.id);

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
});

// Delete product
router.delete('/:id', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  console.log(`[DELETE PRODUCT] Attempting to delete product ID: ${id} by user: ${req.user?.email}`);
  try {
    const deleted = await prisma.product.delete({
      where: { id }
    });
    console.log(`[DELETE PRODUCT] Successfully deleted product ID: ${id}, SKU: ${deleted.sku}`);
    await log({
      action: 'PRODUCT_DELETED',
      category: 'products',
      actor: req.user?.email || 'admin',
      target: `SKU: ${deleted.sku}`,
      target_id: id,
      details: { sku: deleted.sku },
      req
    });
    res.json({ message: 'Product deleted successfully', id: deleted.id });
  } catch (error: any) {
    console.error(`[DELETE PRODUCT] Error deleting product ID ${id}:`, error);
    res.status(500).json({ message: 'Error deleting product', error: error.message || String(error) });
  }
});

// Upload and optimize image
router.post('/upload-image', optionalAuth, requireRole(['SUPER_ADMIN']), imageUpload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}.webp`;
    const outputPath = path.join(uploadsPath, filename);

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }

    // Process image with Sharp: resize to max 1200px width (preserving aspect ratio)
    // and compress to WebP format with quality 80
    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const imageUrl = `/uploads/${filename}`;

    res.json({ image_url: imageUrl });
  } catch (error: any) {
    console.error('[UPLOAD IMAGE] Error processing image with Sharp:', error);
    res.status(500).json({ message: 'Failed to upload and optimize image', error: error.message || String(error) });
  }
});

// GET /api/products/:id/sold-keys — admin: list all sold keys with buyer details
router.get('/:id/sold-keys', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = req.params.id as string;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const attrs = (product.attributes as any) || {};
    const soldKeys: Record<string, string[]> = attrs.soldKeys || {};

    if (Object.keys(soldKeys).length === 0) {
      res.json([]);
      return;
    }

    // Fetch order details for each orderID stored in soldKeys
    const orderIds = Object.keys(soldKeys);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        customer_name: true,
        customer_email: true,
        created_at: true
      }
    });

    const orderMap: Record<string, typeof orders[0]> = {};
    for (const o of orders) {
      orderMap[o.id] = o;
    }

    // Build flat list: one entry per key
    const result: Array<{
      key: string;
      orderId: string;
      orderShortId: string;
      customerName: string;
      customerEmail: string;
      soldAt: string | null;
    }> = [];

    for (const [orderId, keys] of Object.entries(soldKeys)) {
      const order = orderMap[orderId];
      for (const key of keys) {
        result.push({
          key,
          orderId,
          orderShortId: `#ORD-${orderId.substring(0, 6).toUpperCase()}`,
          customerName: order?.customer_name || 'Unknown',
          customerEmail: order?.customer_email || 'Unknown',
          soldAt: order?.created_at ? order.created_at.toISOString() : null
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Get sold keys error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

export default router;
