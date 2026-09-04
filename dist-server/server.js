import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
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
import scraperRouter from './api/scraper.js';
const __filename_resolved = typeof __filename !== 'undefined' ? __filename : '';
const __dirname_resolved = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filename_resolved);
// Robustly load .env from multiple possible directory paths (cwd, current module dir, parents) to cover all start methods
dotenv.config();
try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    dotenv.config({ path: path.resolve(__dirname_resolved, '.env') });
    dotenv.config({ path: path.resolve(__dirname_resolved, '../.env') });
    dotenv.config({ path: path.resolve(__dirname_resolved, '../../.env') });
}
catch (e) {
    console.error('Error loading .env paths:', e);
}
// Override console.error to log to a file
const originalConsoleError = console.error;
console.error = function (...args) {
    const logArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg, null, 2);
            }
            catch (e) {
                return String(arg);
            }
        }
        return arg;
    });
    try {
        fs.appendFileSync('server-errors.log', new Date().toISOString() + ' ' + logArgs.join(' ') + '\n');
    }
    catch (e) {
        // Fallback to original console error if file is not writable
    }
    originalConsoleError.apply(console, args);
};
// SQLite Connection Wrapper
export const db = {};
async function initializeDatabase() {
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    let sqliteDb;
    try {
        sqliteDb = new Database(dbPath);
        // Enable auto_vacuum to reduce database size automatically
        sqliteDb.pragma('auto_vacuum = FULL');
        // Run a manual VACUUM on startup to reclaim space
        sqliteDb.exec('VACUUM;');
        console.log('Database vacuumed successfully');
    }
    catch (error) {
        if (error && (error.code === 'SQLITE_CORRUPT' || String(error).includes('corrupt') || String(error).includes('CORRUPT'))) {
            console.warn("SQLite database is corrupted. Deleting and recreating...", error);
            try {
                if (fs.existsSync(dbPath)) {
                    fs.unlinkSync(dbPath);
                }
            }
            catch (e) {
                console.error("Failed to delete corrupt database.sqlite file:", e);
            }
            sqliteDb = new Database(dbPath);
            sqliteDb.pragma('auto_vacuum = FULL');
        }
        else {
            throw error;
        }
    }
    const sanitizeParams = (params) => {
        return params.map(val => {
            if (val === null || val === undefined)
                return null;
            if (val instanceof Date)
                return val.toISOString();
            if (typeof val === 'boolean')
                return val ? 1 : 0;
            if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
                try {
                    return JSON.stringify(val);
                }
                catch (e) {
                    return String(val);
                }
            }
            return val;
        });
    };
    Object.assign(db, {
        all: async (sql, params = []) => {
            return sqliteDb.prepare(sql).all(...sanitizeParams(params));
        },
        get: async (sql, params = []) => {
            return sqliteDb.prepare(sql).get(...sanitizeParams(params));
        },
        run: async (sql, params = []) => {
            const info = sqliteDb.prepare(sql).run(...sanitizeParams(params));
            return { lastID: info.lastInsertRowid, changes: info.changes };
        },
        exec: async (sql) => {
            sqliteDb.exec(sql);
        },
        prepare: (sql) => sqliteDb.prepare(sql),
        pragma: (sql) => sqliteDb.pragma(sql)
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
        }
        catch (e) {
            console.error("Error creating refresh_tokens table:", e);
        }
        try {
            await db.exec("ALTER TABLE users ADD COLUMN gender TEXT");
            console.log("Added gender to users table");
        }
        catch (e) {
            // Ignored if column already exists
        }
        try {
            await db.exec("ALTER TABLE user_stats ADD COLUMN storeCredit DOUBLE DEFAULT 0");
            console.log("Added storeCredit to user_stats");
        }
        catch (e) {
            // Ignored if column already exists
        }
        try {
            await db.exec("ALTER TABLE user_stats ADD COLUMN neuralStylistUsedToday INT DEFAULT 0");
            console.log("Added neuralStylistUsedToday to user_stats");
        }
        catch (e) {
            // Ignored if column already exists
        }
        try {
            await db.exec("ALTER TABLE user_preferences ADD COLUMN styleProtocolCompleted INT DEFAULT 0");
            await db.exec("ALTER TABLE user_preferences ADD COLUMN checkoutProtocolCompleted INT DEFAULT 0");
            await db.exec("ALTER TABLE user_preferences ADD COLUMN tutorialFinished INT DEFAULT 0");
        }
        catch (e) {
            // Ignored if columns already exist
        }
        try {
            await db.exec("ALTER TABLE suppliers ADD COLUMN plain_password TEXT");
            console.log("Added plain_password to suppliers table");
        }
        catch (e) {
            // Ignored if column already exists
        }
        try {
            await db.exec("ALTER TABLE products ADD COLUMN video TEXT");
            console.log("Added video to products table");
        }
        catch (e) {
            // Ignored if column already exists
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
        }
        catch (e) {
            console.error("Error initializing tags:", e);
        }
        try {
            await db.exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, heroImage TEXT, inspiration TEXT)");
            const defaultCategories = ['Apparel', 'Footwear', 'Accessories', 'Beauty', 'Kits'];
            for (const catName of defaultCategories) {
                await db.run("INSERT OR IGNORE INTO categories (id, name, heroImage, inspiration) VALUES (?, ?, ?, ?)", [crypto.randomUUID(), catName, null, null]);
            }
        }
        catch (e) {
            console.error("Error initializing categories:", e);
        }
        try {
            await db.exec("CREATE TABLE IF NOT EXISTS paystack_transactions (id VARCHAR(255) PRIMARY KEY, email TEXT, amount DOUBLE, reference TEXT UNIQUE, status TEXT, metadata TEXT, timestamp TEXT, subaccount TEXT)");
            console.log("Created paystack_transactions table");
            // Migration for adding subaccount to existing
            try {
                await db.exec("ALTER TABLE paystack_transactions ADD COLUMN subaccount TEXT");
            }
            catch (e) {
                if (!e.message.includes('duplicate column name')) {
                    console.error("Error adding subaccount column to paystack_transactions:", e);
                }
            }
        }
        catch (e) {
            console.error("Error creating paystack_transactions table:", e);
        }
        try {
            await db.exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (id VARCHAR(255) PRIMARY KEY, userId VARCHAR(255) NOT NULL, token TEXT NOT NULL UNIQUE, expiresAt INT NOT NULL, used INT DEFAULT 0)");
            console.log("Created password_reset_tokens table");
        }
        catch (e) {
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
        }
        catch (e) {
            console.error("Error creating custom_requests table:", e);
        }
        try {
            await db.exec("CREATE TABLE IF NOT EXISTS outfits (id VARCHAR(255) PRIMARY KEY, userId VARCHAR(255), name TEXT, items TEXT, timestamp TEXT)");
            console.log("Created outfits table");
        }
        catch (e) {
            console.error("Error creating outfits table:", e);
        }
        try {
            await db.exec("CREATE TABLE IF NOT EXISTS referrals (id VARCHAR(255) PRIMARY KEY, referrerId VARCHAR(255) NOT NULL, referredId VARCHAR(255) NOT NULL, code VARCHAR(255) NOT NULL, status VARCHAR(255) DEFAULT 'PENDING', rewardAmount DOUBLE DEFAULT 0, createdAt TEXT)");
            console.log("Created referrals table");
        }
        catch (e) {
            console.error("Error creating referrals table:", e);
        }
        try {
            await db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
            console.log("Added role column to users table");
        }
        catch (e) {
            if (!e.message.includes('duplicate column name')) {
                console.error("Error adding role column:", e);
            }
        }
        try {
            await db.exec("ALTER TABLE users ADD COLUMN logistics TEXT");
            console.log("Added logistics column to users table");
        }
        catch (e) {
            if (!e.message.includes('duplicate column name')) {
                console.error("Error adding logistics column:", e);
            }
        }
        try {
            await db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
            console.log("Added phone column to users table");
        }
        catch (e) {
            if (!e.message.includes('duplicate column name')) {
                console.error("Error adding phone column to users:", e);
            }
        }
        // Products table migrations
        const productColumns = [
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
            }
            catch (e) {
                if (e.message.includes('duplicate column name')) {
                    console.log(`Column ${col.split(' ')[0]} already exists in products table`);
                }
                else {
                    console.error(`Error adding ${col.split(' ')[0]} to products:`, e.message);
                }
            }
        }
        try {
            // Migration: Update PK to (userId, protocolType)
            const tableInfo = await db.all("PRAGMA table_info(protocol_sessions)");
            const isOldSchema = tableInfo.length > 0 && tableInfo.filter((c) => c.pk === 1).length === 1 && tableInfo.find((c) => c.name === 'userId' && c.pk === 1);
            if (isOldSchema) {
                console.log("Migrating protocol_sessions table to new schema...");
                await db.exec("DROP TABLE protocol_sessions");
            }
            await db.exec("CREATE TABLE IF NOT EXISTS protocol_sessions (userId VARCHAR(255), protocolType TEXT, currentStep INT, sessionData TEXT, lastUpdated INT, PRIMARY KEY (userId, protocolType), FOREIGN KEY (userId) REFERENCES users(id))");
            console.log("Created/Verified protocol_sessions table");
        }
        catch (e) {
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
            }
            catch (e) {
                if (!e.message.includes('duplicate column name')) {
                    console.error(`Error adding ${col.split(' ')[0]} column:`, e);
                }
            }
        }
        try {
            await db.exec("ALTER TABLE categories ADD COLUMN heroImage TEXT");
            console.log("Added heroImage column to categories table");
        }
        catch (e) {
            if (!e.message.includes('duplicate column name')) {
                console.error("Error adding heroImage column:", e);
            }
        }
        try {
            await db.exec("ALTER TABLE categories ADD COLUMN inspiration TEXT");
            console.log("Added inspiration column to categories table");
        }
        catch (e) {
            if (!e.message.includes('duplicate column name')) {
                console.error("Error adding inspiration column:", e);
            }
        }
        try {
            await db.exec("ALTER TABLE pay_for_me_requests ADD COLUMN archivedAt TEXT");
            console.log("Added archivedAt column to pay_for_me_requests table");
        }
        catch (e) {
            if (!e.message.includes('duplicate column name')) {
                console.error("Error adding archivedAt column:", e);
            }
        }
        try {
            await db.exec("ALTER TABLE pay_for_me_requests ADD COLUMN shippingProtocol TEXT");
            console.log("Added shippingProtocol column to pay_for_me_requests table");
        }
        catch (e) {
            if (!e.message.includes('duplicate column name')) {
                console.error("Error adding shippingProtocol column:", e);
            }
        }
        try {
            await db.exec("ALTER TABLE price_anomalies ADD COLUMN discountedPrice DOUBLE");
        }
        catch (e) { }
        try {
            await db.exec("ALTER TABLE price_anomalies ADD COLUMN price DOUBLE");
        }
        catch (e) { }
        // Insert mock user u1
        const mockHash = await bcrypt.hash('password', 10);
        await db.exec(`INSERT OR IGNORE INTO users (id, handle, email, password, role) VALUES ('u1', 'Guest User', 'guest@example.com', '${mockHash}', 'user')`);
        // Create admins from environment or default if not exist
        const adminEmail = process.env.ADMIN_EMAIL || 'lenoakowan@gmail.com';
        const adminHandle = 'leno';
        const adminPass = process.env.ADMIN_PASS || '1q2w3!';
        const adminHash = await bcrypt.hash(adminPass, 10);
        const existingAdmin = await db.get("SELECT * FROM admins WHERE email = ?", [adminEmail]);
        if (!existingAdmin) {
            const adminId = `admin_${Date.now()}`;
            await db.run("INSERT INTO users (id, handle, email, password, role) VALUES (?, ?, ?, ?, ?)", [adminId, adminHandle, adminEmail, adminHash, 'ADMIN']);
            await db.run("INSERT INTO admins (id, email, password, handle) VALUES (?, ?, ?, ?)", [adminId, adminEmail, adminHash, adminHandle]);
            console.log(`Default admin created: ${adminEmail}`);
        }
        // Initialize scraper config and logs tables
        try {
            await db.exec("CREATE TABLE IF NOT EXISTS scraper_config (key VARCHAR(255) PRIMARY KEY, value TEXT)");
            await db.run("INSERT OR IGNORE INTO scraper_config (key, value) VALUES ('enabled', 'false')");
        }
        catch (e) {
            console.error("Error creating or seeding scraper_config table:", e);
        }
        try {
            await db.exec("CREATE TABLE IF NOT EXISTS scraper_logs (id VARCHAR(255) PRIMARY KEY, timestamp TEXT, query TEXT, status TEXT, count INTEGER, message TEXT)");
        }
        catch (e) {
            console.error("Error creating scraper_logs table:", e);
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
    }
    catch (err) {
        console.error("Error initializing database schema:", err);
        throw err; // Throw error to stop server startup
    }
}
async function startServer() {
    if (global.serverStarted) {
        console.log('Express server already started (global.serverStarted is true). Skipping duplicate startServer() invocation.');
        return;
    }
    global.serverStarted = true;
    try {
        await initializeDatabase();
    }
    catch (err) {
        console.error("Failed to initialize database, exiting...", err);
        process.exit(1);
    }
    const app = express();
    app.set('trust proxy', 1);
    app.use(helmet({
        contentSecurityPolicy: false, // Disable CSP for easier integration with external scripts (Paystack, etc.) in this dev environment
    }));
    const PORT = 3000;
    app.use(compression());
    app.use(cors({
        origin: true,
        credentials: true
    }));
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    app.use(cookieParser());
    const staticCacheOptions = {
        maxAge: '7d',
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        }
    };
    app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads'), staticCacheOptions));
    app.use('/img', express.static(path.join(process.cwd(), 'public/img'), staticCacheOptions));
    app.use('/clothes', express.static(path.join(process.cwd(), 'clothes'), staticCacheOptions));
    app.use('/uploads/products', express.static(path.join(process.cwd(), 'public/uploads/products'), staticCacheOptions));
    app.use('/uploads/feeds', express.static(path.join(process.cwd(), 'public/uploads/feeds'), staticCacheOptions));
    app.use('/uploads/admin', express.static(path.join(process.cwd(), 'public/uploads/admin'), staticCacheOptions));
    app.use('/uploads/profiles', express.static(path.join(process.cwd(), 'public/uploads/profiles'), staticCacheOptions));
    // API Routes
    app.use('/api/products', productsRouter);
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
    app.use('/api/ai', aiRouter);
    app.use('/api/scraper', scraperRouter);
    app.get('/api/health', async (req, res) => {
        try {
            await db.get('SELECT 1');
            res.json({ status: 'ok', db: 'connected' });
        }
        catch (error) {
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
    }
    else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath, { maxAge: '1d' }));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
    // Global Error Handler
    app.use((err, req, res, next) => {
        console.error('Unhandled Express Error:', err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    });
    const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
    // WebSocket Server
    const wss = new WebSocketServer({ server, path: '/ws' });
    const clients = new Set();
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
            }
            catch (e) {
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
    }
    else if (typeof reason === 'object' && reason !== null) {
        console.error('Reason Object:', JSON.stringify(reason, null, 2));
    }
});
startServer();
