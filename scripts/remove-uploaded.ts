import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = 'database.sqlite';
console.log(`Connecting to database: ${dbPath}...`);
const db = new Database(dbPath);

try {
  console.log("Analyzing existing 'ck_' prefixed products in the database...");
  
  // Find all products starting with 'ck_'
  const products = db.prepare("SELECT id, image, images FROM products WHERE id LIKE 'ck_%'").all() as { id: string; image: string; images: string }[];
  console.log(`Found ${products.length} products to remove.`);

  if (products.length === 0) {
    console.log('No products found with ID starting with "ck_".');
  } else {
    console.log('Cleaning up files from filesystem...');
    let filesRemoved = 0;

    for (const prod of products) {
      const imageList: string[] = [];
      
      // Parse main cover image
      if (prod.image) {
        imageList.push(prod.image);
      }
      
      // Parse images array if exists
      if (prod.images) {
        try {
          const extraImages = JSON.parse(prod.images);
          if (Array.isArray(extraImages)) {
            extraImages.forEach(img => {
              if (typeof img === 'string') {
                imageList.push(img);
              }
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Filter to unique paths and delete them from disk
      const uniqueImages = Array.from(new Set(imageList));
      for (const relativePath of uniqueImages) {
        // Since image path is usually /uploads/products/ck_xxx.webp, resolve to absolute public folder
        const absolutePath = path.join(process.cwd(), 'public', relativePath);
        if (fs.existsSync(absolutePath)) {
          try {
            fs.unlinkSync(absolutePath);
            filesRemoved++;
            console.log(`Deleted asset: ${relativePath}`);
          } catch (err) {
            console.error(`Failed to delete asset ${absolutePath}:`, err);
          }
        }
      }
    }

    console.log(`Total image files removed from disk: ${filesRemoved}`);

    console.log('Deleting database records associated with these products...');
    db.pragma('foreign_keys = ON');

    // Delete reviews associated with ck_ products
    const reviewsResult = db.prepare("DELETE FROM product_reviews WHERE productId LIKE 'ck_%'").run();
    console.log(`Deleted reviews count: ${reviewsResult.changes}`);

    // Delete try_ons associated with ck_ products
    const tryOnsResult = db.prepare("DELETE FROM try_ons WHERE productId LIKE 'ck_%'").run();
    console.log(`Deleted try_on sessions count: ${tryOnsResult.changes}`);

    // Delete price anomalies associated with ck_ products
    const anomaliesResult = db.prepare("DELETE FROM price_anomalies WHERE productId LIKE 'ck_%'").run();
    console.log(`Deleted price anomalies count: ${anomaliesResult.changes}`);

    // Finally, delete the products themselves
    const deleteResult = db.prepare("DELETE FROM products WHERE id LIKE 'ck_%'").run();
    console.log(`Deleted products count: ${deleteResult.changes}`);

    // Vacuum database to reclaim disk space
    console.log('Running VACUUM to optimize database...');
    db.exec('VACUUM;');
    console.log('Database vacuum completed successfully.');
  }

  console.log('Successfully completed cleanup of all script-uploaded products!');
} catch (error) {
  console.error('An error occurred during cleanup:', error);
  process.exit(1);
}
