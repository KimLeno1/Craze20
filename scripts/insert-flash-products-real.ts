import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const sqliteDb = new Database('./database.sqlite');

const newProducts = [
  {
    id: 'prod_kfam_stealth_parka_2026',
    name: "KFam Cyberpunk Stealth Parka",
    price: 159,
    originalPrice: 399,
    shippingFee: 15,
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800",
    category: "Apparel",
    gender: "UNISEX",
    description: "Designed exclusively for KFam members. Features matte-black windproofing, modular harness systems, and hidden internal RFID-blocking card pockets.",
    details: ["Matte-black windproof tech shell", "Modular front harness webbing", "RFID-blocking pocket vault", "Adjustable magnetic cuff straps"],
    inStock: 1,
    stockCount: 15,
    hypeScore: 99,
    viewers: 1450,
    velocityScore: 97,
    isNew: 1,
    isHallOfFame: 1,
    synergyPath: "EXCLUSIVE_DROP",
    appeal: "Highly Demanded Aesthetic Release",
    brand: "KFAM-SPEC",
    tags: ["limited", "exclusive", "kfam", "flash"],
    deliveryTime: "2-4 business days",
    sizes: ["S", "M", "L", "XL"],
    isCustom: 0,
    images: ["https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800"],
    colors: ["Matte Black"],
    colorVariants: [{"main": "#000000", "secondary": "#1a1a1a"}],
    offeredDiscount: 60
  },
  {
    id: 'prod_acid_matrix_vest_2026',
    name: "Acid Matrix Utility Vest (Quick Sale)",
    price: 79,
    originalPrice: 199,
    shippingFee: 15,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
    category: "Apparel",
    gender: "UNISEX",
    description: "Hyper-durable high-contrast utility vest featuring multi-point buckle locks, modular velcro load-out zones, and glowing contrast stitching.",
    details: ["Abrasion-resistant canvas build", "Luminescent high-contrast stitching", "Quick-release metal buckle strap locks", "Removable patch attachments"],
    inStock: 1,
    stockCount: 22,
    hypeScore: 96,
    viewers: 820,
    velocityScore: 94,
    isNew: 1,
    isHallOfFame: 0,
    synergyPath: "EXCLUSIVE_DROP",
    appeal: "Highly Demanded Aesthetic Release",
    brand: "GLITCH",
    tags: ["limited", "exclusive", "utility", "flash"],
    deliveryTime: "2-4 business days",
    sizes: ["M", "L", "XL"],
    isCustom: 0,
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800"],
    colors: ["Acid Lime", "Pitch Black"],
    colorVariants: [{"main": "#00FF66", "secondary": "#001F0D"}, {"main": "#0A0A0A", "secondary": "#262626"}],
    offeredDiscount: 60
  },
  {
    id: 'prod_retro_future_trainers_2026',
    name: "Retro-Future Neon Trainers",
    price: 129,
    originalPrice: 289,
    shippingFee: 15,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=800",
    category: "Footwear",
    gender: "UNISEX",
    description: "Chunky high-traction sneakers built with shock-absorbing platform soles, luminescent details, and premium breathable mesh panels.",
    details: ["Platform elevation support (5cm)", "Glow-in-the-dark contrast trim panels", "Heavyweight durable rubber sole grips", "Internal cushion cloud insulation"],
    inStock: 1,
    stockCount: 18,
    hypeScore: 98,
    viewers: 1100,
    velocityScore: 95,
    isNew: 1,
    isHallOfFame: 1,
    synergyPath: "EXCLUSIVE_DROP",
    appeal: "Highly Demanded Aesthetic Release",
    brand: "GLITCH",
    tags: ["limited", "exclusive", "footwear", "flash"],
    deliveryTime: "2-4 business days",
    sizes: ["38", "39", "40", "41", "42", "43"],
    isCustom: 0,
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=800"],
    colors: ["Neon Pulse Green", "Cosmic Cyan"],
    colorVariants: [{"main": "#CCFF00", "secondary": "#0F1A00"}, {"main": "#00D1FF", "secondary": "#0B132B"}],
    offeredDiscount: 55
  }
];

const nowISO = new Date().toISOString();

for (const product of newProducts) {
  try {
    // Insert into DB
    sqliteDb.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, price, originalPrice, shippingFee, image, category, gender, 
        description, details, inStock, stockCount, hypeScore, viewers, 
        velocityScore, isNew, isHallOfFame, synergyPath, appeal, brand, tags, 
        deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt, offeredDiscount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product.id,
      product.name,
      product.price,
      product.originalPrice,
      product.shippingFee,
      product.image,
      product.category,
      product.gender,
      product.description,
      JSON.stringify(product.details),
      product.inStock,
      product.stockCount,
      product.hypeScore,
      product.viewers,
      product.velocityScore,
      product.isNew,
      product.isHallOfFame,
      product.synergyPath,
      product.appeal,
      product.brand,
      JSON.stringify(product.tags),
      product.deliveryTime,
      JSON.stringify(product.sizes),
      product.isCustom,
      JSON.stringify(product.images),
      JSON.stringify(product.colors),
      JSON.stringify(product.colorVariants),
      nowISO,
      product.offeredDiscount
    );
    console.log(`Successfully inserted: ${product.name}`);

    // Append SQL to products_migration.sql
    const sqlLine = `INSERT OR REPLACE INTO products (id, name, price, originalPrice, shippingFee, image, category, gender, description, details, inStock, isNew, viewers, stockCount, hypeScore, velocityScore, isHallOfFame, synergyPath, appeal, brand, tags, deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt, offeredDiscount) VALUES ('${product.id}', '${product.name.replace(/'/g, "''")}', ${product.price}, ${product.originalPrice}, ${product.shippingFee}, '${product.image}', '${product.category}', '${product.gender}', '${product.description.replace(/'/g, "''")}', '${JSON.stringify(product.details).replace(/'/g, "''")}', ${product.inStock}, ${product.isNew}, ${product.viewers}, ${product.stockCount}, ${product.hypeScore}, ${product.velocityScore}, ${product.isHallOfFame}, '${product.synergyPath}', '${product.appeal}', '${product.brand}', '${JSON.stringify(product.tags).replace(/'/g, "''")}', '${product.deliveryTime}', '${JSON.stringify(product.sizes).replace(/'/g, "''")}', ${product.isCustom}, '${JSON.stringify(product.images).replace(/'/g, "''")}', '${JSON.stringify(product.colors).replace(/'/g, "''")}', '${JSON.stringify(product.colorVariants).replace(/'/g, "''")}', '${nowISO}', ${product.offeredDiscount});`;
    fs.appendFileSync(path.join(process.cwd(), 'products_migration.sql'), '\n' + sqlLine);
  } catch (err) {
    console.error(`Failed to insert ${product.name}:`, err);
  }
}

sqliteDb.close();
console.log('Seeding done successfully!');
