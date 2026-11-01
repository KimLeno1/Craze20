import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import productsRouter from './api/products.js';
import suppliersRouter from './api/suppliers.js';
import supplyOrdersRouter from './api/supply_orders.js';
import usersRouter from './api/users.js';
import adminsRouter from './api/admins.js';
import ordersRouter from './api/orders.js';
import authRouter from './api/auth.js';
import socialRouter from './api/social.js';
import userStatsRouter from './api/user_stats.js';
import miscRouter from './api/misc.js';
import userRouter from './api/user.js';
import uploadRouter from './api/upload.js';
import tagsRouter from './api/tags.js';
import categoriesRouter from './api/categories.js';
import aiRouter from './api/ai.js';
import reviewsRouter from './api/reviews.js';
import referralsRouter, { generateReferralCode } from './api/referrals.js';
import { initReferralLedgerTable } from './api/referralBlockchain.js';
import bundlesRouter, { initBundlesTable } from './api/bundles.js';

const __filename_resolved = typeof __filename !== 'undefined' ? __filename : '';
const __dirname_resolved = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filename_resolved);

// Robustly load .env from multiple possible directory paths (cwd, current module dir, parents) to cover all start methods
dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(__dirname_resolved, '.env') });
  dotenv.config({ path: path.resolve(__dirname_resolved, '../.env') });
  dotenv.config({ path: path.resolve(__dirname_resolved, '../../.env') });
} catch (e) {
  console.error('Error loading .env paths:', e);
}

// Override console.error to log to a file
const originalConsoleError = console.error;
console.error = function (...args) {
  const logArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return arg;
  });
  try {
    fs.appendFileSync('server-errors.log', new Date().toISOString() + ' ' + logArgs.join(' ') + '\n');
  } catch (e) {
    // Fallback to original console error if file is not writable
  }
  originalConsoleError.apply(console, args);
};

// SQLite Connection Wrapper
export const db: any = {};

async function initializeDatabase() {
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  
  let sqliteDb: any;
  try {
    sqliteDb = new Database(dbPath);
    // Ultra-fast Write-Ahead Logging mode for non-blocking concurrent reads & writes
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('cache_size = -64000'); // 64MB RAM page cache
    sqliteDb.pragma('temp_store = MEMORY'); // Keep temporary tables and sorts in RAM
    sqliteDb.pragma('mmap_size = 268435456'); // 256MB zero-copy memory mapped I/O
    sqliteDb.pragma('busy_timeout = 5000'); // Prevent SQLITE_BUSY under load
    sqliteDb.pragma('auto_vacuum = INCREMENTAL');
    sqliteDb.pragma('optimize');
    console.log('Database performance pragmas configured successfully (WAL mode enabled)');
  } catch (error: any) {
    if (error && (error.code === 'SQLITE_CORRUPT' || String(error).includes('corrupt') || String(error).includes('CORRUPT'))) {
      console.warn("SQLite database is corrupted. Deleting and recreating...", error);
      try {
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
        }
      } catch (e) {
        console.error("Failed to delete corrupt database.sqlite file:", e);
      }
      sqliteDb = new Database(dbPath);
      sqliteDb.pragma('journal_mode = WAL');
      sqliteDb.pragma('synchronous = NORMAL');
      sqliteDb.pragma('cache_size = -64000');
      sqliteDb.pragma('temp_store = MEMORY');
      sqliteDb.pragma('mmap_size = 268435456');
      sqliteDb.pragma('busy_timeout = 5000');
    } else {
      throw error;
    }
  }
  
  const sanitizeParams = (params: any[]) => {
    return params.map(val => {
      if (val === null || val === undefined) return null;
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        try {
          return JSON.stringify(val);
        } catch (e) {
          return String(val);
        }
      }
      return val;
    });
  };

  Object.assign(db, {
    all: async (sql: string, params: any[] = []) => {
      return sqliteDb.prepare(sql).all(...sanitizeParams(params));
    },
    get: async (sql: string, params: any[] = []) => {
      return sqliteDb.prepare(sql).get(...sanitizeParams(params));
    },
    run: async (sql: string, params: any[] = []) => {
      const info = sqliteDb.prepare(sql).run(...sanitizeParams(params));
      return { lastID: info.lastInsertRowid, changes: info.changes };
    },
    exec: async (sql: string) => {
      sqliteDb.exec(sql);
    },
    prepare: (sql: string) => sqliteDb.prepare(sql),
    pragma: (sql: string) => sqliteDb.pragma(sql)
  });

  try {
    const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');
    const queries = schema.split(';').filter(q => q.trim() !== '');
    for (const query of queries) {
      await db.exec(query);
    }
    
    try {
      await db.exec("CREATE TABLE IF NOT EXISTS refresh_tokens (id VARCHAR(255) PRIMARY KEY, userId VARCHAR(255) NOT NULL, token TEXT NOT NULL UNIQUE, expiresAt INT NOT NULL, role TEXT, userAgent TEXT, ip TEXT)");
      console.log("Created refresh_tokens table");
    } catch (e) {
      console.error("Error creating refresh_tokens table:", e);
    }

    try {
      await db.exec("ALTER TABLE users ADD COLUMN gender TEXT");
      console.log("Added gender to users table");
    } catch (e) {
      // Ignored if column already exists
    }
    
    try {
      await db.exec("ALTER TABLE user_stats ADD COLUMN storeCredit DOUBLE DEFAULT 0");
      console.log("Added storeCredit to user_stats");
    } catch (e) {
      // Ignored if column already exists
    }

    try {
      await db.exec("ALTER TABLE user_stats ADD COLUMN neuralStylistUsedToday INT DEFAULT 0");
      console.log("Added neuralStylistUsedToday to user_stats");
    } catch (e) {
      // Ignored if column already exists
    }

    try {
      await db.exec("ALTER TABLE user_preferences ADD COLUMN styleProtocolCompleted INT DEFAULT 0");
      await db.exec("ALTER TABLE user_preferences ADD COLUMN checkoutProtocolCompleted INT DEFAULT 0");
      await db.exec("ALTER TABLE user_preferences ADD COLUMN tutorialFinished INT DEFAULT 0");
    } catch (e) {
      // Ignored if columns already exist
    }

    try {
      await db.exec("ALTER TABLE suppliers ADD COLUMN plain_password TEXT");
      console.log("Added plain_password to suppliers table");
    } catch (e) {
      // Ignored if column already exists
    }

    try {
      await db.exec("ALTER TABLE products ADD COLUMN video TEXT");
      console.log("Added video to products table");
    } catch (e) {
      // Ignored if column already exists
    }

    try {
      await db.exec("ALTER TABLE products ADD COLUMN slug TEXT");
      console.log("Added slug to products table");
    } catch (e) {
      // Ignored if column already exists
    }

    try {
      const prodsWithoutSlug = await db.all("SELECT id, name FROM products WHERE slug IS NULL OR slug = ''");
      for (const p of prodsWithoutSlug) {
        const slug = (p.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await db.run("UPDATE products SET slug = ? WHERE id = ?", [slug, p.id]);
      }
    } catch (e) {
      // Ignored if backfill fails
    }

    try {
      await db.exec("CREATE TABLE IF NOT EXISTS tags (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE)");
      const defaultTags = [
        'LIMITED', 'EXCLUSIVE', 'RECON',
        'Street', 'Old Money', 'Simple', 'Cyber', 'Avant-Garde', 'Minimalist', 'Vintage', 'Gorpcore', 'Y2K', 'Preppy', 'Grunge', 'Boho'
      ];
      for (const tagName of defaultTags) {
        await db.run("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)", [crypto.randomUUID(), tagName]);
      }
    } catch (e) {
      console.error("Error initializing tags:", e);
    }

    try {
      await db.exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, slug VARCHAR(255) UNIQUE, heroImage TEXT, inspiration TEXT)");
      try {
        await db.exec("ALTER TABLE categories ADD COLUMN slug VARCHAR(255)");
      } catch (e) {}

      const standardCategories = [
        { id: '4f507bf0-3967-4e2d-960a-af898a4c2413', name: 'Apparel', slug: 'apparel', heroImage: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_CLOTHING_CORE' },
        { id: 'c36db0b9-101e-412c-b16d-f5d6166a909c', name: 'Footwear', slug: 'footwear', heroImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_FOOTWEAR_CORE' },
        { id: '3ded13c8-a7bc-4506-abcc-62262eacb0c3', name: 'Accessories', slug: 'accessories', heroImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_ACCESSORY_CORE' },
        { id: 'd2437a26-d747-4c48-85b8-bfa250d44032', name: 'Kits', slug: 'kits', heroImage: 'https://images.unsplash.com/photo-1549463591-147604343e39?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_KIT_CORE' },
        { id: 'e10a21bc-1234-4b5d-9b95-1d0206e5b111', name: 'Fragments', slug: 'fragments', heroImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_FRAGMENTS_CORE' },
        { id: 'f21b32cd-2345-4c6e-ac06-2e1317f6c222', name: 'Home', slug: 'home', heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_HOME_CORE' },
        { id: 'bd0a32eb-0764-4b5d-9b95-1d0206e5b479', name: 'Beauty', slug: 'beauty', heroImage: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_BEAUTY_CORE' },
        { id: 'a32c43de-3456-4d7f-bd17-3f2428a7d333', name: 'Shorts', slug: 'shorts', heroImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_SHORTS_CORE' },
        { id: 'b43d54ef-4567-4e80-ce28-403539b8e444', name: 'Trousers', slug: 'trousers', heroImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1200', inspiration: 'ARCHIVE_TROUSERS_CORE' },
      ];

      for (const cat of standardCategories) {
        const existing = await db.get("SELECT id FROM categories WHERE name = ? OR slug = ?", [cat.name, cat.slug]);
        if (existing) {
          await db.run("UPDATE categories SET slug = ?, heroImage = COALESCE(heroImage, ?), inspiration = COALESCE(inspiration, ?) WHERE id = ?", [cat.slug, cat.heroImage, cat.inspiration, existing.id]);
        } else {
          await db.run("INSERT INTO categories (id, name, slug, heroImage, inspiration) VALUES (?, ?, ?, ?, ?)", [cat.id, cat.name, cat.slug, cat.heroImage, cat.inspiration]);
        }
      }
      await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)");
      console.log("Categories verified and synchronized");
    } catch (e) {
      console.error("Error initializing categories:", e);
    }

    try {
      await db.exec("CREATE TABLE IF NOT EXISTS paystack_transactions (id VARCHAR(255) PRIMARY KEY, email TEXT, amount DOUBLE, reference TEXT UNIQUE, status TEXT, metadata TEXT, timestamp TEXT, subaccount TEXT)");
      console.log("Created paystack_transactions table");
      
      // Migration for adding subaccount to existing
      try {
        await db.exec("ALTER TABLE paystack_transactions ADD COLUMN subaccount TEXT");
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error("Error adding subaccount column to paystack_transactions:", e);
        }
      }
    } catch (e) {
      console.error("Error creating paystack_transactions table:", e);
    }

    try {
      await db.exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (id VARCHAR(255) PRIMARY KEY, userId VARCHAR(255) NOT NULL, token TEXT NOT NULL UNIQUE, expiresAt INT NOT NULL, used INT DEFAULT 0)");
      console.log("Created password_reset_tokens table");
    } catch (e) {
      console.error("Error creating password_reset_tokens table:", e);
    }

    try {
      await db.exec(`CREATE TABLE IF NOT EXISTS custom_requests (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255),
        userHandle VARCHAR(255),
        email VARCHAR(255),
        itemName VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        budget DOUBLE,
        description TEXT,
        referenceImage TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        timestamp TEXT,
        adminNotes TEXT
      )`);
      console.log("Created custom_requests table");
    } catch (e) {
      console.error("Error creating custom_requests table:", e);
    }

    try {
      await db.exec("CREATE TABLE IF NOT EXISTS outfits (id VARCHAR(255) PRIMARY KEY, userId VARCHAR(255), name TEXT, items TEXT, timestamp TEXT)");
      console.log("Created outfits table");
    } catch (e) {
      console.error("Error creating outfits table:", e);
    }

    try {
      await db.exec(`CREATE TABLE IF NOT EXISTS group_messages (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255),
        userHandle VARCHAR(255),
        text TEXT,
        imageUrl TEXT,
        timestamp TEXT,
        reports INT DEFAULT 0
      )`);
      try {
        await db.exec('ALTER TABLE group_messages ADD COLUMN imageUrl TEXT');
      } catch (e) {
        // column already exists
      }
      console.log("Created/verified group_messages table");
    } catch (e) {
      console.error("Error creating group_messages table:", e);
    }

    try {
      await db.exec("CREATE TABLE IF NOT EXISTS referrals (id VARCHAR(255) PRIMARY KEY, referrerId VARCHAR(255) NOT NULL, refereeId VARCHAR(255), referredId VARCHAR(255), code VARCHAR(255), status VARCHAR(255) DEFAULT 'pending', refereeOrderId VARCHAR(255), rewardAmount DOUBLE DEFAULT 20, createdAt TEXT, completedAt TEXT)");
      console.log("Created/verified referrals table");
      await initReferralLedgerTable(db);
    } catch (e) {
      console.error("Error creating referrals table or ledger:", e);
    }

    const userRefColumns = [
      "referralCode TEXT",
      "referredBy TEXT",
      "storeCredit DOUBLE DEFAULT 0",
      "createdAt TEXT"
    ];
    for (const col of userRefColumns) {
      try {
        await db.exec(`ALTER TABLE users ADD COLUMN ${col}`);
      } catch (e: any) {
        // ignore duplicate column errors
      }
    }

    const refExtraColumns = [
      "refereeId VARCHAR(255)",
      "refereeOrderId VARCHAR(255)",
      "completedAt TEXT"
    ];
    for (const col of refExtraColumns) {
      try {
        await db.exec(`ALTER TABLE referrals ADD COLUMN ${col}`);
      } catch (e: any) {
        // ignore duplicate column
      }
    }

    // Backfill missing referral codes for existing users
    try {
      const usersWithoutCode = await db.all("SELECT id, handle, email FROM users WHERE referralCode IS NULL OR referralCode = ''");
      for (const u of usersWithoutCode) {
        const code = generateReferralCode(u.handle || u.email);
        await db.run("UPDATE users SET referralCode = ? WHERE id = ?", [code, u.id]);
      }
    } catch (e) {
      console.error("Error backfilling user referral codes:", e);
    }

    try {
      await db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
      console.log("Added role column to users table");
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error("Error adding role column:", e);
      }
    }

    try {
      await db.exec("ALTER TABLE users ADD COLUMN logistics TEXT");
      console.log("Added logistics column to users table");
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error("Error adding logistics column:", e);
      }
    }

    try {
      await db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
      console.log("Added phone column to users table");
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error("Error adding phone column to users:", e);
      }
    }

    // Products table migrations
    const productColumns = [
      "categoryId VARCHAR(255)",
      "deliveryTime TEXT",
      "isCustom INT DEFAULT 0",
      "priceRange TEXT",
      "customizationFields TEXT",
      "images TEXT",
      "colors TEXT",
      "colorVariants TEXT",
      "createdAt TEXT",
      "offeredDiscount DOUBLE DEFAULT 0"
    ];
    for (const col of productColumns) {
      try {
        await db.exec(`ALTER TABLE products ADD COLUMN ${col}`);
        console.log(`Added ${col.split(' ')[0]} column to products table`);
      } catch (e: any) {
        if (e.message.includes('duplicate column name')) {
          console.log(`Column ${col.split(' ')[0]} already exists in products table`);
        } else {
          console.error(`Error adding ${col.split(' ')[0]} to products:`, e.message);
        }
      }
    }

    try {
      await db.exec("CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId)");
    } catch (e) {}

    // Check if products need seeding from products_migration.sql
    try {
      const prodCountRow = await db.get("SELECT COUNT(*) as count FROM products");
      if (!prodCountRow || prodCountRow.count === 0) {
        console.log("Seeding products table from products_migration.sql...");
        const migrationPath = path.join(process.cwd(), 'products_migration.sql');
        if (fs.existsSync(migrationPath)) {
          const migrationSql = fs.readFileSync(migrationPath, 'utf8');
          const statements = migrationSql.split(';').map(s => s.trim()).filter(Boolean);
          for (const stmt of statements) {
            try {
              await db.exec(stmt);
            } catch (err: any) {
              console.error("Error executing product migration statement:", err.message);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error checking/seeding products:", e);
    }

    // Backfill products.categoryId by joining with categories table
    try {
      await db.exec(`
        UPDATE products
        SET categoryId = (
          SELECT c.id 
          FROM categories c 
          WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(products.category))
             OR LOWER(TRIM(c.slug)) = LOWER(TRIM(products.category))
             OR (LOWER(TRIM(products.category)) LIKE '%apparel%' AND c.slug = 'apparel')
             OR (LOWER(TRIM(products.category)) LIKE '%clothing%' AND c.slug = 'apparel')
             OR (LOWER(TRIM(products.category)) LIKE '%hoodie%' AND c.slug = 'apparel')
             OR (LOWER(TRIM(products.category)) LIKE '%jacket%' AND c.slug = 'apparel')
             OR (LOWER(TRIM(products.category)) LIKE '%tee%' AND c.slug = 'apparel')
             OR (LOWER(TRIM(products.category)) LIKE '%sweater%' AND c.slug = 'apparel')
             OR (LOWER(TRIM(products.category)) LIKE '%lingerie%' AND c.slug = 'apparel')
             OR (LOWER(TRIM(products.category)) LIKE '%shoe%' AND c.slug = 'footwear')
             OR (LOWER(TRIM(products.category)) LIKE '%sneaker%' AND c.slug = 'footwear')
             OR (LOWER(TRIM(products.category)) LIKE '%boot%' AND c.slug = 'footwear')
             OR (LOWER(TRIM(products.category)) LIKE '%sandal%' AND c.slug = 'footwear')
             OR (LOWER(TRIM(products.category)) LIKE '%footwear%' AND c.slug = 'footwear')
             OR (LOWER(TRIM(products.category)) LIKE '%accessory%' AND c.slug = 'accessories')
             OR (LOWER(TRIM(products.category)) LIKE '%choker%' AND c.slug = 'accessories')
             OR (LOWER(TRIM(products.category)) LIKE '%beauty%' AND c.slug = 'beauty')
             OR (LOWER(TRIM(products.category)) LIKE '%fragrance%' AND c.slug = 'beauty')
             OR (LOWER(TRIM(products.category)) LIKE '%kit%' AND c.slug = 'kits')
             OR (LOWER(TRIM(products.category)) LIKE '%bundle%' AND c.slug = 'kits')
             OR (LOWER(TRIM(products.category)) LIKE '%fragment%' AND c.slug = 'fragments')
             OR (LOWER(TRIM(products.category)) LIKE '%home%' AND c.slug = 'home')
             OR (LOWER(TRIM(products.category)) LIKE '%short%' AND c.slug = 'shorts')
             OR (LOWER(TRIM(products.category)) LIKE '%trouser%' AND c.slug = 'trousers')
             OR (LOWER(TRIM(products.category)) LIKE '%pant%' AND c.slug = 'trousers')
          LIMIT 1
        )
        WHERE (categoryId IS NULL OR categoryId = '') AND category IS NOT NULL AND TRIM(category) != ''
      `);

      // Ensure any test sample product such as "Generic Hoodie (Grey)" exists and is linked to Apparel
      const apparelCat = await db.get("SELECT id FROM categories WHERE slug = 'apparel'");
      if (apparelCat) {
        await db.run(`
          INSERT OR IGNORE INTO products (
            id, name, price, originalPrice, shippingFee, image, category, categoryId, gender, 
            description, details, inStock, isNew, viewers, stockCount, isHallOfFame, 
            synergyPath, appeal, brand, tags, sizes, images, colors, createdAt, offeredDiscount
          ) VALUES (
            'prod_generic_hoodie_grey', 'Generic Hoodie (Grey)', 149, 199, 10,
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
            'Apparel', ?, 'UNISEX',
            'Heavyweight classic grey cotton blend hoodie with front kangaroo pocket and ribbed cuffs.',
            '["100% Combed Heavyweight Cotton","Brushed fleece lining","Pre-shrunk fabric"]',
            1, 0, 42, 18, 0, 'CORE_BASICS', 'Essential Daily Wear', 'KRAZE-CORE',
            '["hoodie","apparel","grey","basics"]', '["S","M","L","XL"]',
            '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800"]',
            '["Grey","Charcoal","Heather"]', '2026-07-08T00:00:00.000Z', 25
          )
        `, [apparelCat.id]);
      }

      console.log("Product categoryId backfill and seed check completed successfully");
    } catch (e) {
      console.error("Error backfilling product categoryId:", e);
    }

    try {
      // Migration: Update PK to (userId, protocolType)
      const tableInfo = await db.all("PRAGMA table_info(protocol_sessions)");
      const isOldSchema = tableInfo.length > 0 && tableInfo.filter((c: any) => c.pk === 1).length === 1 && tableInfo.find((c: any) => c.name === 'userId' && c.pk === 1);
      if (isOldSchema) {
        console.log("Migrating protocol_sessions table to new schema...");
        await db.exec("DROP TABLE protocol_sessions");
      }
      await db.exec("CREATE TABLE IF NOT EXISTS protocol_sessions (userId VARCHAR(255), protocolType TEXT, currentStep INT, sessionData TEXT, lastUpdated INT, PRIMARY KEY (userId, protocolType), FOREIGN KEY (userId) REFERENCES users(id))");
      console.log("Created/Verified protocol_sessions table");
    } catch (e) {
      console.error("Error creating/migrating protocol_sessions table:", e);
    }

    const supplierColumns = [
      "contactEmail TEXT",
      "password TEXT",
      "region TEXT",
      "status TEXT",
      "performanceScore INT DEFAULT 100",
      "totalRevenueYield DOUBLE DEFAULT 0",
      "joinedDate TEXT",
      "commissionRate DOUBLE DEFAULT 10",
      "paystackSubaccountCode TEXT",
      "bankAccount TEXT",
      "bankCode TEXT"
    ];

    for (const col of supplierColumns) {
      try {
        await db.exec(`ALTER TABLE suppliers ADD COLUMN ${col}`);
        console.log(`Added ${col.split(' ')[0]} column to suppliers table`);
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error(`Error adding ${col.split(' ')[0]} column:`, e);
        }
      }
    }

    try {
      await db.exec("ALTER TABLE categories ADD COLUMN heroImage TEXT");
      console.log("Added heroImage column to categories table");
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error("Error adding heroImage column:", e);
      }
    }

    try {
      await db.exec("ALTER TABLE categories ADD COLUMN inspiration TEXT");
      console.log("Added inspiration column to categories table");
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error("Error adding inspiration column:", e);
      }
    }

    try {
      await db.exec("ALTER TABLE pay_for_me_requests ADD COLUMN archivedAt TEXT");
      console.log("Added archivedAt column to pay_for_me_requests table");
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error("Error adding archivedAt column:", e);
      }
    }

    try {
      await db.exec("ALTER TABLE pay_for_me_requests ADD COLUMN shippingProtocol TEXT");
      console.log("Added shippingProtocol column to pay_for_me_requests table");
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error("Error adding shippingProtocol column:", e);
      }
    }

    try {
      await db.exec("ALTER TABLE price_anomalies ADD COLUMN discountedPrice DOUBLE");
    } catch (e) {}
    try {
      await db.exec("ALTER TABLE price_anomalies ADD COLUMN price DOUBLE");
    } catch (e) {}

    // Insert mock user u1
    const mockHash = await bcrypt.hash('password', 10);
    await db.exec(`INSERT OR IGNORE INTO users (id, handle, email, password, role) VALUES ('u1', 'Guest User', 'guest@example.com', '${mockHash}', 'user')`);
    
    // Clean up any old default admin using the user's personal email to prevent registration conflicts,
    // but ONLY if the account role is 'ADMIN' (to avoid deleting the account once they register as a normal user).
    const userEmailToCleanup = 'lenoakowan@gmail.com';
    const blockedUser = await db.get("SELECT id, role FROM users WHERE email = ?", [userEmailToCleanup]);
    if (blockedUser && blockedUser.role === 'ADMIN') {
      console.log(`Cleaning up registration conflict for email: ${userEmailToCleanup}`);
      await db.run("DELETE FROM admins WHERE id = ?", [blockedUser.id]);
      await db.run("DELETE FROM users WHERE id = ?", [blockedUser.id]);
    }

    // Create admins from environment or default if not exist
    const adminEmails = [process.env.ADMIN_EMAIL || 'admin@closetkraze.top', 'admin@closetkraze.top', 'admin@closetkraze.com'];
    const adminHandle = 'leno';
    const adminPass = process.env.ADMIN_PASS || '1q2w3!';
    const adminHash = await bcrypt.hash(adminPass, 10);
    
    for (const email of adminEmails) {
      const existingAdmin = await db.get("SELECT * FROM admins WHERE email = ?", [email]);
      if (!existingAdmin) {
        const adminId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.run("INSERT OR IGNORE INTO users (id, handle, email, password, role) VALUES (?, ?, ?, ?, ?)", [adminId, adminHandle, email, adminHash, 'ADMIN']);
        await db.run("INSERT OR IGNORE INTO admins (id, email, password, handle) VALUES (?, ?, ?, ?)", [adminId, email, adminHash, adminHandle]);
        console.log(`Default admin created: ${email}`);
      }
    }

    // Ensure upload directories exist
    const uploadDirs = [
      'public',
      'public/uploads',
      'public/uploads/products',
      'public/uploads/feeds',
      'public/uploads/admin',
      'public/uploads/profiles'
    ];
    
    for (const dir of uploadDirs) {
      if (!fs.existsSync(path.join(process.cwd(), dir))) {
        fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }

    await initBundlesTable();

    // High-performance database secondary indexes to prevent full table scans
    const perfIndexes = [
      "CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId)",
      "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
      "CREATE INDEX IF NOT EXISTS idx_products_inStock ON products(inStock)",
      "CREATE INDEX IF NOT EXISTS idx_products_createdAt ON products(createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_products_supplierId ON products(supplierId)",
      "CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId)",
      "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
      "CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_referrals_referrerId ON referrals(referrerId)",
      "CREATE INDEX IF NOT EXISTS idx_referrals_refereeId ON referrals(refereeId)",
      "CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code)",
      "CREATE INDEX IF NOT EXISTS idx_referral_ledger_userId ON referral_ledger(userId)",
      "CREATE INDEX IF NOT EXISTS idx_social_posts_userId ON social_posts(userId)",
      "CREATE INDEX IF NOT EXISTS idx_social_posts_weekId ON social_posts(weekId)",
      "CREATE INDEX IF NOT EXISTS idx_social_comments_postId ON social_comments(postId)",
      "CREATE INDEX IF NOT EXISTS idx_cart_items_userId ON cart_items(userId)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_recipientId ON notifications(recipientId)",
      "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)",
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
      "CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle)",
      "CREATE INDEX IF NOT EXISTS idx_users_referralCode ON users(referralCode)",
      "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
      "CREATE INDEX IF NOT EXISTS idx_reviews_productId ON reviews(productId)",
      "CREATE INDEX IF NOT EXISTS idx_pay_for_me_requests_userId ON pay_for_me_requests(userId)"
    ];
    for (const sql of perfIndexes) {
      try {
        await db.run(sql);
      } catch (e) {
        // Safe to ignore if index exists or table is created subsequently
      }
    }
    console.log('Database performance indexes verified successfully');
  } catch (err) {
    console.error("Error initializing database schema:", err);
    throw err; // Throw error to stop server startup
  }
}

async function startServer() {
  if ((global as any).serverStarted) {
    console.log('Express server already started (global.serverStarted is true). Skipping duplicate startServer() invocation.');
    return;
  }
  (global as any).serverStarted = true;

  try {
    await initializeDatabase();
  } catch (err) {
    console.error("Failed to initialize database, exiting...", err);
    process.exit(1);
  }
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for easier integration with external scripts (Paystack, etc.) in this dev environment
  }));
  const PORT = 3000;

  app.use(compression({
    threshold: 512, // Compress anything above 512 bytes
  }));
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use(cookieParser());

  // Special static routes with Cloudflare-aligned cache control headers
  app.use('/logo.svg', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
    next();
  });
  app.use('/manifest.json', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
    next();
  });

  const uploadsCacheOptions = {
    maxAge: '1d',
    setHeaders: (res: any) => {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    }
  };

  const assetsCacheOptions = {
    maxAge: '1y',
    setHeaders: (res: any) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  };

  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads'), uploadsCacheOptions));
  app.use('/img', express.static(path.join(process.cwd(), 'public/img'), uploadsCacheOptions));
  app.use('/clothes', express.static(path.join(process.cwd(), 'clothes'), uploadsCacheOptions));
  app.use('/assets', express.static(path.join(process.cwd(), 'dist/assets'), assetsCacheOptions));

  // Public catalog HTTP cache headers for instant client responses
  app.use('/api/categories', (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
    next();
  });
  app.use('/api/bundles', (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    }
    next();
  });
  app.use('/api/tags', (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
    }
    next();
  });
  app.use('/api/products', (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    }
    next();
  });

  // API Routes
  app.use('/api/products', productsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/referrals', referralsRouter);
  app.use('/api/suppliers', suppliersRouter);
  app.use('/api/supply_orders', supplyOrdersRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/admins', adminsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api', socialRouter);
  app.use('/api', userStatsRouter);
  app.use('/api', miscRouter);
  app.use('/api/user', userRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/tags', tagsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/bundles', bundlesRouter);
  app.use('/api/ai', aiRouter);
  
  app.get('/api/health', async (req, res) => {
    try {
      await db.get('SELECT 1');
      res.json({ status: 'ok', db: 'connected' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR to avoid port conflicts in some environments
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1d' }));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Express Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Broadcast active users count
    const broadcastActiveUsers = () => {
      const count = clients.size + 1024; // Base 1024 + real connections
      const message = JSON.stringify({ type: 'USER_COUNT', count });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    };

    broadcastActiveUsers();

    ws.on('close', () => {
      clients.delete(ws);
      broadcastActiveUsers();
    });

    // Handle incoming messages if needed
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'PURCHASE') {
          // Broadcast purchase notification
          const notification = JSON.stringify({
            type: 'SOCIAL_PROOF',
            message: `${message.handle} just copped ${message.itemName}!`,
            timestamp: Date.now()
          });
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(notification);
            }
          });
        }
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    });
  });

  // Periodic activity simulation
  setInterval(() => {
    if (clients.size > 0) {
      const activities = [
        'Someone just viewed the Midnight Cyber Cloak',
        'New collection alert: Void Echoes now available',
        '3 people just added Neon Glitch Sneakers to wishlist',
        'Limited edition "Cyber-Core Processor" is still up for grabs!'
      ];
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const message = JSON.stringify({ type: 'ACTIVITY', activity });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }, 15000);
}

// Handle uncaught exceptions and unhandled rejections to prevent server crash
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  } else if (typeof reason === 'object' && reason !== null) {
    console.error('Reason Object:', JSON.stringify(reason, null, 2));
  }
});

startServer();
