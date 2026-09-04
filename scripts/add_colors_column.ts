import Database from 'better-sqlite3';
const db = new Database('database.sqlite');

try {
    const info = db.prepare("PRAGMA table_info(products)").all();
    const hasColors = info.some(c => c.name === 'colors');
    
    if (!hasColors) {
        console.log('Adding colors column to products table...');
        db.prepare("ALTER TABLE products ADD COLUMN colors TEXT").run();
        console.log('Done.');
    } else {
        console.log('colors column already exists.');
    }
} catch (e) {
    console.error('Error updating schema:', e);
} finally {
    db.close();
}
