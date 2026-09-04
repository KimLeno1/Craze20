import { Router } from 'express';
import { db } from '../server.js';
import crypto from 'crypto';
import { authenticateAdmin, authorize } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../lib/cache.js';

const router = Router();

const generateSlug = (name: string): string => {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

router.get('/', async (req, res) => {
  const cacheKey = 'categories:all';
  try {
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const categories = await db.all('SELECT * FROM categories');
    await cacheSet(cacheKey, categories, 300); // 5 min TTL
    res.setHeader('X-Cache', 'MISS');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

router.get('/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const cacheKey = `categories:${identifier.toLowerCase()}`;
  try {
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const category = await db.get(
      'SELECT * FROM categories WHERE id = ? OR LOWER(slug) = LOWER(?) OR LOWER(name) = LOWER(?)',
      [identifier, identifier, identifier]
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await cacheSet(cacheKey, category, 300);
    res.setHeader('X-Cache', 'MISS');
    res.json(category);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch category' });
  }
});

router.post('/', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
  const { name, slug, heroImage, inspiration } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }
  const finalSlug = slug && typeof slug === 'string' && slug.trim() ? generateSlug(slug) : generateSlug(name);
  try {
    const id = crypto.randomUUID();
    await db.run(
      'INSERT INTO categories (id, name, slug, heroImage, inspiration) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), finalSlug, heroImage || null, inspiration || null]
    );

    // Invalidate caches on mutation
    await cacheInvalidatePattern('categories:');
    await cacheInvalidatePattern('products:');

    res.status(201).json({ success: true, category: { id, name: name.trim(), slug: finalSlug, heroImage, inspiration } });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create category' });
  }
});

router.patch('/:id', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { name, slug, heroImage, inspiration } = req.body;
  try {
    const existing = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const finalName = name !== undefined ? name : existing.name;
    const finalSlug = slug !== undefined ? generateSlug(slug) : (name !== undefined ? generateSlug(name) : existing.slug);
    const finalHero = heroImage !== undefined ? heroImage : existing.heroImage;
    const finalInspiration = inspiration !== undefined ? inspiration : existing.inspiration;

    await db.run(
      'UPDATE categories SET name = ?, slug = ?, heroImage = ?, inspiration = ? WHERE id = ?',
      [finalName, finalSlug, finalHero, finalInspiration, id]
    );

    // Invalidate caches on mutation
    await cacheInvalidatePattern('categories:');
    await cacheInvalidatePattern('products:');

    res.json({ success: true, category: { id, name: finalName, slug: finalSlug, heroImage: finalHero, inspiration: finalInspiration } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update category' });
  }
});

router.delete('/:id', authenticateAdmin, authorize(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM categories WHERE id = ?', [id]);

    // Invalidate caches on mutation
    await cacheInvalidatePattern('categories:');
    await cacheInvalidatePattern('products:');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

export default router;
