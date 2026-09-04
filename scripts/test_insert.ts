import Database from 'better-sqlite3';
const db = new Database('database.sqlite');

const productId = 'test_prod_' + Date.now();
const finalImages = [];
const colors = [];
const details = [];
const tags = [];
const effectiveSupplierId = null;
const deliveryTime = '3-5 Days';
const sizes = [];
const priceRange = null;
const customizationFields = [];

try {
    const sql = `INSERT INTO products (
        id, name, price, originalPrice, shippingFee, image, images, colors, category, gender, 
        description, details, inStock, isNew, viewers, stockCount, hypeScore, 
        velocityScore, isHallOfFame, synergyPath, appeal, brand, tags, 
        supplierId, deliveryTime, sizes, isCustom, priceRange, customizationFields
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
        productId,
        'Test Product',
        100,
        100,
        0,
        'image.jpg',
        JSON.stringify(finalImages),
        JSON.stringify(colors),
        'Apparel',
        'UNISEX',
        'Test Description',
        JSON.stringify(details),
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        null,
        0,
        'Test Brand',
        JSON.stringify(tags),
        effectiveSupplierId,
        deliveryTime,
        JSON.stringify(sizes),
        0,
        JSON.stringify(priceRange),
        JSON.stringify(customizationFields)
    ];

    console.log('Params count:', params.length);
    const info = db.prepare(sql).run(...params);
    console.log('Insert success:', info);
} catch (e) {
    console.error('REAL ERROR:', e);
} finally {
    db.close();
}
