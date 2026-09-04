import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = 'database.sqlite';
console.log(`Connecting to database: ${dbPath}...`);
const db = new Database(dbPath);

try {
  // First, let's query the count of products before deletion
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  console.log(`Current number of products in database: ${productCount.count}`);

  // Disable foreign key constraint issues during cleanup or delete sequentially
  console.log('Enabling WAL and cleaning up dependent tables...');
  db.pragma('foreign_keys = ON');

  // Delete reviews
  const reviewsInfo = db.prepare('DELETE FROM product_reviews').run();
  console.log(`Deleted reviews count: ${reviewsInfo.changes}`);

  // Delete try ons
  const tryOnsInfo = db.prepare('DELETE FROM try_ons').run();
  console.log(`Deleted try_on sessions count: ${tryOnsInfo.changes}`);

  // Delete price anomalies
  const anomaliesInfo = db.prepare('DELETE FROM price_anomalies').run();
  console.log(`Deleted price anomalies count: ${anomaliesInfo.changes}`);

  // Delete all products
  const productsInfo = db.prepare('DELETE FROM products').run();
  console.log(`Deleted products count: ${productsInfo.changes}`);

  // Run VACUUM to reclaim disk size inside the SQLite file
  console.log('Running VACUUM to shrink database size and optimize... This can take a moment.');
  db.exec('VACUUM;');
  console.log('Database vacuumed successfully. File size optimized.');

  // Clean up products migration static files if present
  console.log('Checking for static migration files to remove...');
  const migrationFiles = ['products_migration.sql', 'products_migration.json'];
  for (const f of migrationFiles) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`Removed static file: ${f}`);
    }
  }

  // Recursively clean up generated webp cached images in uploads
  const uploadsProductsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
  console.log(`Cleaning up files inside uploads product directory: ${uploadsProductsDir}...`);
  if (fs.existsSync(uploadsProductsDir)) {
    const deleteFolderRecursive = (dirPath: string) => {
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
          const curPath = path.join(dirPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            // Delete subdirectory recursively
            deleteFolderRecursive(curPath);
          } else {
            // Delete file
            fs.unlinkSync(curPath);
          }
        });
        // Remove the directory itself if it is not the root products folder
        if (dirPath !== uploadsProductsDir) {
          fs.rmdirSync(dirPath);
        }
      };
    };
    deleteFolderRecursive(uploadsProductsDir);
    console.log('Successfully cleared uploaded product assets and images cache.');
  }

  console.log('All product records and files deleted successfully. Clean slate achieved.');
} catch (error) {
  console.error('An error occurred during product deletion process:', error);
  process.exit(1);
}
