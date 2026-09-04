import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import sharp from 'sharp';

const CLOTHES_DIR = path.join(process.cwd(), 'clothes');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

function escapeSql(txt: string): string {
  return txt.replace(/'/g, "''");
}

function calculateOriginalPrice(price: number): number {
  // Markup by ~30% max, discount will be (Original - Price) / Original ~ 23%
  return Math.round(price * 1.3);
}

function generateDescription(name: string, category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('footwear') || cat.includes('footware')) {
    return `${name}. Engineered for comfort, visual presence, and elite streetwear aesthetics. Features premium cushioning and high-traction durability. Sourced for our exclusive Drop Series - highly limited edition release with zero restocks.`;
  } else if (cat.includes('accessories')) {
    return `The ${name}. Exquisite detailing, pristine craft, and unparalleled presence. A defining styling piece designed to instantly elevate any streetwear or editorial fit. Extremely rare drop. Only limited quantities copped.`;
  } else {
    return `The ultra-premium ${name}. Tailored fits, breathable comfort, and a confident streetwear silhouette. Sourced with durable high-grade threads designed to maintain its shape and aesthetic under high daily use. Strictly individual drop - copping means exclusivity.`;
  }
}

async function run() {
  console.log('Connecting to database...');
  const db = new Database(DB_PATH);

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  if (!fs.existsSync(CLOTHES_DIR)) {
    console.error(`Clothes directory does not exist at ${CLOTHES_DIR}. Terminating.`);
    process.exit(0);
  }

  const finalProducts: any[] = [];
  const categories = fs.readdirSync(CLOTHES_DIR).filter(file => fs.statSync(path.join(CLOTHES_DIR, file)).isDirectory());

  for (const categoryFolder of categories) {
    const categoryPath = path.join(CLOTHES_DIR, categoryFolder);
    const itemFolders = fs.readdirSync(categoryPath).filter(file => fs.statSync(path.join(categoryPath, file)).isDirectory());

    const capCategory = categoryFolder === 'footware' ? 'Footwear' : categoryFolder.charAt(0).toUpperCase() + categoryFolder.slice(1);

    for (const folder of itemFolders) {
      const physicalDir = path.join(categoryPath, folder);
      const dataTxtPath = path.join(physicalDir, 'data.txt');

      if (!fs.existsSync(dataTxtPath)) {
        console.log(`Skipping folder missing data.txt: ${physicalDir}`);
        continue;
      }

      const dataTxtContent = fs.readFileSync(dataTxtPath, 'utf8');
      
      // Parse data.txt
      let name = 'Quality Item';
      let price = 100;
      let sizes: string[] = [];

      dataTxtContent.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim().toLowerCase();
          const val = parts.slice(1).join(':').trim();
          if (key === 'name') name = val;
          if (key === 'price') price = parseFloat(val.replace(/[^0-9.]/g, '')) || 100;
          if (key === 'size' || key === 'sizes') sizes = val.split(',').map(s => s.trim());
        }
      });

      // Find all images
      const files = fs.readdirSync(physicalDir);
      const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png|webp|gif)$/i));

      let idx = 1;
      for (const imgName of imageFiles) {
        const imgPath = path.join(physicalDir, imgName);
        
        // Convert and Move to standard dir
        const timestamp = Date.now() + Math.floor(Math.random() * 10000);
        const webpFilename = `ck_${categoryFolder}_${folder}_${idx}_${timestamp}.webp`;
        const webpAbsPath = path.join(UPLOADS_DIR, webpFilename);

        console.log(`Processing ${imgName} -> ${webpFilename}...`);
        
        try {
          // Resize and compress
          await sharp(imgPath)
            .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(webpAbsPath);
        } catch (err) {
          console.error(`Failed to convert image ${imgPath}.`, err);
          continue;
        }

        const primaryImgPath = `/uploads/products/${webpFilename}`;
        const prodId = `ck_${categoryFolder}_${folder}_s${idx}_${timestamp}`;

        const brand = name.split(' ')[0] || 'Original';
        const tags = Array.from(new Set(['LIMITED', 'EXCLUSIVE', capCategory.toUpperCase()]));
        
        const originalPrice = calculateOriginalPrice(price);
        const stockCount = Math.floor(Math.random() * 9) + 2; // [2, 10]
        const hypeScore = Math.floor(Math.random() * 21) + 78;
        const velocityScore = Math.floor(Math.random() * 19) + 80;
        const viewers = Math.floor(Math.random() * 35) + 8;

        const product = {
          id: prodId,
          name: name,
          price: price,
          originalPrice: originalPrice,
          shippingFee: 0,
          image: primaryImgPath,
          category: capCategory,
          gender: 'UNISEX',
          description: name,
          details: JSON.stringify([]),
          inStock: 1,
          isNew: 1,
          viewers: viewers,
          stockCount: stockCount, // <= 11
          hypeScore: hypeScore,
          velocityScore: velocityScore,
          isHallOfFame: Math.random() > 0.85 ? 1 : 0,
          synergyPath: 'STYLE_LINE_DROP',
          appeal: 'Highly exclusive variant drop',
          brand: brand,
          tags: JSON.stringify(tags),
          deliveryTime: '3-7 days',
          sizes: JSON.stringify(sizes),
          isCustom: 0,
          images: JSON.stringify([primaryImgPath]),
          colors: JSON.stringify([]),
          colorVariants: JSON.stringify([]),
          createdAt: new Date().toISOString(),
          offeredDiscount: Math.round(((originalPrice - price) / originalPrice) * 100), // Max 30% check
          video: null
        };

        if (product.offeredDiscount > 30) product.offeredDiscount = 30;

        finalProducts.push(product);
        idx++;
      }
    }
  }

  console.log(`Prepared ${finalProducts.length} final products to insert.`);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, price, originalPrice, shippingFee, image, category, gender, description, details,
      inStock, isNew, viewers, stockCount, hypeScore, velocityScore, isHallOfFame, synergyPath,
      appeal, brand, tags, deliveryTime, sizes, isCustom, images, colors, colorVariants, createdAt,
      offeredDiscount, video
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  console.log('Populating SQLite Database sqlite3...');
  db.transaction(() => {
    for (const p of finalProducts) {
      insertStmt.run(
        p.id, p.name, p.price, p.originalPrice, p.shippingFee, p.image, p.category, p.gender, p.description, p.details,
        p.inStock, p.isNew, p.viewers, p.stockCount, p.hypeScore, p.velocityScore, p.isHallOfFame, p.synergyPath,
        p.appeal, p.brand, p.tags, p.deliveryTime, p.sizes, p.isCustom, p.images, p.colors, p.colorVariants, p.createdAt,
        p.offeredDiscount, p.video
      );
    }
  })();

  console.log('Successfully written product records. Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
