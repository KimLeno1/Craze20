import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name).join(', '));
    
    const info = db.prepare("PRAGMA table_info(products)").all();
    console.log('Product Columns:', info.map(c => c.name).join(', '));
} catch (e) {
    console.error('Error checking products table:', e);
} finally {
    db.close();
}
