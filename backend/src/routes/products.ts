import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import prisma from '../prismaClient';
import { optionalAuth, AuthRequest, requireRole } from '../middleware/auth';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        productCategories: { include: { category: true } }
      }
    });

    const userRole = req.user?.role || 'GUEST';

    const formattedProducts = products.map((product: any) => {
      let priceInfo = {};

      if (userRole === 'SUPER_ADMIN') {
        priceInfo = {
          price: product.sales_price_with_tax,
          net_sales_price: product.net_sales_price,
          sales_price_with_tax: product.sales_price_with_tax,
          b2b_price: product.b2b_price,
          retail_price: product.retail_price
        };
      } else if (userRole === 'SELLER') {
        priceInfo = {
          price: product.b2b_price,
          retail_price: product.retail_price
        };
      } else {
        priceInfo = {
          price: product.sales_price_with_tax || product.retail_price || product.b2b_price,
          retail_price: product.retail_price
        };
      }

      return {
        id: product.id,
        sku: product.sku,
        ean: product.ean,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
        translations: product.translations,
        description: product.description,
        tags: product.tags,
        attributes: product.attributes,
        category: product.category,
        categories: product.productCategories.map((pc: any) => pc.category),
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
    const { category_ids, ...productData } = data;

    const newProduct = await prisma.product.create({
      data: {
        ...productData,
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
              await prisma.product.upsert({
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
    
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const userRole = req.user?.role || 'GUEST';
    let priceInfo = {};

    if (userRole === 'SUPER_ADMIN') {
      priceInfo = {
        price: product.sales_price_with_tax,
        net_sales_price: product.net_sales_price,
        sales_price_with_tax: product.sales_price_with_tax,
        b2b_price: product.b2b_price,
        retail_price: product.retail_price
      };
    } else if (userRole === 'SELLER') {
      priceInfo = {
        price: product.b2b_price,
        retail_price: product.retail_price
      };
    } else {
      priceInfo = {
        price: product.sales_price_with_tax || product.retail_price || product.b2b_price,
        retail_price: product.retail_price
      };
    }

    // Fetch sister variants sharing the same parent_sku or matching the current product's SKU
    const attributes = (product.attributes as any) || {};
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
        retail_price: true
      }
    });

    const variants = allProducts.filter((p: any) => {
      const pAttr = p.attributes || {};
      return p.sku === parentSku || pAttr.parent_sku === parentSku;
    });

    const formattedVariants = variants.map((v: any) => {
      let vPriceInfo = {};
      if (userRole === 'SUPER_ADMIN') {
        vPriceInfo = {
          price: v.sales_price_with_tax,
          net_sales_price: v.net_sales_price,
          sales_price_with_tax: v.sales_price_with_tax,
          b2b_price: v.b2b_price,
          retail_price: v.retail_price
        };
      } else if (userRole === 'SELLER') {
        vPriceInfo = {
          price: v.b2b_price,
          retail_price: v.retail_price
        };
      } else {
        vPriceInfo = {
          price: v.sales_price_with_tax || v.retail_price || v.b2b_price,
          retail_price: v.retail_price
        };
      }

      return {
        id: v.id,
        sku: v.sku,
        image_url: v.image_url,
        stock_quantity: v.stock_quantity,
        translations: v.translations,
        attributes: v.attributes,
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
      category: product.category,
      categories: product.productCategories.map((pc: any) => pc.category),
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
        attributes: data.attributes ? data.attributes : undefined,
      }
    });

    // Sync many-to-many categories if category_ids provided
    if (categoryIds.length > 0) {
      await (prisma as any).productCategory.deleteMany({ where: { product_id: id } });
      await (prisma as any).productCategory.createMany({
        data: categoryIds.map((cat_id: string) => ({ product_id: id, category_id: cat_id }))
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
});

// Delete product
router.delete('/:id', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.delete({
      where: { id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
});

// Upload image
router.post('/upload-image', optionalAuth, requireRole(['SUPER_ADMIN']), upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ image_url: imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image', error });
  }
});

export default router;
