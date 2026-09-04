import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import { authenticate, authenticateAny, authenticateAdmin, optionalAuth, AuthRequest, authorize } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../lib/cache.js';

const router = Router();

const generateSlug = (name: string): string => {
  return (name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

router.get('/personalized/:userId', authenticate, async (req: AuthRequest, res: any) => {
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
             pTags.some((t: string) => tagSubs.includes(t));
    });
    
    const others = allProducts.filter(p => !personalized.includes(p));
    
    const result = [...personalized, ...others].map(row => ({
      ...row,
      details: (() => { try { const d = JSON.parse(row.details); return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : []; } catch { return []; } })(),
      tags: row.tags ? JSON.parse(row.tags) : [],
      sizes: row.sizes ? JSON.parse(row.sizes) : [],
      colors: row.colors ? JSON.parse(row.colors) : [],
      colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
      images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
      priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
      customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching personalized products:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch personalized products' });
  }
});

router.get('/', async (req, res) => {
  const { supplierId, category, page: reqPage, limit: reqLimit, sort: reqSort, all } = req.query;

  const isAll = all === 'true' || reqLimit === 'all' || reqLimit === '0';
  const page = Math.max(1, parseInt(reqPage as string) || 1);
  const limit = isAll ? 500 : Math.min(100, Math.max(1, parseInt(reqLimit as string) || 24));
  const offset = (page - 1) * limit;
  const sort = (reqSort as string) || 'newest';

  const cacheKey = `products:list:${supplierId || ''}:${category || ''}:${page}:${limit}:${sort}:${isAll ? 'all' : ''}`;

  try {
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      if (typeof cached === 'object' && cached !== null && cached.pagination) {
        res.setHeader('X-Total-Count', cached.pagination.total);
        res.setHeader('X-Page', cached.pagination.page);
        res.setHeader('X-Limit', cached.pagination.limit);
        res.setHeader('X-Total-Pages', cached.pagination.totalPages);
      }
      return res.json(cached);
    }

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (supplierId) {
      whereClause += ' AND supplierId = ?';
      params.push(supplierId);
    }

    if (category && typeof category === 'string' && category.trim() !== '' && category.trim().toLowerCase() !== 'all') {
      const catParam = category.trim();
      const categoryMatch = await db.get(
        'SELECT id, name, slug FROM categories WHERE id = ? OR LOWER(slug) = LOWER(?) OR LOWER(name) = LOWER(?)',
        [catParam, catParam, catParam]
      );

      if (categoryMatch) {
        whereClause += ' AND (categoryId = ? OR LOWER(TRIM(category)) = LOWER(?) OR LOWER(TRIM(category)) = LOWER(?))';
        params.push(categoryMatch.id, categoryMatch.name, categoryMatch.slug);
      } else {
        whereClause += ' AND (categoryId = ? OR LOWER(TRIM(category)) = LOWER(?))';
        params.push(catParam, catParam);
      }
    }

    // Calculate total count matching filters
    const countRow = await db.get(`SELECT COUNT(*) as total FROM products ${whereClause}`, params);
    const total = countRow ? Number(countRow.total) || 0 : 0;

    // Sorting logic
    let orderBy = 'ORDER BY createdAt DESC';
    if (sort === 'price_asc') {
      orderBy = 'ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'ORDER BY price DESC';
    } else if (sort === 'hype') {
      orderBy = 'ORDER BY isHallOfFame DESC, rating DESC, createdAt DESC';
    }

    let query = `SELECT * FROM products ${whereClause} ${orderBy}`;
    if (!isAll) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const rows = await db.all(query, params);

    // Compact grid representation (omits heavy fields like details, colorVariants, customizationFields, description)
    const products = rows.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      originalPrice: row.originalPrice || row.price,
      shippingFee: row.shippingFee || 0,
      image: row.image || (row.images ? (JSON.parse(row.images)[0] || null) : null),
      images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
      category: row.category || null,
      categoryId: row.categoryId || null,
      gender: row.gender || 'UNISEX',
      inStock: Boolean(row.inStock !== 0),
      isNew: Boolean(row.isNew),
      isHallOfFame: Boolean(row.isHallOfFame),
      isFamous: Boolean(row.isHallOfFame),
      brand: row.brand || null,
      tags: row.tags ? JSON.parse(row.tags) : [],
      badges: row.badges ? JSON.parse(row.badges) : [],
      offeredDiscount: row.offeredDiscount || 0,
      slug: row.slug || generateSlug(row.name),
      supplierId: row.supplierId || null,
      rating: Number(row.rating) || 5,
      reviewsCount: Number(row.reviewsCount) || 0
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    // Response structure
    const responsePayload = (reqPage || reqLimit || reqSort || req.query.paginate === 'true')
      ? {
          status: 'success',
          products,
          pagination: {
            total,
            page,
            limit,
            totalPages
          }
        }
      : products; // Returns array directly when plain query for full backward compatibility

    await cacheSet(cacheKey, responsePayload, 300); // 5 min TTL

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Total-Count', total);
    res.setHeader('X-Page', page);
    res.setHeader('X-Limit', limit);
    res.setHeader('X-Total-Pages', totalPages);

    res.json(responsePayload);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch products' });
  }
});

router.post('/', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('originalPrice').optional().isNumeric().withMessage('Original price must be a number')
], async (req: AuthRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  let { 
    id, name, price, originalPrice, shippingFee, image, images, colors, colorVariants, category, categoryId, gender, 
    description, details, inStock, isNew, viewers, stockCount, 
    isHallOfFame, synergyPath, appeal, brand, tags, 
    supplierId, sizes, isCustom, priceRange, customizationFields, offeredDiscount, video
  } = req.body;

  try {
    // Validate categoryId and category
    if (categoryId) {
      const cat = await db.get('SELECT id, name FROM categories WHERE id = ?', [categoryId]);
      if (!cat) {
        return res.status(400).json({ status: 'error', message: `Invalid categoryId: Category '${categoryId}' does not exist in categories table.` });
      }
      if (!category) {
        category = cat.name;
      }
    } else if (category) {
      const cat = await db.get(
        'SELECT id, name FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(slug)) = LOWER(TRIM(?))',
        [category, category]
      );
      if (cat) {
        categoryId = cat.id;
        category = cat.name;
      }
    }

    const productId = id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalOriginalPrice = originalPrice || price;
    const finalImages = images || (image ? [image] : []);
    let finalOfferedDiscount = (offeredDiscount && offeredDiscount > 0) 
      ? offeredDiscount 
      : (finalOriginalPrice > price ? ((finalOriginalPrice - price) / finalOriginalPrice * 100) : 0);
    
    if (finalOfferedDiscount > 30) finalOfferedDiscount = 30;
    const createdAt = new Date().toISOString();

    // If supplier, ensure they only set their own ID
    const effectiveSupplierId = req.user?.role === 'SUPPLIER' ? req.user.id : supplierId;

    // Validate tags if supplier
    if (req.user?.role === 'SUPPLIER' && tags && Array.isArray(tags) && tags.length > 0) {
      const allAdminTags = await db.all('SELECT name FROM tags');
      const adminTagNames = allAdminTags.map((t: any) => t.name);
      const invalidTags = tags.filter(t => !adminTagNames.includes(t));
      if (invalidTags.length > 0) {
        return res.status(400).json({ status: 'error', message: `Suppliers can only use admin-created tags. Invalid tags: ${invalidTags.join(', ')}` });
      }
    }

    await db.run(
      `INSERT INTO products (
        id, name, price, originalPrice, shippingFee, image, images, colors, category, categoryId, gender, 
        description, details, inStock, isNew, viewers, stockCount, 
        isHallOfFame, synergyPath, appeal, brand, tags, 
        supplierId, deliveryTime, sizes, isCustom, priceRange, customizationFields,
        colorVariants, createdAt, offeredDiscount, video
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        name,
        price,
        finalOriginalPrice,
        shippingFee || 0,
        image || (finalImages.length > 0 ? finalImages[0] : null),
        JSON.stringify(finalImages),
        colors ? JSON.stringify(colors) : '[]',
        category || null,
        categoryId || null,
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
      ]
    );
    res.status(201).json({ status: 'success', message: 'Product created', id: productId, categoryId });
  } catch (error: any) {
    console.error('Error creating product:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      payload: { name, price, supplierId } 
    });
    res.status(500).json({ status: 'error', message: `Failed to create product: ${error.message || 'Unknown error'}` });
  }
});

const handleProductUpdate = async (req: AuthRequest, res: any) => {
  const productId = req.params.id;
  const updates = { ...req.body };
  
  try {
    const existing = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Product not found' });

    // Validate ownership if supplier
    if (req.user?.role === 'SUPPLIER' && existing.supplierId !== req.user.id) {
       return res.status(403).json({ status: 'error', message: 'Unauthorized product modification' });
    }

    // Validate categoryId if provided in updates
    if (updates.categoryId !== undefined) {
      if (updates.categoryId) {
        const cat = await db.get('SELECT id, name FROM categories WHERE id = ?', [updates.categoryId]);
        if (!cat) {
          return res.status(400).json({ status: 'error', message: `Invalid categoryId: Category '${updates.categoryId}' does not exist in categories table.` });
        }
        if (!updates.category) {
          updates.category = cat.name;
        }
      }
    } else if (updates.category !== undefined && updates.category) {
      const cat = await db.get(
        'SELECT id, name FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(slug)) = LOWER(TRIM(?))',
        [updates.category, updates.category]
      );
      if (cat) {
        updates.categoryId = cat.id;
        updates.category = cat.name;
      }
    }

    // Validate tags if supplier
    if (req.user?.role === 'SUPPLIER' && updates.tags && Array.isArray(updates.tags) && updates.tags.length > 0) {
      const allAdminTags = await db.all('SELECT name FROM tags');
      const adminTagNames = allAdminTags.map((t: any) => t.name);
      const invalidTags = updates.tags.filter((t: any) => !adminTagNames.includes(t));
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
      if (val === null || val === undefined) return null;
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        return JSON.stringify(val);
      }
      return val;
    });

    values.push(productId);
    
    await db.run(`UPDATE products SET ${setClause} WHERE id = ?`, values);
    await cacheInvalidatePattern('products:');
    res.json({ status: 'success', message: 'Product updated' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update product' });
  }
};

router.patch('/:id', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), handleProductUpdate);
router.put('/:id', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), handleProductUpdate);

router.delete('/:id', authenticateAny, authorize(['ADMIN', 'SUPPLIER']), async (req: AuthRequest, res: any) => {
  try {
    const existing = await db.get('SELECT supplierId FROM products WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Product not found' });

    if (req.user?.role === 'SUPPLIER' && existing.supplierId !== req.user.id) {
       return res.status(403).json({ status: 'error', message: 'Unauthorized product deletion' });
    }

    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    await cacheInvalidatePattern('products:');
    res.json({ status: 'success', message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete product' });
  }
});

router.patch('/:id/hall-of-fame', authenticateAdmin, authorize(['ADMIN']), async (req: AuthRequest, res: any) => {
  const { isHallOfFame } = req.body;
  try {
    await db.run('UPDATE products SET `isHallOfFame` = ? WHERE `id` = ?', [isHallOfFame ? 1 : 0, req.params.id]);
    await cacheInvalidatePattern('products:');
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update hall of fame' });
  }
});

router.get('/hall-of-fame', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM products WHERE isHallOfFame = 1');
    const products = rows.map(row => ({
      ...row,
      details: (() => { try { const d = JSON.parse(row.details); return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : []; } catch { return []; } })(),
      tags: row.tags ? JSON.parse(row.tags) : [],
      sizes: row.sizes ? JSON.parse(row.sizes) : [],
      colors: row.colors ? JSON.parse(row.colors) : [],
      colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
      images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
      priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
      customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
    }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch hall of fame products' });
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);

  try {
    const searchTerm = `%${query}%`;
    const rows = await db.all(
      `SELECT * FROM products 
       WHERE name LIKE ? OR category LIKE ? OR brand LIKE ? OR tags LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    
    const products = rows.map(row => ({
      ...row,
      details: (() => { try { const d = JSON.parse(row.details); return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : []; } catch { return []; } })(),
      tags: row.tags ? JSON.parse(row.tags) : [],
      sizes: row.sizes ? JSON.parse(row.sizes) : [],
      colors: row.colors ? JSON.parse(row.colors) : [],
      colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
      images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
      priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
      customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : []
    }));
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ status: 'error', message: 'Failed to search products' });
  }
});

// GET /api/products/:id (Full product details endpoint)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `products:item:${id.toLowerCase()}`;

  try {
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const row = await db.get(
      'SELECT * FROM products WHERE id = ? OR LOWER(slug) = LOWER(?)',
      [id, id]
    );

    if (!row) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const product = {
      ...row,
      categoryId: row.categoryId || null,
      details: (() => { try { const d = JSON.parse(row.details); return Array.isArray(d) ? d.map(x => typeof x === "object" && x !== null ? (x.key && x.value ? `${x.key}: ${x.value}` : (x.value || x.key || JSON.stringify(x))) : String(x)) : []; } catch { return []; } })(),
      tags: row.tags ? JSON.parse(row.tags) : [],
      sizes: row.sizes ? JSON.parse(row.sizes) : [],
      colors: row.colors ? JSON.parse(row.colors) : [],
      colorVariants: row.colorVariants ? JSON.parse(row.colorVariants) : [],
      images: row.images ? JSON.parse(row.images) : [row.image].filter(Boolean),
      priceRange: row.priceRange ? JSON.parse(row.priceRange) : null,
      customizationFields: row.customizationFields ? JSON.parse(row.customizationFields) : [],
      slug: row.slug || generateSlug(row.name)
    };

    await cacheSet(cacheKey, product, 300);
    res.setHeader('X-Cache', 'MISS');
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch product' });
  }
});

router.get('/:id/reviews', optionalAuth, async (req: AuthRequest, res: any) => {
  const productId = req.params.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;
  const sort = (req.query.sort as string) || 'newest';
  const ratingFilter = req.query.rating as string;
  const currentUserId = req.user?.id;

  try {
    // 1. Calculate overall rating summary across ALL reviews for this product
    const allProductReviews = await db.all(
      'SELECT id, rating, userId FROM reviews WHERE productId = ?',
      [productId]
    );

    const totalCount = allProductReviews.length;
    const distribution: Record<number, { count: number; percentage: number }> = {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    };

    let sumRatings = 0;
    for (const r of allProductReviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      if (distribution[star]) {
        distribution[star].count++;
      }
      sumRatings += Number(r.rating) || 5;
    }

    if (totalCount > 0) {
      for (let star = 1; star <= 5; star++) {
        distribution[star].percentage = Math.round((distribution[star].count / totalCount) * 100);
      }
    }

    const averageRating = totalCount > 0 ? Number((sumRatings / totalCount).toFixed(1)) : 5.0;

    const ratingSummary = {
      averageRating,
      totalCount,
      distribution
    };

    // 2. Check if current user has already reviewed and can review
    let userHasReviewed = false;
    let canReview = false;

    if (currentUserId) {
      userHasReviewed = allProductReviews.some(r => r.userId === currentUserId);

      // Check if user has a DELIVERED order containing this product
      if (req.user?.role === 'ADMIN') {
        canReview = true;
      } else {
        const deliveredOrder = await db.get(
          "SELECT id FROM orders WHERE userId = ? AND (status = 'DELIVERED' OR status = 'delivered' OR status = 'COMPLETED' OR status = 'PAID') AND items LIKE ?",
          [currentUserId, `%${productId}%`]
        );
        if (deliveredOrder) {
          canReview = true;
        }
      }
    }

    // 3. Build query for filtered reviews
    let query = `
      SELECT r.*, u.profile_picture as userAvatar, u.handle as uHandle, u.email as uEmail
      FROM reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.productId = ?
    `;
    const queryParams: any[] = [productId];

    if (ratingFilter && ratingFilter !== 'all' && ['1', '2', '3', '4', '5'].includes(ratingFilter)) {
      query += ' AND r.rating = ?';
      queryParams.push(parseInt(ratingFilter));
    }

    // Count total filtered
    const countSql = query.replace('SELECT r.*, u.profile_picture as userAvatar, u.handle as uHandle, u.email as uEmail', 'SELECT COUNT(*) as count');
    const filteredCountResult = await db.get(countSql, queryParams);
    const totalFiltered = filteredCountResult ? filteredCountResult.count : 0;

    // Sorting
    if (sort === 'helpful') {
      query += ' ORDER BY r.helpfulCount DESC, r.createdAt DESC';
    } else if (sort === 'highest') {
      query += ' ORDER BY r.rating DESC, r.createdAt DESC';
    } else if (sort === 'lowest') {
      query += ' ORDER BY r.rating ASC, r.createdAt DESC';
    } else {
      query += ' ORDER BY r.createdAt DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const rows = await db.all(query, queryParams);

    // 4. Attach images and userVoted flag
    const reviewsWithDetails = await Promise.all(
      rows.map(async (row: any) => {
        let parsedImages: string[] = [];
        try {
          if (row.images) {
            parsedImages = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
          }
        } catch (e) {
          parsedImages = [];
        }

        // Also check review_images table
        const extraImages = await db.all('SELECT url, thumbnailUrl FROM review_images WHERE reviewId = ?', [row.id]);
        if (extraImages && extraImages.length > 0) {
          const urls = extraImages.map((img: any) => img.url).filter(Boolean);
          parsedImages = Array.from(new Set([...parsedImages, ...urls]));
        }

        let userVoted = false;
        if (currentUserId) {
          const vote = await db.get(
            'SELECT 1 FROM review_helpful_votes WHERE reviewId = ? AND userId = ?',
            [row.id, currentUserId]
          );
          userVoted = !!vote;
        }

        return {
          id: row.id,
          productId: row.productId,
          userId: row.userId,
          userHandle: row.userHandle || row.uHandle || 'Archiver',
          userName: row.userName || row.uHandle || 'Anonymous Archiver',
          userAvatar: row.userAvatar || null,
          rating: Number(row.rating) || 5,
          title: row.title || '',
          body: row.body || row.comment || '',
          comment: row.body || row.comment || '',
          images: parsedImages,
          verifiedPurchase: Boolean(row.verifiedPurchase ?? 1),
          createdAt: row.createdAt || row.timestamp || new Date().toISOString(),
          timestamp: row.createdAt || row.timestamp || new Date().toISOString(),
          helpfulCount: Number(row.helpfulCount) || 0,
          userVoted
        };
      })
    );

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    res.json({
      status: 'success',
      reviews: reviewsWithDetails,
      ratingSummary,
      pagination: {
        page,
        limit,
        totalPages,
        totalReviews: totalFiltered,
      },
      userHasReviewed,
      canReview
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch product reviews' });
  }
});

router.post('/:id/reviews', authenticate, async (req: AuthRequest, res: any) => {
  const { rating, title, body: reviewBody, comment, images } = req.body;
  const productId = req.params.id;
  const userId = req.user?.id;
  const content = reviewBody || comment || '';
  const reviewTitle = title || '';
  const numRating = parseInt(rating);

  if (!userId) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
  }

  if (!content.trim()) {
    return res.status(400).json({ status: 'error', message: 'Review content cannot be empty' });
  }

  try {
    // 1. Verify that the user has a DELIVERED order for this product (or is ADMIN)
    if (req.user?.role !== 'ADMIN') {
      const deliveredOrder = await db.get(
        "SELECT id FROM orders WHERE userId = ? AND (status = 'DELIVERED' OR status = 'delivered' OR status = 'COMPLETED' OR status = 'PAID') AND items LIKE ?",
        [userId, `%${productId}%`]
      );

      if (!deliveredOrder) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'Only verified buyers can review. Buy this product to leave a review.' 
        });
      }
    }

    // 2. Prevent duplicate reviews (one review per user per product)
    const existingReview = await db.get(
      'SELECT id FROM reviews WHERE productId = ? AND userId = ?',
      [productId, userId]
    );

    if (existingReview) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'You have already submitted a review for this product.' 
      });
    }

    // Fetch user handle
    const userObj = await db.get('SELECT handle, profile_picture FROM users WHERE id = ?', [userId]);
    const userHandle = userObj?.handle || req.user?.email?.split('@')[0] || 'Archiver';
    const userAvatar = userObj?.profile_picture || null;

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const imagesArray = Array.isArray(images) ? images.filter(Boolean) : [];
    const imagesJson = JSON.stringify(imagesArray);

    // Insert into reviews table
    await db.run(
      `INSERT INTO reviews (id, productId, userId, userHandle, userName, userAvatar, rating, title, body, comment, images, verifiedPurchase, createdAt, timestamp, helpfulCount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, productId, userId, userHandle, userHandle, userAvatar, numRating, reviewTitle, content, content, imagesJson, 1, nowIso, nowIso, 0]
    );

    // Insert into review_images table
    for (const imgUrl of imagesArray) {
      const imgId = `rimg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.run(
        'INSERT INTO review_images (id, reviewId, url, thumbnailUrl) VALUES (?, ?, ?, ?)',
        [imgId, reviewId, imgUrl, imgUrl]
      );
    }

    // Also sync to legacy product_reviews
    try {
      await db.run(
        'INSERT INTO product_reviews (id, productId, userId, userHandle, rating, comment, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [reviewId, productId, userId, userHandle, numRating, content, nowIso]
      );
    } catch (e) {}

    const createdReview = {
      id: reviewId,
      productId,
      userId,
      userHandle,
      userName: userHandle,
      userAvatar,
      rating: numRating,
      title: reviewTitle,
      body: content,
      comment: content,
      images: imagesArray,
      verifiedPurchase: true,
      createdAt: nowIso,
      timestamp: nowIso,
      helpfulCount: 0,
      userVoted: false
    };

    res.status(201).json({ 
      status: 'success', 
      message: 'Review submitted successfully', 
      review: createdReview 
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add review' });
  }
});

// UGC styling ("How heads style it")
router.get('/:id/styling', async (req, res) => {
  const productId = req.params.id;
  try {
    let posts = await db.all(
      'SELECT * FROM product_styling WHERE productId = ? ORDER BY createdAt DESC',
      [productId]
    );

    // If no specific styling posts for this product, fetch general community styling posts
    if (!posts || posts.length === 0) {
      posts = await db.all(
        'SELECT * FROM product_styling ORDER BY createdAt DESC LIMIT 10'
      );
    }

    res.json({
      status: 'success',
      posts: posts || []
    });
  } catch (error) {
    console.error('Error fetching styling UGC posts:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch styling posts' });
  }
});

router.post('/:id/styling', optionalAuth, async (req: AuthRequest, res: any) => {
  const productId = req.params.id;
  const { username, photoUrl, instagramUrl, caption } = req.body;

  if (!photoUrl) {
    return res.status(400).json({ status: 'error', message: 'Photo URL is required' });
  }

  const userHandle = username || req.user?.handle || (req.user?.email ? `@${req.user.email.split('@')[0]}` : '@closetkraze.stylist');
  const ugcId = `ugc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  try {
    await db.run(
      'INSERT INTO product_styling (id, productId, username, photoUrl, instagramUrl, caption, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ugcId, productId, userHandle.startsWith('@') ? userHandle : `@${userHandle}`, photoUrl, instagramUrl || 'https://instagram.com/closetkraze', caption || 'Street archive fit check', nowIso]
    );

    res.status(201).json({
      status: 'success',
      post: {
        id: ugcId,
        productId,
        username: userHandle.startsWith('@') ? userHandle : `@${userHandle}`,
        photoUrl,
        instagramUrl: instagramUrl || 'https://instagram.com/closetkraze',
        caption: caption || 'Street archive fit check',
        createdAt: nowIso
      }
    });
  } catch (error) {
    console.error('Error adding styling UGC post:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add styling post' });
  }
});

export default router;
