import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, authenticateAny, authenticateAdmin, authorize } from '../middleware/auth.js';
const router = Router();
router.get('/personalized/:userId', authenticate, async (req, res) => {
    const userId = req.params.userId;
    if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ status: 'error', message: 'Unauthorized personalization access' });
    }
    try {
        const prefs = await db.get('SELECT * FROM user_preferences WHERE userId = ?', [userId]);
        const stats = await db.get('SELECT brandSubscriptions, tagSubscriptions FROM user_stats WHERE userId = ?', [userId]);
        const preferredCategories = prefs && prefs.preferredCategories ? JSON.parse(prefs.preferredCategories) : [];
        const brandSubs = stats && stats.brandSubscriptions ? JSON.parse(stats.brandSubscriptions) : [];
        const tagSubs = stats && stats.tagSubscriptions ? JSON.parse(stats.tagSubscriptions) : [];
        const allProducts = await db.all('SELECT * FROM products');
        const personalized = allProducts.filter(p => {
            const pTags = p.tags ? JSON.parse(p.tags) : [];
            return preferredCategories.includes(p.category) ||
                brandSubs.includes(p.brand) ||
                pTags.some((t) => tagSubs.includes(t));
        });
        const others = allProducts.filter(p => !personalized.includes(p));
        const result = [...personalized, ...others].map(row => ({
            ...row,
            details: (() => { try {
                const d = JSON.parse(row.details);
                return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : [];
            }
            catch {
                return [];
            } })(),
            tags: row.tags ? JSON.parse(row.tags) : [],
            sizes: row.sizes ? JSON.parse(row.sizes) : [],
            colors: row.colors ? JSON.parse(row.colors) : [],
            colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
            images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
            priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
            customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
        }));
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching personalized products:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch personalized products' });
    }
});
router.get('/', async (req, res) => {
    const { supplierId } = req.query;
    try {
        let rows;
        if (supplierId) {
            rows = await db.all('SELECT * FROM products WHERE supplierId = ?', [supplierId]);
        }
        else {
            rows = await db.all('SELECT * FROM products');
        }
        // Parse JSON fields
        const products = rows.map(row => ({
            ...row,
            details: (() => { try {
                const d = JSON.parse(row.details);
                return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : [];
            }
            catch {
                return [];
            } })(),
            tags: row.tags ? JSON.parse(row.tags) : [],
            sizes: row.sizes ? JSON.parse(row.sizes) : [],
            colors: row.colors ? JSON.parse(row.colors) : [],
            colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
            images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
            priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
            customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
        }));
        res.json(products);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch products' });
    }
});
router.post('/', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), [
    body('name').notEmpty().withMessage('Name is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('originalPrice').optional().isNumeric().withMessage('Original price must be a number')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    const { id, name, price, originalPrice, shippingFee, image, images, colors, colorVariants, category, gender, description, details, inStock, isNew, viewers, stockCount, isHallOfFame, synergyPath, appeal, brand, tags, supplierId, sizes, isCustom, priceRange, customizationFields, offeredDiscount, video } = req.body;
    const productId = id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalOriginalPrice = originalPrice || price;
    const finalImages = images || (image ? [image] : []);
    let finalOfferedDiscount = (offeredDiscount && offeredDiscount > 0)
        ? offeredDiscount
        : (finalOriginalPrice > price ? ((finalOriginalPrice - price) / finalOriginalPrice * 100) : 0);
    if (finalOfferedDiscount > 30)
        finalOfferedDiscount = 30;
    const createdAt = new Date().toISOString();
    try {
        // If supplier, ensure they only set their own ID
        const effectiveSupplierId = req.user?.role === 'SUPPLIER' ? req.user.id : supplierId;
        // Validate tags if supplier
        if (req.user?.role === 'SUPPLIER' && tags && Array.isArray(tags) && tags.length > 0) {
            const allAdminTags = await db.all('SELECT name FROM tags');
            const adminTagNames = allAdminTags.map((t) => t.name);
            const invalidTags = tags.filter(t => !adminTagNames.includes(t));
            if (invalidTags.length > 0) {
                return res.status(400).json({ status: 'error', message: `Suppliers can only use admin-created tags. Invalid tags: ${invalidTags.join(', ')}` });
            }
        }
        await db.run(`INSERT INTO products (
        id, name, price, originalPrice, shippingFee, image, images, colors, category, gender, 
        description, details, inStock, isNew, viewers, stockCount, 
        isHallOfFame, synergyPath, appeal, brand, tags, 
        supplierId, deliveryTime, sizes, isCustom, priceRange, customizationFields,
        colorVariants, createdAt, offeredDiscount, video
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            productId,
            name,
            price,
            finalOriginalPrice,
            shippingFee || 0,
            image || (finalImages.length > 0 ? finalImages[0] : null),
            JSON.stringify(finalImages),
            colors ? JSON.stringify(colors) : '[]',
            category || null,
            gender || 'UNISEX',
            description || null,
            details ? JSON.stringify(details) : '[]',
            inStock === false ? 0 : 1,
            isNew ? 1 : 0,
            viewers || 0,
            stockCount || 0,
            isHallOfFame ? 1 : 0,
            synergyPath || null,
            appeal || null,
            brand || null,
            tags ? JSON.stringify(tags) : '[]',
            effectiveSupplierId || null,
            req.body.deliveryTime || null,
            sizes ? JSON.stringify(sizes) : '[]',
            isCustom ? 1 : 0,
            priceRange ? JSON.stringify(priceRange) : null,
            customizationFields ? JSON.stringify(customizationFields) : '[]',
            colorVariants ? JSON.stringify(colorVariants) : '[]',
            createdAt,
            finalOfferedDiscount,
            video || null
        ]);
        res.status(201).json({ status: 'success', message: 'Product created', id: productId });
    }
    catch (error) {
        console.error('Error creating product:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            payload: { name, price, supplierId }
        });
        res.status(500).json({ status: 'error', message: `Failed to create product: ${error.message || 'Unknown error'}` });
    }
});
router.patch('/:id', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), async (req, res) => {
    const productId = req.params.id;
    const updates = req.body;
    try {
        const existing = await db.get('SELECT supplierId FROM products WHERE id = ?', [productId]);
        if (!existing)
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        // Validate ownership if supplier
        if (req.user?.role === 'SUPPLIER' && existing.supplierId !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized product modification' });
        }
        // Validate tags if supplier
        if (req.user?.role === 'SUPPLIER' && updates.tags && Array.isArray(updates.tags) && updates.tags.length > 0) {
            const allAdminTags = await db.all('SELECT name FROM tags');
            const adminTagNames = allAdminTags.map((t) => t.name);
            const invalidTags = updates.tags.filter((t) => !adminTagNames.includes(t));
            if (invalidTags.length > 0) {
                return res.status(400).json({ status: 'error', message: `Suppliers can only use admin-created tags. Invalid tags: ${invalidTags.join(', ')}` });
            }
        }
        const fields = Object.keys(updates);
        if (fields.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields to update' });
        }
        const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
        const values = fields.map(field => {
            const val = updates[field];
            if (val === null || val === undefined)
                return null;
            if (typeof val === 'boolean')
                return val ? 1 : 0;
            if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
                return JSON.stringify(val);
            }
            return val;
        });
        values.push(productId);
        await db.run(`UPDATE products SET ${setClause} WHERE id = ?`, values);
        res.json({ status: 'success', message: 'Product updated' });
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update product' });
    }
});
router.delete('/:id', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), async (req, res) => {
    try {
        const existing = await db.get('SELECT supplierId FROM products WHERE id = ?', [req.params.id]);
        if (!existing)
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        if (req.user?.role === 'SUPPLIER' && existing.supplierId !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized product deletion' });
        }
        await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ status: 'success', message: 'Product deleted' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete product' });
    }
});
router.patch('/:id/hall-of-fame', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
    const { isHallOfFame } = req.body;
    try {
        await db.run('UPDATE products SET `isHallOfFame` = ? WHERE `id` = ?', [isHallOfFame ? 1 : 0, req.params.id]);
        res.json({ status: 'success' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update hall of fame' });
    }
});
router.get('/hall-of-fame', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM products WHERE isHallOfFame = 1');
        const products = rows.map(row => ({
            ...row,
            details: (() => { try {
                const d = JSON.parse(row.details);
                return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : [];
            }
            catch {
                return [];
            } })(),
            tags: row.tags ? JSON.parse(row.tags) : [],
            sizes: row.sizes ? JSON.parse(row.sizes) : [],
            colors: row.colors ? JSON.parse(row.colors) : [],
            colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
            images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
            priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
            customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
        }));
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch hall of fame products' });
    }
});
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query)
        return res.json([]);
    try {
        const searchTerm = `%${query}%`;
        const rows = await db.all(`SELECT * FROM products 
       WHERE name LIKE ? OR category LIKE ? OR brand LIKE ? OR tags LIKE ?`, [searchTerm, searchTerm, searchTerm, searchTerm]);
        const products = rows.map(row => ({
            ...row,
            details: (() => { try {
                const d = JSON.parse(row.details);
                return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : [];
            }
            catch {
                return [];
            } })(),
            tags: row.tags ? JSON.parse(row.tags) : [],
            sizes: row.sizes ? JSON.parse(row.sizes) : [],
            colors: row.colors ? JSON.parse(row.colors) : [],
            colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
            images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
            priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
            customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
        }));
        res.json(products);
    }
    catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ status: 'error', message: 'Failed to search products' });
    }
});
router.get('/:id/reviews', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM product_reviews WHERE productId = ? ORDER BY timestamp DESC', [req.params.id]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch product reviews' });
    }
});
router.post('/:id/reviews', authenticate, async (req, res) => {
    const { userId, userHandle, rating, comment } = req.body;
    const productId = req.params.id;
    if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ status: 'error', message: 'Unauthorized review submission' });
    }
    try {
        // 1. Verify that the user has a DELIVERED order for this product
        // We look for the productId in the items JSON string in the orders table
        const deliveredOrder = await db.get("SELECT id FROM orders WHERE userId = ? AND status = 'DELIVERED' AND items LIKE ?", [userId, `%${productId}%`]);
        if (!deliveredOrder && req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                status: 'error',
                message: 'You can only review products that have been delivered to you.'
            });
        }
        // 2. Prevent duplicate reviews
        const existingReview = await db.get('SELECT id FROM product_reviews WHERE productId = ? AND userId = ?', [productId, userId]);
        if (existingReview) {
            return res.status(400).json({
                status: 'error',
                message: 'You have already submitted a review for this product.'
            });
        }
        await db.run('INSERT INTO product_reviews (`id`, `productId`, `userId`, `userHandle`, `rating`, `comment`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?, ?)', [Date.now().toString(), productId, userId, userHandle, rating, comment, new Date().toISOString()]);
        res.status(201).json({ status: 'success', message: 'Review added' });
    }
    catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ status: 'error', message: 'Failed to add review' });
    }
});
export default router;
