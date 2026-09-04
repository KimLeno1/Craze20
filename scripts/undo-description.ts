import Database from 'better-sqlite3';

const dbPath = 'database.sqlite';
console.log(`Connecting to database: ${dbPath}...`);
const db = new Database(dbPath);

try {
  console.log("Analyzing existing 'ck_' prefixed products in the database...");
  
  // Find match count
  const products = db.prepare("SELECT COUNT(*) as count FROM products WHERE id LIKE 'ck_%'").get() as { count: number };
  console.log(`Found ${products.count} products with ID prefix 'ck_' inside the database.`);

  if (products.count === 0) {
    console.log('No products to update. (Note: if you cleared or haven\'t run upload-and-convert.ts yet, this is expected).');
  } else {
    console.log("Updating description of all 'ck_' products to be their product name...");
    const result = db.prepare("UPDATE products SET description = name WHERE id LIKE 'ck_%'").run();
    console.log(`Successfully updated ${result.changes} product descriptions!`);
  }

  console.log('Done!');
} catch (error) {
  console.error('An error occurred during the description undo process:', error);
  process.exit(1);
}
