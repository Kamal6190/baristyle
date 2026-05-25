import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import { optionalAuth, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all categories with parent/children info and product counts
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Create a new category/subcategory (Super Admin only)
router.post('/', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, image_url, parent_id } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    const newCategory = await prisma.category.create({
      data: {
        name, // Expected as a JSON object, e.g., { en: "Fragrances", ar: "العطور" }
        slug,
        description,
        image_url,
        parent_id: parent_id || null
      }
    });

    res.status(201).json(newCategory);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Category slug must be unique' });
    }
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Update a category/subcategory (Super Admin only)
router.put('/:id', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, slug, description, image_url, parent_id } = req.body;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        image_url,
        parent_id: parent_id || null
      }
    });

    res.json(updatedCategory);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// Delete a category/subcategory (Super Admin only)
router.delete('/:id', optionalAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check if category has subcategories or active products
    const subCategories = await prisma.category.findMany({ where: { parent_id: id } });
    if (subCategories.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category with active subcategories.' });
    }

    const productsCount = await prisma.product.count({ where: { category_id: id } });
    if (productsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with active associated products.' });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

export default router;
