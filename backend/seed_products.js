const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding mock products...");

  // Create Category
  const category = await prisma.category.upsert({
    where: { slug: 'luxury-fragrances' },
    update: {},
    create: {
      name: { en: 'Luxury Fragrances', ar: 'عطور فاخرة' },
      slug: 'luxury-fragrances',
      description: 'Exclusive luxury fragrances from around the world.'
    }
  });

  // Create Products
  const products = [
    {
      sku: 'LUX-101',
      ean: '1234567890101',
      image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
      stock_quantity: 150,
      translations: { en: "L'Essence de Sapphire", ar: "جوهر الياقوت" },
      net_sales_price: 100,
      sales_price_with_tax: 120,
      b2b_price: 180,
      retail_price: 345,
      category_id: category.id,
      attributes: { type: 'Premium Extract', brand: 'Oud Royale' }
    },
    {
      sku: 'LUX-102',
      ean: '1234567890102',
      image_url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop',
      stock_quantity: 80,
      translations: { en: "Midnight Bergamot", ar: "برغموت منتصف الليل" },
      net_sales_price: 60,
      sales_price_with_tax: 72,
      b2b_price: 97.50,
      retail_price: 195,
      category_id: category.id,
      attributes: { type: 'Parfum', brand: 'Parfum Krafts' }
    },
    {
      sku: 'LUX-103',
      ean: '1234567890103',
      image_url: 'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=600&auto=format&fit=crop',
      stock_quantity: 45,
      translations: { en: "Mediterranean Mist", ar: "ضباب المتوسط" },
      net_sales_price: 65,
      sales_price_with_tax: 78,
      b2b_price: 105,
      retail_price: 210,
      category_id: category.id,
      attributes: { type: 'Eau De Toilette', brand: 'Coastal Breeze' }
    },
    {
      sku: 'LUX-104',
      ean: '1234567890104',
      image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop',
      stock_quantity: 200,
      translations: { en: "Noir Intense", ar: "نوار إنتنس" },
      net_sales_price: 95,
      sales_price_with_tax: 114,
      b2b_price: 160,
      retail_price: 320,
      category_id: category.id,
      attributes: { type: 'Intense Extrait', brand: 'Velvet Collection' }
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p
    });
  }

  console.log("Mock products seeded successfully!");
}

main().catch(console.error);
