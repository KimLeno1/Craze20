
import Database from 'better-sqlite3';
const db = new Database('database.sqlite');

try {
    const info = db.prepare("PRAGMA table_info(products)").all();
    const hasImages = info.some(c => c.name === 'images');
    
    if (!hasImages) {
        console.log('Adding images column to products table...');
        db.prepare("ALTER TABLE products ADD COLUMN images TEXT").run();
        // Initialize with the current image as the only element in the array
        const products = db.prepare("SELECT id, image FROM products").all();
        console.log(`Updating ${products.length} products...`);
        for (const p of products) {
            const images = p.image ? JSON.stringify([p.image]) : '[]';
            db.prepare("UPDATE products SET images = ? WHERE id = ?").run(images, p.id);
        }
        console.log('Done.');
    } else {
        console.log('images column already exists.');
    }
} catch (e) {
    console.error('Error updating schema:', e);
} finally {
    db.close();
}
