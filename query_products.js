import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

console.log("=== Checking Products Table in DB ===");
const totalCount = db.prepare("SELECT count(*) as count FROM products").get();
console.log("Total products in database:", totalCount.count);

const suppliers = db.prepare("SELECT supplierId, count(*) as count FROM products GROUP BY supplierId").all();
console.log("Products grouped by supplier:", suppliers);

const categories = db.prepare("SELECT category, count(*) as count FROM products GROUP BY category").all();
console.log("Products grouped by category:", categories);
