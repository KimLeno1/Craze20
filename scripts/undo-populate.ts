import Database from 'better-sqlite3';

const dbPath = process.argv[2] || 'database.sqlite';

console.log(`Connecting to ${dbPath}...`);
const db = new Database(dbPath);

console.log(`Removing all 'ck_' prefixed products uploaded by populate-clothes.ts...`);

const info = db.prepare(`DELETE FROM products WHERE id LIKE 'ck_%'`).run();

console.log(`Undo complete! Total products removed from the database: ${info.changes}`);

