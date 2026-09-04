import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import sharp from 'sharp';

/**
 * Script: Generate Sitemap.xml and OG Images for Closet Kraze
 * Usage: npx tsx scripts/generate-og-and-sitemap.ts
 */

const BASE_URL = 'https://closetkraze.top';

async function main() {
  console.log('🚀 Starting Sitemap & OG Image Generation...');

  const dbPath = path.join(process.cwd(), 'database.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true });

  // 1. Fetch Products safely
  let products: any[] = [];
  try {
    products = db.prepare('SELECT id, name, price, image FROM products ORDER BY id DESC').all();
  } catch (e) {
    console.warn('Could not query products from database:', e);
  }

  // Fetch categories if table exists, otherwise use standard categories
  let categories: any[] = [
    { slug: 'apparel', name: 'Apparel' },
    { slug: 'footwear', name: 'Footwear' },
    { slug: 'accessories', name: 'Accessories' },
    { slug: 'hoodies', name: 'Hoodies' },
    { slug: 'jackets', name: 'Jackets' },
    { slug: 'streetwear', name: 'Streetwear' },
    { slug: 'vintage', name: 'Vintage' },
    { slug: 'grails', name: 'Grails' },
    { slug: 'bags', name: 'Bags & Luggage' },
  ];

  try {
    const catRows = db.prepare('SELECT * FROM categories').all();
    if (catRows && catRows.length > 0) {
      categories = catRows;
    }
  } catch (e) {
    // categories table might not exist
  }

  console.log(`📦 Found ${products.length} products and ${categories.length} categories.`);

  // 2. Generate Sitemap XML
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static Pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/shop', priority: '0.9', changefreq: 'daily' },
    { url: '/hall-of-fame', priority: '0.8', changefreq: 'weekly' },
    { url: '/social', priority: '0.8', changefreq: 'hourly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/legit-check', priority: '0.7', changefreq: 'monthly' },
    { url: '/kfam', priority: '0.8', changefreq: 'weekly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.6', changefreq: 'monthly' },
  ];

  for (const page of staticPages) {
    sitemapXml += `  <url>\n`;
    sitemapXml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
    sitemapXml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemapXml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemapXml += `    <priority>${page.priority}</priority>\n`;
    sitemapXml += `  </url>\n`;
  }

  // Categories
  for (const cat of categories) {
    const slug = cat.slug || (cat.name ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'general');
    sitemapXml += `  <url>\n`;
    sitemapXml += `    <loc>${BASE_URL}/category/${slug}</loc>\n`;
    sitemapXml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemapXml += `    <changefreq>weekly</changefreq>\n`;
    sitemapXml += `    <priority>0.8</priority>\n`;
    sitemapXml += `  </url>\n`;
  }

  // Products
  for (const prod of products) {
    const pSlug = prod.name ? prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prod.id;
    sitemapXml += `  <url>\n`;
    sitemapXml += `    <loc>${BASE_URL}/product/${pSlug || prod.id}</loc>\n`;
    sitemapXml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemapXml += `    <changefreq>weekly</changefreq>\n`;
    sitemapXml += `    <priority>0.9</priority>\n`;
    sitemapXml += `  </url>\n`;
  }

  sitemapXml += `</urlset>`;

  const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  console.log(`✅ Generated sitemap.xml with ${staticPages.length + categories.length + products.length} URLs.`);

  // 3. Generate OG Home Image (1200x630)
  const ogDir = path.join(process.cwd(), 'public/uploads/og');
  if (!fs.existsSync(ogDir)) {
    fs.mkdirSync(ogDir, { recursive: true });
  }

  const homeSvg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00D1FF" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      
      <!-- Decorative Grid Lines -->
      <path d="M 0,155 L 1200,155" stroke="#1e293b" stroke-width="1" stroke-dasharray="8 8" />
      <path d="M 0,475 L 1200,475" stroke="#1e293b" stroke-width="1" stroke-dasharray="8 8" />
      
      <!-- Badge -->
      <rect x="80" y="100" width="240" height="42" rx="21" fill="#0f52ba" fill-opacity="0.3" stroke="#00D1FF" stroke-width="1.5" />
      <text x="200" y="126" font-family="sans-serif" font-size="14" font-weight="bold" fill="#00D1FF" text-anchor="middle" letter-spacing="3">KUMASI, GHANA</text>

      <!-- Main Titles -->
      <text x="80" y="260" font-family="serif" font-size="96" font-weight="bold" fill="#ffffff" letter-spacing="-2">CLOSET KRAZE</text>
      <text x="80" y="330" font-family="sans-serif" font-size="36" font-weight="900" fill="url(#glow)" letter-spacing="6">DRESS TO BE ADDRESSED</text>

      <text x="80" y="420" font-family="sans-serif" font-size="22" font-weight="normal" fill="#94a3b8">High-End Archival Streetwear • Verified Rare Pieces • WhatsApp Checkout</text>
      
      <!-- Footer Pill -->
      <rect x="80" y="490" width="340" height="54" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
      <text x="110" y="524" font-family="monospace" font-size="18" font-weight="bold" fill="#38bdf8">closetkraze.top</text>
      <text x="290" y="524" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff">From GH₵55</text>
    </svg>
  `;

  await sharp(Buffer.from(homeSvg))
    .png()
    .toFile(path.join(process.cwd(), 'public/og-home.png'));
  console.log('✅ Generated static /public/og-home.png (1200x630)');

  // 4. Generate Product OG Images for top 30 products
  let ogCount = 0;
  for (const prod of products.slice(0, 30)) {
    const pSlug = prod.name ? prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prod.id;
    const price = prod.price || 0;
    const pName = escapeXml((prod.name || 'Archival Item').slice(0, 40));
    const prodSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)" />
        
        <!-- Brand Header -->
        <text x="80" y="90" font-family="sans-serif" font-size="16" font-weight="bold" fill="#38bdf8" letter-spacing="4">CLOSET KRAZE VAULT</text>
        
        <!-- Product Name -->
        <text x="80" y="170" font-family="serif" font-size="54" font-weight="bold" fill="#ffffff">${pName}</text>
        
        <!-- Price Tag -->
        <rect x="80" y="230" width="220" height="60" rx="30" fill="#059669" />
        <text x="190" y="270" font-family="sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">GH₵${price}</text>

        <!-- Footer info -->
        <text x="80" y="520" font-family="sans-serif" font-size="20" font-weight="600" fill="#94a3b8">Verified Archival Streetwear • WhatsApp Checkout • Nationwide Delivery</text>
        <text x="80" y="560" font-family="monospace" font-size="16" fill="#38bdf8">closetkraze.top/product/${pSlug}</text>
      </svg>
    `;

    try {
      await sharp(Buffer.from(prodSvg))
        .png()
        .toFile(path.join(ogDir, `og-product-${pSlug}.png`));
      ogCount++;
    } catch (err) {
      console.warn(`Failed to generate OG image for product ${prod.id}:`, err);
    }
  }

  console.log(`✅ Generated ${ogCount} product OG images in /public/uploads/og/`);
  console.log('✨ Sitemap & OG Generation Complete!');
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

main().catch(console.error);
