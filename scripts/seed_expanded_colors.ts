import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const jsonPath = path.join(process.cwd(), 'data/scraped_products.json');

// Define color presets with name and hex equivalents
const COLOR_PALETTE = {
  // Classic / Tech
  'Midnight Black': { main: '#0A0A0A', secondary: '#262626' },
  'Slate Grey': { main: '#5A6268', secondary: '#8A9597' },
  'Ghost White': { main: '#F8F9FA', secondary: '#E2E8F0' },
  'Off White': { main: '#FAF9F6', secondary: '#F1F0EA' },
  
  // Neon / Cyber
  'Cyber Pink': { main: '#FF007F', secondary: '#1A000A' },
  'Acid Neon Yellow': { main: '#CCFF00', secondary: '#0F1A00' },
  'Cobalt Blue': { main: '#1F51FF', secondary: '#0B132B' },
  'Teal Eclipse': { main: '#008080', secondary: '#002626' },
  'Emerald Matrix': { main: '#00FF66', secondary: '#001F0D' },
  
  // Warm / Earth
  'Crimson Red': { main: '#D32F2F', secondary: '#1A0000' },
  'Saffron Orange': { main: '#FF9900', secondary: '#261400' },
  'Mocha Brown': { main: '#4A3B32', secondary: '#2A1F1B' },
  'Cream Beige': { main: '#F5F5DC', secondary: '#E8DCC4' },
  'Khaki Sand': { main: '#C3B091', secondary: '#9E8D73' },
  'Sunset Peach': { main: '#FFCC99', secondary: '#FFE4E1' },
  'Copper Clay': { main: '#B87333', secondary: '#5C2E0B' },

  // Luxury / Soft
  'Amethyst Purple': { main: '#9966CC', secondary: '#1F0B3A' },
  'Ethereal Lavender': { main: '#E6E6FA', secondary: '#B0C4DE' },
  'Sage Green': { main: '#87A96B', secondary: '#4F6F52' },
  'Burgundy Wine': { main: '#800020', secondary: '#30000A' },
  'Metallic Gold': { main: '#FFD700', secondary: '#B8860B' },
  'Metallic Silver': { main: '#C0C0C0', secondary: '#808080' },
  'Pistachio Green': { main: '#93C572', secondary: '#5A8F35' },
  'Navy Deep': { main: '#000080', secondary: '#0A1128' },
  'Rose Quartz': { main: '#FFC0CB', secondary: '#FFB6C1' }
};

const CATEGORY_MAP: Record<string, string> = {
  "Men's Clothing": 'Apparel',
  "Women's Clothing": 'Apparel',
  "Bags & Luggage": 'Accessories',
  "Jewelry & Accessories": 'Accessories',
  "Shoes": 'Footwear',
  "Footwear": 'Footwear',
  "Beauty": 'Beauty',
  "Beauty & Cosmetics": 'Beauty',
  "Kits": 'Kits'
};

async function seed() {
  console.log('Reading scraped_products.json...');
  if (!fs.existsSync(jsonPath)) {
    console.error('scraped_products.json not found!');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  const scrapedProducts = JSON.parse(fileContent);
  console.log(`Loaded ${scrapedProducts.length} products to map and seed.`);

  // Delete existing products to avoid conflicts and clean up empty states
  console.log('Clearing old products table...');
  db.prepare('DELETE FROM products').run();

  const finalProducts: any[] = [];
  const sqlInserts: string[] = [];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, price, originalPrice, shippingFee, image, category, gender, description, details,
      inStock, isNew, viewers, stockCount, hypeScore, velocityScore, isHallOfFame, synergyPath,
      appeal, brand, tags, deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt,
      offeredDiscount, video
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const sp of scrapedProducts) {
    const dbCategory = CATEGORY_MAP[sp.category] || 'Apparel';
    
    // Assign expanded color ranges dynamically based on the category or original list
    let itemColors: string[] = [];
    if (dbCategory === 'Accessories') {
      itemColors = ['Metallic Gold', 'Metallic Silver', 'Midnight Black', 'Slate Grey', 'Copper Clay', 'Burgundy Wine'];
    } else if (dbCategory === 'Beauty') {
      itemColors = ['Rose Quartz', 'Ethereal Lavender', 'Crimson Red', 'Cream Beige', 'Ghost White', 'Amethyst Purple'];
    } else if (dbCategory === 'Footwear') {
      itemColors = ['Midnight Black', 'Ghost White', 'Slate Grey', 'Cobalt Blue', 'Teal Eclipse', 'Saffron Orange'];
    } else {
      // Apparel / Other
      const isTechOrCyber = sp.name.toLowerCase().includes('tech') || sp.name.toLowerCase().includes('cyber') || sp.name.toLowerCase().includes('matrix');
      if (isTechOrCyber) {
        itemColors = ['Midnight Black', 'Cyber Pink', 'Acid Neon Yellow', 'Cobalt Blue', 'Emerald Matrix', 'Teal Eclipse'];
      } else {
        itemColors = ['Midnight Black', 'Off White', 'Cream Beige', 'Sage Green', 'Ethereal Lavender', 'Burgundy Wine', 'Khaki Sand'];
      }
    }

    // Map names to main/secondary hexes for the colorVariants column
    const colorVariants = itemColors.map(colorName => {
      const paletteMatch = COLOR_PALETTE[colorName as keyof typeof COLOR_PALETTE];
      return {
        main: paletteMatch ? paletteMatch.main : '#808080',
        secondary: paletteMatch ? paletteMatch.secondary : '#404040'
      };
    });

    const originalPrice = sp.originalPrice || Math.round(sp.price * 1.5);
    const shippingFee = sp.shippingFee !== undefined ? sp.shippingFee : 0;
    const isNew = sp.isNew !== undefined ? sp.isNew : 1;
    const isHallOfFame = Math.random() > 0.8 ? 1 : 0;
    const inStock = 1;
    const stockCount = Math.floor(Math.random() * 12) + 5;
    const viewers = Math.floor(Math.random() * 60) + 12;
    const hypeScore = Math.floor(Math.random() * 30) + 70;
    const velocityScore = Math.floor(Math.random() * 25) + 75;

    const detailsJson = JSON.stringify(Array.isArray(sp.details) ? sp.details : [
      'High fidelity tactile fabrication',
      'Engineered with premium double seam stitching',
      'Breathable and responsive design integration',
      'Exclusive high contrast aesthetic finish'
    ]);

    const tagsJson = JSON.stringify(Array.isArray(sp.tags) ? sp.tags : [dbCategory.toUpperCase(), 'EXCLUSIVE', 'TRENDING']);
    const sizesJson = JSON.stringify(Array.isArray(sp.sizes) ? sp.sizes : ['S', 'M', 'L', 'XL', '2XL']);
    const imagesJson = JSON.stringify(sp.images || [sp.image]);
    const colorsJson = JSON.stringify(itemColors);
    const colorVariantsJson = JSON.stringify(colorVariants);

    const product = {
      id: sp.id,
      name: sp.name,
      price: sp.price,
      originalPrice: originalPrice,
      shippingFee: shippingFee,
      image: sp.image,
      category: dbCategory,
      gender: sp.gender || 'UNISEX',
      description: sp.description || `${sp.name} featuring premium quality fabrication, tailored cuts, and structural durability.`,
      details: detailsJson,
      inStock: inStock,
      isNew: isNew,
      viewers: viewers,
      stockCount: stockCount,
      hypeScore: hypeScore,
      velocityScore: velocityScore,
      isHallOfFame: isHallOfFame,
      synergyPath: 'EXCLUSIVE_DROP',
      appeal: 'Highly Demanded Aesthetic Release',
      brand: sp.brand || 'KRAZE-CORP',
      tags: tagsJson,
      deliveryTime: '2-4 business days',
      sizes: sizesJson,
      isCustom: 0,
      images: imagesJson,
      colors: colorsJson,
      colorVariants: colorVariantsJson,
      createdAt: new Date().toISOString(),
      offeredDiscount: Math.round(((originalPrice - sp.price) / originalPrice) * 100),
      video: sp.video || null
    };

    finalProducts.push(product);

    // Escape strings for SQL script
    const escapeSql = (str: string) => str.replace(/'/g, "''");

    const sqlStr = `INSERT OR REPLACE INTO products (id, name, price, originalPrice, shippingFee, image, category, gender, description, details, inStock, isNew, viewers, stockCount, hypeScore, velocityScore, isHallOfFame, synergyPath, appeal, brand, tags, deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt, offeredDiscount) VALUES ('${product.id}', '${escapeSql(product.name)}', ${product.price}, ${product.originalPrice}, ${product.shippingFee}, '${product.image}', '${product.category}', '${product.gender}', '${escapeSql(product.description)}', '${escapeSql(product.details)}', ${product.inStock}, ${product.isNew}, ${product.viewers}, ${product.stockCount}, ${product.hypeScore}, ${product.velocityScore}, ${product.isHallOfFame}, '${product.synergyPath}', '${escapeSql(product.appeal)}', '${escapeSql(product.brand)}', '${escapeSql(product.tags)}', '${product.deliveryTime}', '${escapeSql(product.sizes)}', ${product.isCustom}, '${escapeSql(product.images)}', '${escapeSql(product.colors)}', '${escapeSql(product.colorVariants)}', '${product.createdAt}', ${product.offeredDiscount});`;
    sqlInserts.push(sqlStr);
  }

  // Execute database transaction
  db.transaction(() => {
    for (const p of finalProducts) {
      insertStmt.run(
        p.id, p.name, p.price, p.originalPrice, p.shippingFee, p.image, p.category, p.gender, p.description, p.details,
        p.inStock, p.isNew, p.viewers, p.stockCount, p.hypeScore, p.velocityScore, p.isHallOfFame, p.synergyPath,
        p.appeal, p.brand, p.tags, p.deliveryTime, p.sizes, p.isCustom, p.images, p.colors, p.colorVariants, p.createdAt,
        p.offeredDiscount, p.video
      );
    }
  })();

  console.log(`Database seeded with ${finalProducts.length} high-fidelity products loaded with dynamic color variants!`);

  // Write migrations
  fs.writeFileSync('products_migration.json', JSON.stringify(finalProducts, null, 2));
  fs.writeFileSync('products_migration.sql', sqlInserts.join('\n'));
  console.log('Restored products_migration.json and products_migration.sql with rich product data!');
}

seed().catch(err => {
  console.error('Fatal error during seed run:', err);
  process.exit(1);
}).finally(() => {
  db.close();
});
