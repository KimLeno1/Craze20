import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
const count = db.prepare('SELECT count(*) as count FROM products').get();
console.log('Total products in DB:', count);

// Sample product
const prod = db.prepare('SELECT * FROM products LIMIT 1').get();
console.log('Sample format:', prod.id, prod.image);
