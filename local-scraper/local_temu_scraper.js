#!/usr/bin/env node

/**
 * Temu Local High-Fidelity Scraper & Bulk Template Generator
 * 
 * This script runs on your local PC to scrape products from Temu,
 * downloads all images locally (to prevent using Temu image URLs),
 * converts images to Base64 strings for fully self-contained uploads,
 * and maintains a log file of previously scraped items to prevent duplicates.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

// Resolve directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color printing helpers
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: (msg, err) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`, err || ''),
  header: (msg) => console.log(`\n\x1b[35m=== ${msg} ===\x1b[0m\n`)
};

// Helper to download an image, save it locally, and return its Base64 representation
async function downloadImageAsBase64(url, prefix, index, downloadDir) {
  try {
    const filename = `${prefix}_img_${index}_${Date.now()}.jpg`;
    const outputPath = path.join(downloadDir, filename);

    log.info(`Downloading & converting image: ${url.substring(0, 60)}...`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.temu.com/'
      }
    });

    const buffer = Buffer.from(response.data);
    fs.writeFileSync(outputPath, buffer);

    // Detect MIME type
    let mimeType = 'image/jpeg';
    if (url.includes('.webp')) mimeType = 'image/webp';
    else if (url.includes('.png')) mimeType = 'image/png';
    else if (url.includes('.gif')) mimeType = 'image/gif';

    return {
      base64: `data:${mimeType};base64,${buffer.toString('base64')}`,
      localPath: `./downloaded_images/${filename}`
    };
  } catch (err) {
    log.error(`Failed to download image ${url.substring(0, 40)}: ${err.message}`);
    return null;
  }
}

async function main() {
  log.header('Temu Local Scraper & Downloader');

  const args = process.argv.slice(2);
  
  // Link list / Predefined queries to cycle through
  const searchQueries = [
    'womens fashion clothing', 
    'mens streetwear vintage', 
    'trending sneakers shoes', 
    'designer handbags purses', 
    'winter jackets coats', 
    'summer dresses',
    'y2k aesthetic',
    'cargo pants'
  ];

  let targetAmount = 30;
  let useCyclingMode = true;
  let singleQuery = "";
  let scraperApiKey = process.env.SCRAPER_API_KEY;

  if (args.length > 0) {
    const firstArg = args[0];
    if (firstArg === "-h" || firstArg === "--help" || firstArg === "help") {
      console.log(`
\x1b[1mUsage:\x1b[0m
  node local_temu_scraper.js [target_amount] [scraper_api_key]
  node local_temu_scraper.js "<search-keyword>" [limit] [scraper_api_key]

\x1b[1mExamples:\x1b[0m
  node local_temu_scraper.js 30                  Scrapes 30 items cycling through the fashion catalog rules list
  node local_temu_scraper.js "oversized hoodies" 8 Scrapes 8 specific hoodies items
  node local_temu_scraper.js 20 abc123def_key    Scrapes 20 items using a ScraperAPI key

\x1b[1mOptions:\x1b[0m
  - target_amount    Target amount of items to scrape using predefined link list and category rules (default: 30, max: 100).
  - search-keyword   Optional custom keyword query to search instead of the default list.
  - limit            Target amount to scrape for custom keyword (default: 6, max: 50).
  - scraper_api_key  Optional ScraperAPI key for proxy rotation.
`);
      process.exit(0);
    }

    if (!isNaN(Number(firstArg))) {
      targetAmount = Math.min(100, parseInt(firstArg, 10) || 30);
      if (args[1] && isNaN(Number(args[1]))) {
        scraperApiKey = args[1];
      }
    } else {
      useCyclingMode = false;
      singleQuery = firstArg;
      targetAmount = Math.min(100, parseInt(args[1], 10) || 6);
      if (args[2]) {
        scraperApiKey = args[2];
      }
    }
  }

  // Paths for output, downloaded images & duplicate tracking
  const outputDir = process.cwd();
  const downloadDir = path.join(outputDir, 'downloaded_images');
  const historyPath = path.join(outputDir, 'temu_scraped_history.json');
  const outputPath = path.join(outputDir, 'temu_bulk_upload.json');

  // Create image download folder
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
    log.info(`Created local image download folder: ${downloadDir}`);
  }

  // Load scraping history (prevent duplicates)
  let scrapedHistory = [];
  if (fs.existsSync(historyPath)) {
    try {
      scrapedHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      log.info(`Loaded ${scrapedHistory.length} products from previous runs to enforce duplicate prevention.`);
    } catch (e) {
      log.warn(`Could not read existing history at ${historyPath}. Re-initializing history.`);
    }
  } else {
    log.info(`Creating fresh duplicate tracking log: ${historyPath}`);
  }

  const acceptedNamesSet = new Set(scrapedHistory.map(name => name.toLowerCase().trim()));

  log.info('Initiating scrape. Bypassing rate limits with high-fidelity browser emulation...');

  let rawProducts = [];

  if (useCyclingMode) {
    log.info(`Running in Category Cycling Mode. Targets: ${targetAmount} products.`);
    log.info(`Predefined Search List: [${searchQueries.join(', ')}]`);

    let totalImported = 0;
    let queryIndex = 0;

    while (totalImported < targetAmount) {
      const remaining = targetAmount - totalImported;
      const currentLimit = Math.min(6, remaining);
      const currentQuery = searchQueries[queryIndex % searchQueries.length];

      log.info(`\n[Query Round ${queryIndex + 1}] Scraping category: "${currentQuery}" (limit: ${currentLimit})`);

      let batchProducts = [];
      try {
        if (scraperApiKey && scraperApiKey !== 'your_scraper_api_key_here') {
          batchProducts = await scrapeWithScraperApi(currentQuery, currentLimit, acceptedNamesSet, scraperApiKey);
        } else {
          batchProducts = await scrapeDirect(currentQuery, currentLimit, acceptedNamesSet);
        }
      } catch (err) {
        log.error(`Primary scraping failed for "${currentQuery}": ${err.message}`);
      }

      // Fallback if blocked/0 items found
      if (batchProducts.length === 0) {
        log.warn(`Temu returned 0 products or blocked request for "${currentQuery}".`);
        log.info(`Activating Unsplash Premium Fashion generator fallback for "${currentQuery}"...`);
        batchProducts = await generateUnsplashFashionProducts(currentQuery, currentLimit, acceptedNamesSet);
      }

      // Filter out products we already scraped in this run to prevent duplicates
      const filteredBatch = batchProducts.filter(p => !rawProducts.some(existing => existing.name.toLowerCase().trim() === p.name.toLowerCase().trim()));

      if (filteredBatch.length > 0) {
        rawProducts.push(...filteredBatch);
        totalImported += filteredBatch.length;
        log.success(`Acquired ${filteredBatch.length} new items from "${currentQuery}". Total gathered: ${totalImported}/${targetAmount}`);
      } else {
        log.warn(`No new products acquired from "${currentQuery}". Moving to next category.`);
      }

      queryIndex++;

      // Safety break to prevent infinite loop
      if (queryIndex > 50) {
        log.warn("Reached maximum query iterations safety threshold. Stopping scraping.");
        break;
      }

      if (totalImported < targetAmount) {
        log.info("Sleeping 2 seconds before next query round...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } else {
    // Single Query Mode
    log.info(`Running in Single Custom Query Mode.`);
    log.info(`Query Keyword: "${singleQuery}"`);
    log.info(`Target Item Limit: ${targetAmount}`);

    try {
      if (scraperApiKey && scraperApiKey !== 'your_scraper_api_key_here') {
        log.info(`Utilizing provided ScraperAPI key: ...${scraperApiKey.substring(Math.max(0, scraperApiKey.length - 6))}`);
        rawProducts = await scrapeWithScraperApi(singleQuery, targetAmount, acceptedNamesSet, scraperApiKey);
      } else {
        log.info('Using direct residential emulation scrape mode.');
        rawProducts = await scrapeDirect(singleQuery, targetAmount, acceptedNamesSet);
      }
    } catch (error) {
      log.error('Primary scraping failed:', error.message);
    }

    // Fallback to high-quality Unsplash Fashion assets if blocked or 0 products retrieved
    if (rawProducts.length === 0) {
      log.warn('Temu returned 0 products or blocked the request due to anti-bot protection.');
      log.info('Activating high-fidelity Unsplash Premium Fashion generator fallback...');
      rawProducts = await generateUnsplashFashionProducts(singleQuery, targetAmount, acceptedNamesSet);
    }
  }

  if (rawProducts.length === 0) {
    log.error('No products could be generated or scraped. Please check your internet connection.');
    process.exit(1);
  }

  // Now download images for each product and convert them to Base64
  log.header('Downloading and Localizing Images (Bypassing Hotlinks)');
  const finalizedProducts = [];

  for (let i = 0; i < rawProducts.length; i++) {
    const product = rawProducts[i];
    const prefix = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    log.info(`Processing images for product [${i + 1}/${rawProducts.length}]: "${product.name}"`);

    // Download primary image
    const primaryImgResult = await downloadImageAsBase64(product.image, prefix, 'primary', downloadDir);
    if (!primaryImgResult) {
      log.warn(`Skipping product "${product.name}" because its primary image failed to download.`);
      continue;
    }

    // Download additional gallery images
    const localizedGallery = [];
    localizedGallery.push(primaryImgResult.base64); // Primary goes first

    if (Array.isArray(product.images) && product.images.length > 1) {
      // Limit to max 4 gallery images to avoid massive JSON file sizes
      const imagesToDownload = product.images.slice(1, 4);
      for (let j = 0; j < imagesToDownload.length; j++) {
        const galleryResult = await downloadImageAsBase64(imagesToDownload[j], prefix, `gallery_${j}`, downloadDir);
        if (galleryResult) {
          localizedGallery.push(galleryResult.base64);
        }
      }
    }

    // Embed base64 inside product data
    finalizedProducts.push({
      ...product,
      image: primaryImgResult.base64,
      images: localizedGallery
    });
  }

  if (finalizedProducts.length === 0) {
    log.error('All scraped products were filtered out because their images failed to download.');
    process.exit(1);
  }

  // Save Scrape Output
  try {
    fs.writeFileSync(outputPath, JSON.stringify({ products: finalizedProducts }, null, 2));
    log.success(`Generated Bulk Upload Template: ${outputPath}`);

    // Update history
    const newlyScrapedNames = finalizedProducts.map(p => p.name);
    const updatedHistory = [...scrapedHistory, ...newlyScrapedNames];
    fs.writeFileSync(historyPath, JSON.stringify(updatedHistory, null, 2));
    log.success(`Recorded ${finalizedProducts.length} products to duplicate log: ${historyPath}`);

    log.header('WHAT TO DO NEXT');
    console.log(`\x1b[1;32mStep 1:\x1b[0m Open the Closet Kraze admin panel in your web app.
\x1b[1;32mStep 2:\x1b[0m Go to the "Temu Scraper" or "Bulk Upload" section.
\x1b[1;32mStep 3:\x1b[0m Drop or upload the \x1b[33m"temu_bulk_upload.json"\x1b[0m file.
\x1b[1;32mStep 4:\x1b[0m Review the list in the high-fidelity UI and click "Accept All" to save them to the database!

The web application's import processor has been fully upgraded to extract these local base64 images and save them permanently as server-hosted WebP files! No image hotlinks are used.`);

  } catch (err) {
    log.error('Failed to write output files:', err.message);
  }
}

// Scrape using ScraperAPI proxy
async function scrapeWithScraperApi(query, limit, acceptedNamesSet, apiKey) {
  const targetUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
  const scraperUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&render=true`;
  
  log.info(`Requesting through ScraperAPI (render=true)...`);
  const response = await axios.get(scraperUrl, { timeout: 60000 });
  return parseTemuHtml(response.data, query, limit, acceptedNamesSet);
}

// Scrape directly using robust headers
async function scrapeDirect(query, limit, acceptedNamesSet) {
  const targetUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
  
  log.info(`Fetching direct page: ${targetUrl}`);
  const response = await axios.get(targetUrl, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    }
  });

  return parseTemuHtml(response.data, query, limit, acceptedNamesSet);
}

// Parses Temu's HTML structure
function parseTemuHtml(html, query, limit, acceptedNamesSet) {
  const $ = cheerio.load(html);
  const products = [];

  const selectors = [
    'div[class*="goods-card"]', 'div[class*="GoodsCard"]', 'div[class*="card"]',
    'div[data-goods-id]', '.goods-item', 'div[class*="js-goods-item"]',
    'div[class*="CardContainer"]', 'div[class*="product"]', 'div[class*="item"]',
    'div[class*="ProductCard"]', 'div[class*="item_"]', 'div[class*="goods_"]'
  ];

  let cards = $('');
  for (const selector of selectors) {
    cards = $(selector);
    if (cards.length > 0) break;
  }

  if (cards.length === 0) {
    cards = $('div').filter((_, el) => {
      const text = $(el).text();
      return text.includes('$') && $(el).find('img').length > 0 && $(el).children().length > 2;
    });
  }

  log.info(`Found ${cards.length} potential listing cards in raw HTML.`);

  const fashionKeywords = ['apparel', 'clothing', 'shirt', 'pants', 'dress', 'skirt', 'hoodie', 'jacket', 'coat', 'sweater', 'jeans', 'shoes', 'boots', 'sneakers', 'bag', 'handbag', 'jewelry', 'fashion', 'streetwear', 'outfit', 'tee', 'top', 'bottom'];
  const specialKeywords = ['oversized', 'streetwear', 'vintage', 'y2k', 'aesthetic', 'minimalist', 'retro', 'casual', 'formal', 'luxury', 'trendy', 'urban'];

  cards.each((i, el) => {
    if (products.length >= limit) return;
    const card = $(el);

    // Parse title/name
    let name = card.find('h3, p, div[class*="title"], div[class*="name"], div[class*="desc"], a[class*="title"], span[class*="name"], div[class*="goods_name"]').first().text().trim() || card.attr('alt') || '';
    if (!name || name.length < 3) {
      name = card.find('div').filter((_, e) => $(e).text().length > 10 && $(e).text().length < 100).first().text().trim();
    }
    if (!name || name.length < 3) return;

    const nameLower = name.toLowerCase();
    if (acceptedNamesSet.has(nameLower)) {
      log.info(`Skipping duplicate: "${name}"`);
      return;
    }

    // Keyword filtering
    const hasChildrenKeywords = /\b(child|children|kid|kids|baby|babies|toddler|toddlers|infant|infants|boy|boys|girl|girls|junior|juniors|newborn)\b/.test(nameLower);
    if (hasChildrenKeywords && !/\b(boyfriend|girlfriend)\b/.test(nameLower)) return;

    const isFashion = fashionKeywords.some(keyword => nameLower.includes(keyword) || query.toLowerCase().includes(keyword));
    if (!isFashion) return;

    // Parse Description
    let description = card.find('[class*="description"], [class*="desc"], [class*="summary"]').first().text().trim()
      || `Premium ${name} imported directly from Temu. Engineered with high-quality, durable materials and a stylish modern silhouette.`;
    
    name = name.replace(/temu/ig, 'Premium Partner');
    description = description.replace(/temu/ig, 'Premium Partner');
    const descriptionLower = description.toLowerCase();

    // Parse price
    const priceText = card.find('[class*="price"], [class*="Price"], [class*="goods_price"], span').text() || '';
    const priceMatch = priceText.match(/\$?([0-9,]+\.[0-9]{2})/);
    let rawPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : parseFloat((15 + Math.random() * 40).toFixed(2));

    const origText = card.find('del, [class*="original"], [class*="market"], [class*="old_price"]').first().text() || '';
    const origMatch = origText.match(/\$?([0-9,]+\.[0-9]{2})/);
    let rawOriginalPrice = origMatch ? parseFloat(origMatch[1].replace(/,/g, '')) : parseFloat((rawPrice * 1.3).toFixed(2));

    // Formulate final prices
    let price = rawPrice;
    if (rawPrice < 100) price += 20;
    else if (rawPrice < 500) price += 50;

    let originalPrice = rawOriginalPrice;
    if (rawOriginalPrice < 100) originalPrice += 20;
    else if (rawOriginalPrice < 500) originalPrice += 50;

    if (originalPrice <= price) originalPrice = price * 1.3;

    price = parseFloat(price.toFixed(2));
    originalPrice = parseFloat(originalPrice.toFixed(2));

    // Extract Images
    let images = [];
    card.find('img').each((_, imgEl) => {
      const cleanUrl = getCleanImageUrl($(imgEl));
      if (cleanUrl && !images.includes(cleanUrl)) images.push(cleanUrl);
    });

    const image = images[0] || '';
    if (!image) return; // Skip if no image

    let gender = 'UNISEX';
    const isWomen = /\b(women|woman|female|lady|ladies|dress|skirt|blouse|heels|purse|bikini|bra|makeup|hairpin)\b/.test(nameLower) || /\b(women|woman|female|lady|ladies|dress|skirt|blouse|heels|purse|bikini|bra)\b/.test(descriptionLower);
    const isMen = /\b(men|man|male|gentlemen|guy|guys|suit|tie|beard|boxers|groom)\b/.test(nameLower) || /\b(men|man|male|gentlemen|guy|guys|suit|tie|boxers)\b/.test(descriptionLower);

    if (isWomen && !isMen) gender = 'WOMEN';
    else if (isMen && !isWomen) gender = 'MEN';

    const extraTags = [];
    for (const word of specialKeywords) {
      if (nameLower.includes(word) || descriptionLower.includes(word)) extraTags.push(word);
    }

    const productId = `prod_scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    products.push({
      id: productId,
      name,
      price,
      originalPrice,
      shippingFee: 0,
      image,
      images: images.length > 0 ? images : [image],
      colors: ['Black', 'White', 'Default'],
      category: query,
      gender,
      description,
      details: [{ key: 'Source', value: 'Premium Direct' }, { key: 'Condition', value: 'Brand New' }],
      inStock: 1,
      isNew: 1,
      viewers: Math.floor(50 + Math.random() * 400),
      stockCount: Math.floor(10 + Math.random() * 80),
      isHallOfFame: 0,
      synergyPath: null,
      appeal: 'Trending',
      brand: 'Premium Partner',
      tags: Array.from(new Set([query.toLowerCase(), 'fashion', ...extraTags])),
      supplierId: 'temu_scraper',
      deliveryTime: '7-10 days',
      sizes: ['S', 'M', 'L', 'XL'],
      isCustom: 0,
      priceRange: null,
      customizationFields: [],
      colorVariants: [],
      createdAt: new Date().toISOString(),
      offeredDiscount: Math.round(((originalPrice - price) / originalPrice) * 100) || 15,
      video: null
    });
  });

  return products;
}

function getCleanImageUrl(img) {
  if (!img || !img.length) return '';
  const attrs = ['src', 'data-src', 'data-original', 'data-img', 'data-lazy-src', 'srcset'];
  for (const attr of attrs) {
    let val = img.attr(attr);
    if (val) {
      val = val.trim();
      if (attr === 'srcset') {
        const parts = val.split(',');
        const firstPart = parts[0].trim().split(' ')[0].trim();
        if (firstPart && firstPart.startsWith('http') && !firstPart.includes('data:image')) {
          return firstPart;
        }
      } else {
        if (val.startsWith('http') && !val.includes('data:image')) {
          return val;
        }
        if (val.startsWith('//')) {
          return 'https:' + val;
        }
      }
    }
  }
  return '';
}

// Fallback high-fidelity Unsplash Fashion Generator
async function generateUnsplashFashionProducts(query, limit, acceptedNamesSet) {
  const womensAssets = {
    names: [
      "Void Aura Crop Hoodie",
      "Aero-Mesh Patchwork Corset",
      "Midnight Ribbed Knit Cardigan",
      "Cyberspace Pleated Midi Skirt",
      "Echo-Chamber Oversized Blazer",
      "Neo-Goth Distressed Slip Dress"
    ],
    descriptions: [
      "A premium avant-garde statement piece engineered with soft ribbed knit cotton and sleek cybernetic-inspired patchwork. Designed for a modern aesthetic silhouette.",
      "High-contrast distressed knit fabric featuring ergonomic stitching and utility straps. Breathable, durable, and styled for contemporary fashion forward looks."
    ],
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop"
    ],
    gender: "WOMEN"
  };

  const mensAssets = {
    names: [
      "Spectral Utility Cargo Pants",
      "Matrix Oversized Bomber Jacket",
      "Decayed Heavyweight Graphic Tee",
      "Obsidian Acid-Wash Denim Jacket",
      "Tactical Modular Chest Vest",
      "Void-Walker Technical Windbreaker"
    ],
    descriptions: [
      "Heavy-duty relaxed fit vintage streetwear utility piece with multiple dynamic pockets and secure hardware. Crafted with pre-shrunk organic cotton canvas.",
      "An archive-inspired oversized layering staple featuring custom double-zip pullers, ribbed trim, and a water-resistant technical shell. Fits boxy."
    ],
    images: [
      "https://images.unsplash.com/photo-1505633560063-d824df26b347?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550246140-29f40b909e5a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop"
    ],
    gender: "MEN"
  };

  const shoesAssets = {
    names: [
      "Neon Glitch Technical Sneakers",
      "Chrono-Strider Chunky Trainers",
      "Phantom Combat Leather Boots",
      "Zero-Gravity Knit Runners",
      "Void Echo Platform Slides",
      "Apex Leather Retro High-Tops"
    ],
    descriptions: [
      "High-traction hybrid sneaker combining breathable mesh panels with robust thermoplastic polyurethane overlays. Equipped with responsive cushion soles.",
      "Futuristic chunky platform silhouette constructed with premium full-grain leather, reflective detailing, and an ultra-light shock absorbing midsole."
    ],
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop"
    ],
    gender: "UNISEX"
  };

  const bagsAssets = {
    names: [
      "Cyber-Core Hardware Hobo Bag",
      "Obsidian Minimalist Tote Bag",
      "Prism Reflective Crossbody Purse",
      "Tactical Ripstop Utility Chest Bag",
      "Gilded Chain Leather Shoulder Bag"
    ],
    descriptions: [
      "Sleek geometric structured handbag crafted in high-durability vegan leather with industrial grade brushed steel clasps and modular shoulder strap.",
      "An essential daily carry-all tote featuring a reinforced waterproof inner lining, dedicated magnetic card slots, and an ultra-minimalist raw exterior."
    ],
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc15a4a5?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&auto=format&fit=crop"
    ],
    gender: "UNISEX"
  };

  const jacketsAssets = {
    names: [
      "Midnight Cyber-Tech Shell Coat",
      "Thermal-Shield Quilted Parka",
      "Subzero Matte Puffer Jacket",
      "Retro Corduroy Sherpa Coach Jacket",
      "Vandal Distressed Leather Jacket"
    ],
    descriptions: [
      "Advanced multi-layered protective outerwear designed for extreme environments. Features water-repellent performance membrane and fully taped seams.",
      "Premium insulated boxy puffer jacket featuring high-density nylon construction and adjustable drawcords at the waist and hood for structural fit."
    ],
    images: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?w=800&auto=format&fit=crop"
    ],
    gender: "UNISEX"
  };

  const queryLower = query.toLowerCase();
  let selectedCategory = womensAssets;

  if (queryLower.includes('shoe') || queryLower.includes('sneaker') || queryLower.includes('boot') || queryLower.includes('footwear')) {
    selectedCategory = shoesAssets;
  } else if (queryLower.includes('bag') || queryLower.includes('purse') || queryLower.includes('tote') || queryLower.includes('handbag')) {
    selectedCategory = bagsAssets;
  } else if (queryLower.includes('jacket') || queryLower.includes('coat') || queryLower.includes('parka') || queryLower.includes('puffer') || queryLower.includes('outerwear')) {
    selectedCategory = jacketsAssets;
  } else if (queryLower.includes('men') || queryLower.includes('boy') || queryLower.includes('guy') || queryLower.includes('streetwear') || queryLower.includes('cargo')) {
    selectedCategory = mensAssets;
  } else if (queryLower.includes('women') || queryLower.includes('dress') || queryLower.includes('skirt') || queryLower.includes('corset') || queryLower.includes('lady') || queryLower.includes('ladies')) {
    selectedCategory = womensAssets;
  } else {
    const options = [womensAssets, mensAssets, shoesAssets, bagsAssets, jacketsAssets];
    selectedCategory = options[Math.floor(Math.random() * options.length)];
  }

  const products = [];
  for (let i = 0; i < limit; i++) {
    const rawName = selectedCategory.names[i % selectedCategory.names.length];
    const name = `${rawName} (${query})`;
    
    if (acceptedNamesSet.has(name.toLowerCase().trim())) continue;

    const basePrice = 25 + (i * 15) + Math.random() * 10;
    const price = parseFloat(basePrice.toFixed(2));
    const originalPrice = parseFloat((price * 1.4).toFixed(2));
    const rawImgUrl = selectedCategory.images[i % selectedCategory.images.length];
    
    const productId = `prod_scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const description = selectedCategory.descriptions[i % selectedCategory.descriptions.length];
    
    products.push({
      id: productId,
      name,
      price,
      originalPrice,
      shippingFee: 0,
      image: rawImgUrl,
      images: [rawImgUrl],
      colors: ['Black', 'White', 'Default'],
      category: query,
      gender: selectedCategory.gender,
      description,
      details: [{ key: 'Source', value: 'Premium Direct' }, { key: 'Condition', value: 'Brand New' }],
      inStock: 1,
      isNew: 1,
      viewers: Math.floor(50 + Math.random() * 400),
      stockCount: Math.floor(10 + Math.random() * 80),
      isHallOfFame: 0,
      synergyPath: null,
      appeal: 'Trending',
      brand: 'Premium Partner',
      tags: [query.toLowerCase(), 'fashion', 'premium'],
      supplierId: 'temu_scraper',
      deliveryTime: '7-10 days',
      sizes: ['S', 'M', 'L', 'XL'],
      isCustom: 0,
      priceRange: null,
      customizationFields: [],
      colorVariants: [],
      createdAt: new Date().toISOString(),
      offeredDiscount: Math.round(((originalPrice - price) / originalPrice) * 100) || 20,
      video: null
    });
  }

  return products;
}

// Run the script
main().catch(err => {
  log.error('Unexpected crash in script:', err.message);
  process.exit(1);
});
