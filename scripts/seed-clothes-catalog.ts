import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = './database.sqlite';
const sqliteDb = new Database(dbPath);

// Realistic high-quality product images for fashion categories
const brandImages: Record<string, string[]> = {
  nike: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&q=80&w=800',
  ],
  adidas: [
    'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&q=80&w=800',
  ],
  jordan: [
    'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=800',
  ],
  timberland: [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=800',
  ],
  vans: [
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800',
  ],
  newbalance: [
    'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&q=80&w=800',
  ],
  puma: [
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=800',
  ],
  drmartens: [
    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=800',
  ],
  asics: [
    'https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&q=80&w=800',
  ],
  footwear: [
    'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
  ],
  shorts: [
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',
  ],
  trousers: [
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=800',
  ],
  apparel: [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=800',
  ]
};

// Import clothesData from populate-clothes.ts by reading and parsing
const populateScript = fs.readFileSync(path.join(process.cwd(), 'scripts', 'populate-clothes.ts'), 'utf8');
const dataMatch = populateScript.match(/const clothesData\s*=\s*(\[[\s\S]*?\n\];)/);

if (!dataMatch) {
  console.error("Could not find clothesData in scripts/populate-clothes.ts");
  process.exit(1);
}

// Evaluate clothesData safely
const clothesData = eval(dataMatch[1]);
console.log(`Found ${clothesData.length} items in clothesData.`);

// Helper to determine brand
function getBrand(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('nike')) return 'Nike';
  if (lower.includes('adidas')) return 'Adidas';
  if (lower.includes('timberland')) return 'Timberland';
  if (lower.includes('dr martens') || lower.includes('martens')) return 'Dr Martens';
  if (lower.includes('asics')) return 'Asics';
  if (lower.includes('vans')) return 'Vans';
  if (lower.includes('new balance') || lower.includes('nb1000')) return 'New Balance';
  if (lower.includes('jordan')) return 'Jordan';
  if (lower.includes('rick owens')) return 'Rick Owens';
  if (lower.includes('puma')) return 'Puma';
  if (lower.includes('zara')) return 'Zara';
  if (lower.includes('lacoste')) return 'Lacoste';
  if (lower.includes('louis vuitton')) return 'Louis Vuitton';
  if (lower.includes('dior')) return 'Dior';
  return name.split(' ')[0] || 'Exclusive';
}

// Helper to pick realistic images
let nikeImgIdx = 0;
let adidasImgIdx = 0;
let generalFootwearIdx = 0;
let apparelImgIdx = 0;
let shortsImgIdx = 0;
let trousersImgIdx = 0;
let accessImgIdx = 0;

function getImagesForProduct(name: string, category: string): string[] {
  const lower = name.toLowerCase();
  const cat = category.toLowerCase();

  if (lower.includes('nike')) {
    const img1 = brandImages.nike[nikeImgIdx % brandImages.nike.length];
    const img2 = brandImages.nike[(nikeImgIdx + 1) % brandImages.nike.length];
    nikeImgIdx++;
    return [img1, img2];
  }
  if (lower.includes('adidas')) {
    const img = brandImages.adidas[adidasImgIdx % brandImages.adidas.length];
    adidasImgIdx++;
    return [img];
  }
  if (lower.includes('jordan')) {
    return brandImages.jordan;
  }
  if (lower.includes('timberland')) {
    return brandImages.timberland;
  }
  if (lower.includes('vans')) {
    return brandImages.vans;
  }
  if (lower.includes('new balance') || lower.includes('nb1000')) {
    return brandImages.newbalance;
  }
  if (lower.includes('puma')) {
    return brandImages.puma;
  }
  if (lower.includes('dr martens')) {
    return brandImages.drmartens;
  }
  if (lower.includes('asics')) {
    return brandImages.asics;
  }

  if (cat.includes('footwear')) {
    const img = brandImages.footwear[generalFootwearIdx % brandImages.footwear.length];
    generalFootwearIdx++;
    return [img];
  }
  if (cat.includes('accessories')) {
    const img = brandImages.accessories[accessImgIdx % brandImages.accessories.length];
    accessImgIdx++;
    return [img];
  }
  if (cat.includes('shorts')) {
    const img = brandImages.shorts[shortsImgIdx % brandImages.shorts.length];
    shortsImgIdx++;
    return [img];
  }
  if (cat.includes('trousers') || lower.includes('jeans') || lower.includes('jogger')) {
    const img = brandImages.trousers[trousersImgIdx % brandImages.trousers.length];
    trousersImgIdx++;
    return [img];
  }

  const img = brandImages.apparel[apparelImgIdx % brandImages.apparel.length];
  apparelImgIdx++;
  return [img];
}

// Category normalization
function normalizeCategory(category: string, subCategoryTag?: string): string {
  if (subCategoryTag === 'Shorts') return 'Shorts';
  if (subCategoryTag === 'Trousers') return 'Trousers';
  const cat = category.toLowerCase();
  if (cat.includes('footwear') || cat.includes('footware')) return 'Footwear';
  if (cat.includes('accessories')) return 'Accessories';
  if (cat.includes('shorts')) return 'Shorts';
  if (cat.includes('trousers')) return 'Trousers';
  return 'Apparel';
}

const insertStmt = sqliteDb.prepare(`
  INSERT OR REPLACE INTO products (
    id, name, price, originalPrice, shippingFee, image, category, gender, description, details,
    inStock, isNew, viewers, stockCount, hypeScore, velocityScore, isHallOfFame, synergyPath,
    appeal, brand, tags, deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt,
    offeredDiscount, video
  ) VALUES (
    @id, @name, @price, @originalPrice, @shippingFee, @image, @category, @gender, @description, @details,
    @inStock, @isNew, @viewers, @stockCount, @hypeScore, @velocityScore, @isHallOfFame, @synergyPath,
    @appeal, @brand, @tags, @deliveryTime, @sizes, @isCustom, @images, @colors, @colorVariants, @createdAt,
    @offeredDiscount, @video
  )
`);

let inserted = 0;

sqliteDb.transaction(() => {
  for (const item of clothesData) {
    const brand = getBrand(item.name);
    const category = normalizeCategory(item.category, item.subCategoryTag);
    const images = getImagesForProduct(item.name, category);
    const primaryImage = images[0];

    // Comprehensive tags for search indexing
    const tagsSet = new Set<string>([
      'EXCLUSIVE',
      'LIMITED',
      category.toUpperCase(),
      brand.toUpperCase(),
      brand.toLowerCase(),
    ]);

    if (brand.toLowerCase() === 'nike') {
      tagsSet.add('nike');
      tagsSet.add('nikes');
      tagsSet.add('sneakers');
      tagsSet.add('sneaker');
      tagsSet.add('shoes');
      tagsSet.add('shoe');
      tagsSet.add('footwear');
    }

    if (category === 'Footwear') {
      tagsSet.add('shoes');
      tagsSet.add('sneakers');
      tagsSet.add('footwear');
      tagsSet.add('kicks');
    }

    const tags = Array.from(tagsSet);
    const originalPrice = Math.round(item.price * 1.35);
    const discount = Math.round(((originalPrice - item.price) / originalPrice) * 100);
    const id = `ck_${category.toLowerCase()}_${item.folder}`;

    const description = `${item.name}. Premium edition curated by Closet Kraze. High-grade craftsmanship, authentic streetwear silhouette, and comfortable all-day durability. Limited quantity release.`;

    const details = [
      `Brand: ${brand}`,
      `Category: ${category}`,
      'Authentic quality material',
      'Direct import from verified reserve',
      'Free standard delivery within 2-4 business days'
    ];

    insertStmt.run({
      id,
      name: item.name,
      price: item.price,
      originalPrice,
      shippingFee: 0,
      image: primaryImage,
      category,
      gender: 'UNISEX',
      description,
      details: JSON.stringify(details),
      inStock: 1,
      isNew: 1,
      viewers: Math.floor(Math.random() * 40) + 15,
      stockCount: Math.floor(Math.random() * 10) + 5,
      hypeScore: Math.floor(Math.random() * 15) + 85,
      velocityScore: Math.floor(Math.random() * 15) + 82,
      isHallOfFame: brand === 'Nike' || brand === 'Jordan' ? 1 : 0,
      synergyPath: 'EXCLUSIVE_DROP',
      appeal: 'Highly Demanded Aesthetic Release',
      brand,
      tags: JSON.stringify(tags),
      deliveryTime: '2-4 business days',
      sizes: JSON.stringify(item.sizes && item.sizes.length > 0 ? item.sizes : ['Standard']),
      isCustom: 0,
      images: JSON.stringify(images),
      colors: JSON.stringify(['Classic']),
      colorVariants: JSON.stringify([{ main: '#000000', secondary: '#ffffff' }]),
      createdAt: new Date().toISOString(),
      offeredDiscount: discount,
      video: null
    });

    inserted++;
  }
})();

console.log(`Successfully populated ${inserted} clothes items into database.sqlite!`);
const totalRow = sqliteDb.prepare('SELECT COUNT(*) as total FROM products').get() as { total: number };
console.log(`Total products now in database.sqlite: ${totalRow.total}`);

sqliteDb.close();
