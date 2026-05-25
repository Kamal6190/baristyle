const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const sqlData = fs.readFileSync('products.sql', 'utf-8');

function parseValues(str) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(v => {
    if (v === 'NULL') return null;
    if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
    return v;
  });
}

const unsplashImages = [
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616949755610-8b9cb8b5bc86?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1608528577891-eb05eb20101b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595425970377-c9703d7408f4?q=80&w=600&auto=format&fit=crop'
];

async function main() {
  console.log("Starting massive product import...");
  const category = await prisma.category.findFirst();
  
  if (!category) {
    console.log("Creating default category...");
    await prisma.category.create({
      data: { name: { en: 'All Products' }, slug: 'all-products' }
    });
  }
  
  const categoryId = category ? category.id : (await prisma.category.findFirst()).id;
  
  const lines = sqlData.split('\n');
  let count = 0;
  for (const line of lines) {
    if (!line.includes('INSERT INTO products')) continue;
    
    const valuesMatch = line.match(/VALUES \((.+)\);/);
    if (!valuesMatch) continue;
    
    const valuesStr = valuesMatch[1];
    const values = parseValues(valuesStr);
    
    const [name, size, barcode, netPrice, priceWithTax, sellingPrice] = values;
    
    if (!name || name === 'null' || netPrice === 'null' || netPrice === null || isNaN(parseFloat(netPrice))) {
      continue; // Skip invalid or placeholder rows
    }
    
    const randomImage = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];
    const sku = barcode && barcode !== 'null' ? barcode : 'GEN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    await prisma.product.upsert({
      where: { sku: sku },
      update: {},
      create: {
        sku: sku,
        ean: barcode !== 'null' ? barcode : null,
        category_id: categoryId,
        image_url: randomImage,
        stock_quantity: Math.floor(Math.random() * 100) + 10,
        translations: { en: name },
        net_sales_price: parseFloat(netPrice) || 0,
        sales_price_with_tax: parseFloat(priceWithTax) || 0,
        b2b_price: parseFloat(sellingPrice) || 0,
        retail_price: parseFloat(priceWithTax) || 0,
        attributes: { type: size !== 'null' ? size : 'Standard' }
      }
    });
    count++;
  }
  
  console.log('Successfully imported ' + count + ' products into BariStyle Database!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
