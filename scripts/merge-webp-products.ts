import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = process.argv[2] || 'database.sqlite';
const jsonPath = process.argv[3] || 'products_migration.json';

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}`);
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) {
  console.error(`Products migration file not found at ${jsonPath}`);
  process.exit(1);
}

const db = new Database(dbPath);
const content = fs.readFileSync(jsonPath, 'utf8');
const products = JSON.parse(content);

console.log(`Loaded ${products.length} products from ${jsonPath}.`);
console.log(`Merging into ${dbPath}...`);

const insertStmt = db.prepare(`
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

let updated = 0;

db.transaction(() => {
  for (let p of products) {
    try {
      // Ensure paths are properly prefixed with a leading slash for next.js/vite if necessary
      // and webp formats are preserved from the updated migration json
      let image = p.image;
      if (image && !image.startsWith('/') && image.startsWith('uploads/')) {
        image = '/' + image;
      }
      
      let imagesStr = p.images;
      if (imagesStr) {
        try {
          const parsedImgs = JSON.parse(imagesStr);
          const updatedImgs = parsedImgs.map((img: string) => (!img.startsWith('/') && img.startsWith('uploads/')) ? '/' + img : img);
          imagesStr = JSON.stringify(updatedImgs);
        } catch (e) {
          // Ignore parse errors, just use as is
        }
      }

      insertStmt.run({
        ...p,
        image: image,
        images: imagesStr,
        details: p.details || '[]',
        tags: p.tags || '[]',
        colors: p.colors || '[]',
        colorVariants: p.colorVariants || '[]',
        sizes: p.sizes || '[]',
        isCustom: p.isCustom ? 1 : 0,
        inStock: p.inStock ? 1 : 0,
        isNew: p.isNew ? 1 : 0,
        isHallOfFame: p.isHallOfFame ? 1 : 0,
        video: p.video || null,
        offeredDiscount: p.offeredDiscount || 0
      });
      updated++;
    } catch (err) {
      console.error(`Failed to process product ${p.id}:`, err);
    }
  }
})();

console.log(`Merge complete! Successfully merged ${updated} products.`);
