import Database from 'better-sqlite3';
const db = new Database('database.sqlite');

try {
    const info = db.prepare("PRAGMA table_info(products)").all();
    console.log('Columns in products table:', info.map(c => c.name).join(', '));
} catch (e) {
    console.error('Error fetching table info:', e);
} finally {
    db.close();
}
