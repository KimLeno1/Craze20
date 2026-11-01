import { Router } from 'express';
import { db } from '../server.js';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = Router();

// Ensure bundles table exists with required schema
export async function initBundlesTable() {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS bundles (
        id VARCHAR(255) PRIMARY KEY,
        name TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        heroImage TEXT,
        items TEXT, -- JSON array of {productId, quantity}
        bundlePrice DOUBLE NOT NULL,
        originalPrice DOUBLE NOT NULL,
        savings DOUBLE NOT NULL,
        expiresAt TEXT,
        isActive INT DEFAULT 1
      )
    `);

    // Seed 5 Starter Bundles if none exist
    const countRow = await db.get('SELECT COUNT(*) as count FROM bundles');
    if (!countRow || countRow.count === 0) {
      const defaultBundles = [
        {
          id: 'bundle_date_night',
          name: 'The Date Night Drop',
          slug: 'the-date-night-drop',
          description: '1x Graphic Tee, 1x Modular Cargo Pants, 1x Chunky Retro Sneaker. Complete outfit for high-end night out.',
          heroImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
          items: JSON.stringify([
            { productId: 'prod_temu_mens_clothing_2', quantity: 1 },
            { productId: 'prod_temu_mens_clothing_4', quantity: 1 },
            { productId: 'prod_temu_womens_shoes_1', quantity: 1 }
          ]),
          bundlePrice: 450,
          originalPrice: 540,
          savings: 90,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: 1
        },
        {
          id: 'bundle_sneakerhead',
          name: 'Sneakerhead Starter',
          slug: 'sneakerhead-starter',
          description: '1x Heavyweight Fleece Hoodie + 1x High-Top Streetwear Sock Trainers.',
          heroImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
          items: JSON.stringify([
            { productId: 'prod_temu_mens_clothing_3', quantity: 1 },
            { productId: 'prod_temu_womens_shoes_5', quantity: 1 }
          ]),
          bundlePrice: 380,
          originalPrice: 440,
          savings: 60,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: 1
        },
        {
          id: 'bundle_festival',
          name: 'Festival Look',
          slug: 'festival-look',
          description: '1x Windbreaker, 1x Basic Tee, 1x Cargo Joggers.',
          heroImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200',
          items: JSON.stringify([
            { productId: 'prod_temu_mens_clothing_1', quantity: 1 },
            { productId: 'prod_temu_womens_clothing_6', quantity: 1 },
            { productId: 'prod_temu_mens_clothing_6', quantity: 1 }
          ]),
          bundlePrice: 320,
          originalPrice: 400,
          savings: 80,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: 1
        },
        {
          id: 'bundle_couples',
          name: "Couple's Drop",
          slug: 'couples-drop',
          description: '2x Heavyweight Hoodies + 2x Tailored Trousers for you and your partner.',
          heroImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1200',
          items: JSON.stringify([
            { productId: 'prod_temu_mens_clothing_3', quantity: 2 },
            { productId: 'prod_temu_womens_clothing_2', quantity: 2 }
          ]),
          bundlePrice: 850,
          originalPrice: 1020,
          savings: 170,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: 1
        },
        {
          id: 'bundle_full_kraze',
          name: 'The Full Kraze',
          slug: 'the-full-kraze',
          description: 'Ultimate Vault Kit: 1x Hoodie, 1x Cargo Pants, 1x Retro Sneakers, 1x Shacket, 1x Basic Tee.',
          heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
          items: JSON.stringify([
            { productId: 'prod_temu_mens_clothing_3', quantity: 1 },
            { productId: 'prod_temu_mens_clothing_4', quantity: 1 },
            { productId: 'prod_temu_womens_shoes_1', quantity: 1 },
            { productId: 'prod_temu_womens_clothing_4', quantity: 1 },
            { productId: 'prod_temu_womens_clothing_6', quantity: 1 }
          ]),
          bundlePrice: 720,
          originalPrice: 880,
          savings: 160,
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: 1
        }
      ];

      for (const b of defaultBundles) {
        await db.run(
          `INSERT OR REPLACE INTO bundles (id, name, slug, description, heroImage, items, bundlePrice, originalPrice, savings, expiresAt, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.id, b.name, b.slug, b.description, b.heroImage, b.items, b.bundlePrice, b.originalPrice, b.savings, b.expiresAt, b.isActive]
        );
      }
      console.log('✅ Seeded 5 starter bundles successfully.');
    }
  } catch (err) {
    console.error('Error initializing bundles table:', err);
  }
}

// GET /api/bundles - list active bundles
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM bundles WHERE isActive = 1');
    const bundles = [];

    for (const row of rows) {
      let rawItems: any[] = [];
      try {
        rawItems = row.items ? (typeof row.items === 'string' ? JSON.parse(row.items) : row.items) : [];
      } catch (e) {
        rawItems = [];
      }

      const populatedProducts: any[] = [];
      for (const item of rawItems) {
        const prodId = item.productId || item.id;
        if (prodId) {
          const prod = await db.get('SELECT * FROM products WHERE id = ?', [prodId]);
          if (prod) {
            let parsedImages = [prod.image];
            if (prod.images) {
              try {
                parsedImages = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
              } catch (e) {
                parsedImages = [prod.image];
              }
            }
            let parsedSizes = [];
            if (prod.sizes) {
              try {
                parsedSizes = typeof prod.sizes === 'string' ? JSON.parse(prod.sizes) : prod.sizes;
              } catch (e) {
                parsedSizes = [];
              }
            }

            populatedProducts.push({
              ...prod,
              images: parsedImages,
              sizes: parsedSizes,
              quantityInBundle: item.quantity || 1
            });
          } else if (item.name) {
            // Item already has product attributes
            populatedProducts.push(item);
          }
        } else if (item.name) {
          populatedProducts.push(item);
        }
      }

      bundles.push({
        ...row,
        items: rawItems,
        products: populatedProducts
      });
    }

    res.json(bundles);
  } catch (error) {
    console.error('Error fetching bundles:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch bundles' });
  }
});

// GET /api/bundles/:slug - bundle detail with item products populated
router.get('/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let bundle = await db.get('SELECT * FROM bundles WHERE slug = ? OR id = ?', [slugOrId, slugOrId]);
    if (!bundle) {
      return res.status(404).json({ status: 'error', message: 'Bundle not found' });
    }

    const items = bundle.items ? JSON.parse(bundle.items) : [];
    const populatedProducts = [];

    for (const item of items) {
      const prod = await db.get('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (prod) {
        populatedProducts.push({
          ...prod,
          images: prod.images ? JSON.parse(prod.images) : [prod.image],
          quantityInBundle: item.quantity
        });
      }
    }

    res.json({
      ...bundle,
      items,
      products: populatedProducts
    });
  } catch (error) {
    console.error('Error fetching bundle detail:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch bundle detail' });
  }
});

// POST /api/bundles/:slug/checkout - atomic checkout for bundle purchase
router.post('/:slugOrId/checkout', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const { customerName, customerEmail, phone, address, city, region, quantity = 1, friendGroupDiscount = false } = req.body;

    const bundle = await db.get('SELECT * FROM bundles WHERE slug = ? OR id = ?', [slugOrId, slugOrId]);
    if (!bundle) {
      return res.status(404).json({ status: 'error', message: 'Bundle not found' });
    }

    const items = bundle.items ? JSON.parse(bundle.items) : [];
    let finalPrice = bundle.bundlePrice * quantity;
    if (friendGroupDiscount || quantity >= 3) {
      finalPrice = finalPrice * 0.9; // 10% off friend group pricing
    }

    // Check stock for all bundle items
    for (const item of items) {
      const requiredQty = item.quantity * quantity;
      const prod = await db.get('SELECT id, name, stock FROM products WHERE id = ?', [item.productId]);
      if (!prod) {
        return res.status(400).json({ status: 'error', message: `Product item not found in vault.` });
      }
      if (prod.stock !== undefined && prod.stock !== null && prod.stock < requiredQty) {
        return res.status(400).json({ status: 'error', message: `Insufficient stock for item "${prod.name}".` });
      }
    }

    // Atomic deduction and order creation
    const orderId = 'ord_' + crypto.randomUUID();
    const timestamp = new Date().toISOString();

    for (const item of items) {
      const requiredQty = item.quantity * quantity;
      await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [requiredQty, item.productId]);
    }

    // Create order record
    const orderItemsJson = JSON.stringify(items.map((i: any) => ({ id: i.productId, quantity: i.quantity * quantity, isBundleItem: true, bundleId: bundle.id })));
    await db.run(
      `INSERT INTO orders (id, customerName, customerEmail, phone, address, city, region, items, total, status, paymentMethod, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, customerName || 'Valued Collector', customerEmail || 'buyer@closetkraze.top', phone || '', address || '', city || 'Kumasi', region || 'Ashanti', orderItemsJson, finalPrice, 'PENDING', 'Bundle Checkout', timestamp]
    );

    res.json({
      status: 'success',
      message: 'Bundle order placed successfully',
      orderId,
      total: finalPrice,
      savings: bundle.savings * quantity
    });
  } catch (error) {
    console.error('Error in bundle checkout:', error);
    res.status(500).json({ status: 'error', message: 'Bundle checkout failed' });
  }
});

// Admin POST /api/bundles
router.post('/', async (req, res) => {
  const { id, name, slug, description, heroImage, items, bundlePrice, originalPrice, savings, expiresAt, isActive } = req.body;
  try {
    const bId = id || 'bundle_' + crypto.randomUUID();
    const bSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await db.run(
      `REPLACE INTO bundles (id, name, slug, description, heroImage, items, bundlePrice, originalPrice, savings, expiresAt, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bId, name, bSlug, description, heroImage, JSON.stringify(items), bundlePrice, originalPrice, savings, expiresAt, isActive ?? 1]
    );
    res.json({ status: 'success', bundleId: bId });
  } catch (error) {
    console.error('Error saving bundle:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save bundle' });
  }
});

// Admin DELETE /api/bundles/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM bundles WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete bundle' });
  }
});

export default router;
