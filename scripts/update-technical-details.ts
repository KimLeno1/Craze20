import Database from 'better-sqlite3';

const dbPath = 'database.sqlite';
console.log(`Connecting to database: ${dbPath}...`);
const db = new Database(dbPath);

try {
  console.log("Analyzing uploaded products in the database...");
  
  // Find match count
  const products = db.prepare("SELECT COUNT(*) as count FROM products WHERE id LIKE 'ck_%'").get() as { count: number };
  console.log(`Found ${products.count} products with ID prefix 'ck_'.`);

  if (products.count === 0) {
    console.log('No products found with IDs starting with "ck_".');
  } else {
    console.log("Updating details to [] and deliveryTime to '3-7 days' for all 'ck_' products...");
    const emptyDetails = JSON.stringify([]);
    const result = db.prepare("UPDATE products SET details = ?, deliveryTime = ? WHERE id LIKE 'ck_%'").run(emptyDetails, '3-7 days');
    console.log(`Successfully updated ${result.changes} products!`);
  }

  console.log('Done!');
} catch (error) {
  console.error('An error occurred during the update process:', error);
  process.exit(1);
}
