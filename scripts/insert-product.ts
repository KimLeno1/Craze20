import Database from 'better-sqlite3';

const sqliteDb = new Database('./database.sqlite');

const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(7);
const name = "Cyberpunk Obsidian Jacket";
const price = 250;
const originalPrice = 300;
const shippingFee = 15;
const image = "https://images.unsplash.com/photo-1550605652-320d39e3b320?auto=format&fit=crop&q=80&w=800";
const category = "Outerwear";
const gender = "UNISEX";
const description = "Elite modular outerwear built for the dystopian metropolis. Features asymmetric zippers, reinforced collar, and zero-point aesthetic.";
const details = JSON.stringify(["Water-resistant shell", "Hidden magnetic pockets", "Reflective neon accents"]);
const inStock = 1;
const stockCount = 42;
const hypeScore = 95;
const viewers = 1204;
const velocityScore = 88;
const isNew = 1;
const likes = 340;
const isHallOfFame = 0;
const synergyPath = "core-streetwear";
const appeal = "Mass";
const supplierId = null;

const brand = "NeoCorp";

try {
  const info = sqliteDb.prepare(`
    INSERT INTO products (
      id, name, price, originalPrice, shippingFee, image, category, gender, 
      description, details, inStock, stockCount, hypeScore, viewers, 
      velocityScore, isNew, isHallOfFame, synergyPath, appeal, supplierId, brand
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, price, originalPrice, shippingFee, image, category, gender, description, details, inStock, stockCount, hypeScore, viewers, velocityScore, isNew, isHallOfFame, synergyPath, appeal, supplierId, brand);
  console.log("Product inserted successfully with ID:", id, "Info:", info);
} catch (err) {
  console.error("Error inserting product:", err);
}

sqliteDb.close();
