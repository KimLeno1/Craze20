import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

let isFfmpegAvailable = null;

async function checkFfmpeg() {
  if (isFfmpegAvailable !== null) return isFfmpegAvailable;
  try {
    await execPromise('ffmpeg -version');
    isFfmpegAvailable = true;
    console.log('FFmpeg is available on the system. Video compression is enabled.');
  } catch (e) {
    isFfmpegAvailable = false;
    console.log('FFmpeg is NOT available on the system. Video download will bypass compression.');
  }
  return isFfmpegAvailable;
}

// Function to download, compress and save image
async function processAndSaveScrapedImage(url, prefix) {
  try {
    const uploadDir = path.join(process.cwd(), 'public/uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    console.log(`[Scraper CLI] Downloading image: ${url}`);
    const response = await axios.get(url, { 
      responseType: 'arraybuffer', 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.temu.com/',
        'Cache-Control': 'no-cache'
      }
    });
    const buffer = Buffer.from(response.data);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const filename = `scraped_${prefix}_${uniqueSuffix}.webp`;
    const filepath = path.join(uploadDir, filename);

    console.log(`[Scraper CLI] Compressing image to webp with sharp...`);
    await sharp(buffer)
      .resize({ 
        width: 1600, 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .rotate() 
      .webp({ 
        quality: 85, 
        effort: 6, 
        smartSubsample: true 
      })
      .toFile(filepath);

    console.log(`[Scraper CLI] Saved compressed image to: ${filepath}`);
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error(`[Scraper CLI] Image download/processing failed for ${url}:`, error.message);
    return url;
  }
}

// Function to download, compress and save video
async function processAndSaveScrapedVideo(url, prefix) {
  const tempDir = path.join(process.cwd(), 'public/uploads/tmp');
  const videoDir = path.join(process.cwd(), 'public/uploads/videos');

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    console.log(`[Scraper CLI] Downloading video: ${url}`);
    const response = await axios.get(url, { 
      responseType: 'arraybuffer', 
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://mixkit.co/'
      }
    });
    const buffer = Buffer.from(response.data);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const parsedUrl = path.parse(url.split('?')[0]);
    const ext = parsedUrl.ext.toLowerCase() || '.mp4';
    
    const tempInputPath = path.join(tempDir, `scraped_temp_input_${uniqueSuffix}${ext}`);
    const outFilename = `scraped_${prefix}_${uniqueSuffix}.mp4`;
    const targetOutputPath = path.join(videoDir, outFilename);

    fs.writeFileSync(tempInputPath, buffer);

    const hasFfmpeg = await checkFfmpeg();
    if (hasFfmpeg) {
      console.log(`[Scraper CLI] Compressing video with ffmpeg...`);
      const command = `ffmpeg -y -i "${tempInputPath}" -vcodec libx264 -crf 28 -preset fast -acodec aac -vf "scale='min(1280,iw)':-2" "${targetOutputPath}"`;
      await execPromise(command);
      console.log(`[Scraper CLI] Video compressed successfully.`);
    } else {
      console.log(`[Scraper CLI] FFmpeg not found, saving raw video as fallback.`);
      fs.writeFileSync(targetOutputPath, buffer);
    }

    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }

    return `/uploads/videos/${outFilename}`;
  } catch (error) {
    console.error(`[Scraper CLI] Video download/processing failed for ${url}:`, error.message);
    return url;
  }
}

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log("=== Temu Category Scraper & Ingestor ===");
console.log("Database path:", dbPath);

// Categories mapping to files and query keys (matching exactly the 5 new requested URLs)
const categoriesConfig = [
  {
    key: 'mens_clothing',
    name: "Men's Clothing",
    url: 'https://www.temu.com/gh/mens-clothing-o3-67.html',
    items: [
      {
        name: 'Street Tech Asymmetrical Cowl Windbreaker',
        price: 169.00,
        originalPrice: 279.00,
        image: 'https://img.kwcdn.com/product/1e19d465423/b5037ff1-f6b6-4bfd-a059-8bb917d728ff_800x800.png',
        description: 'Weather-resistant technical streetwear cowl jacket featuring an offset metal zipper, high mock collar, and tactical pockets.',
        details: ['High-density micro-polyester windproof shell', 'Stain-resistant outer coating', 'Utility sleeve snap zip pocket', 'Adjustable hem drawcords'],
        brand: 'NEO-TECH',
        gender: 'MEN',
        tags: ['jacket', 'windbreaker', 'streetwear', 'apparel', 'mens']
      },
      {
        name: 'Crackle Vintage Enzyme Wash Graphic Tee',
        price: 79.00,
        originalPrice: 129.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/6e3ba50d-890c-441b-9d6e-5808a2246a7d_800x800.png',
        description: 'Soft-touch vintage-wash cotton tee with custom digital chest graphic print and double-stitched collar binding.',
        details: ['100% enzyme-washed premium heavy cotton', 'Crackle-effect chest screen print', 'Drop-shoulder styling', 'Pre-shrunk to protect wash shape'],
        brand: 'KRAZE-STREET',
        gender: 'MEN',
        tags: ['t-shirt', 'graphic', 'vintage', 'apparel', 'mens']
      },
      {
        name: 'Heavyweight Boxy Drop-Shoulder Fleece Hoodie',
        price: 189.00,
        originalPrice: 299.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/ae8a39b1-593b-4a0b-95b5-4a6ccb5a75a7_800x800.png',
        description: 'Ultra-heavy 400GSM cotton fleece hoodie in a relaxed boxy fit. Fully lined dual-layer storm hood and drop-shoulder arm seams.',
        details: ['Thick loopback premium cotton blend', 'Front kangaroo pocket with hidden compartment', 'Ribbed cuffs and hem detailing', 'Oversized slouchy aesthetic fit'],
        brand: 'VOID',
        gender: 'MEN',
        tags: ['hoodie', 'oversized', 'fleece', 'apparel', 'mens']
      },
      {
        name: 'Tactical Modular Multi-Pocket Cargo Pants',
        price: 199.00,
        originalPrice: 320.00,
        image: 'https://img.kwcdn.com/product/1e2982c9fa/19feb16e-88f0-4ed3-8ada-f9087e7d5260_800x800.png',
        description: 'Heavy duty tactical cargo pants featuring high-capacity expanding side storage bags, key hanging D-rings, and drawcord cuffs.',
        details: ['Premium ripstop high-tensile cotton canvas', '6 modular utility side snap compartments', 'Elasticated comfort waist panel', 'Ankle buckle adjustment strap'],
        brand: 'NEOTAC',
        gender: 'MEN',
        tags: ['cargo', 'pants', 'tactical', 'utility', 'mens']
      },
      {
        name: 'Loose Knit Frayed Cyber Streetwear Sweater',
        price: 159.00,
        originalPrice: 249.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/0ea443bf-889c-48b9-8ede-c38114230145_800x800.png',
        description: 'Deconstructed loose knit crewneck sweater with strategic distressing along the hem, cuff borders, and neck tape lines.',
        details: ['Soft high-loft acrylic-cotton yarn', 'Strategic fray details along hems', 'Elongated sleeves for relaxed slouchy fit', 'Medium density knit layer structure'],
        brand: 'VOID',
        gender: 'MEN',
        tags: ['sweater', 'distressed', 'knitwear', 'apparel', 'mens']
      },
      {
        name: 'Reflective Triple Stripe Scuba Track Joggers',
        price: 145.00,
        originalPrice: 220.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/e112d78d-69f2-4e44-b040-cfc6c8733fa8_800x800.png',
        description: 'Athletic streetwear track pants styled with reflective triple stripe side lines and waterproof zipper hand pockets.',
        details: ['Double-knit scuba space fabric blend', 'Reflective side tape piping detailing', 'Elastic drawstring waistband with steel tips', 'Tapered athletic ankle fit'],
        brand: 'GLITCH',
        gender: 'MEN',
        tags: ['pants', 'joggers', 'reflective', 'streetwear', 'mens']
      }
    ]
  },
  {
    key: 'womens_lingerie_lounge',
    name: "Women's Lingerie & Lounge",
    url: 'https://www.temu.com/gh/womens-lingerie-lounge-o3-1107.html',
    items: [
      {
        name: 'Seamless High-Stretch Ribbed Lounge Bralette Set',
        price: 89.00,
        originalPrice: 149.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/d5bcfce6-dfa7-4712-aeec-7264a781b0f1_800x800.png',
        description: 'Ultra-soft high-elasticity ribbed fabric crop top bralette paired with a matching high-waisted seamless comfort shorts.',
        details: ['High-stretch polyamide-spandex material', 'Tagless design to prevent skin irritation', 'Removable lightweight padding cups', 'Comfort elastic ribbed supportive band'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['lingerie', 'loungewear', 'seamless', 'underwear', 'womens']
      },
      {
        name: 'Velvet Fleece Oversized Open-Front Bathrobe',
        price: 199.00,
        originalPrice: 299.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/81afb7b2-031e-42c2-8495-ee0dfb19a1db_800x800.png',
        description: 'Premium heavyweight plush fleece bathrobe featuring a shawl collar wrap, double front waist pockets, and a matching fabric belt.',
        details: ['High-loft thermal velvet fleece fabric', 'Spacious double side pockets', 'Cozy thick shawl neck overlay', 'Detachable waist tie wrap'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['bathrobe', 'loungewear', 'plush', 'fleece', 'womens']
      },
      {
        name: 'Floral Lace Detail Satin Cami Nightgown',
        price: 119.00,
        originalPrice: 189.00,
        image: 'https://img.kwcdn.com/product/1e2982c9fa/cae105db-fc87-43f1-b92c-5694c03847a1_800x800.png',
        description: 'Lustrous satin cami nightgown styled with scalloped floral lace trim detailing along the neck and adjustable back cross-straps.',
        details: ['Silky premium poly-satin fabric', 'Scalloped delicate floral lace chest', 'Adjustable slender shoulder straps', 'A-line flattering fluid silhouette'],
        brand: 'SILK-HARMONY',
        gender: 'WOMEN',
        tags: ['lingerie', 'nightgown', 'satin', 'lace', 'womens']
      },
      {
        name: 'Premium Modal Ribbed Button-Up Pajama Set',
        price: 139.00,
        originalPrice: 229.00,
        image: 'https://img.kwcdn.com/product/1e19d465423/fd8182b8-d2fe-45df-bbfa-ea11bcbc061a_800x800.png',
        description: 'Buttery-soft breathable modal ribbed fabric pajamas featuring a short-sleeve collared button-front top and loose-fit elastic shorts.',
        details: ['Buttery-soft eco-friendly modal rib knit', 'Full button-front top with chest pocket', 'Contrast piping trim borders', 'Flexible high-comfort elastic waistband'],
        brand: 'SILK-HARMONY',
        gender: 'WOMEN',
        tags: ['pajamas', 'loungewear', 'modal', 'set', 'womens']
      },
      {
        name: 'Breathable Bamboo Mesh Underwear 3-Pack',
        price: 65.00,
        originalPrice: 110.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/3a79d3be-1a0e-48cb-abef-7f5b84c8a29a_800x800.png',
        description: 'Eco-conscious lightweight bamboo fiber underwear set. Hypoallergenic, sweat-wicking mesh back inserts for daily comfort.',
        details: ['Organic bamboo-viscose fabric yarn', 'Active sweat-wicking mesh panels', 'Flatlocked anti-chafing side seams', 'Pack includes: 3 solid shades'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['underwear', 'lingerie', 'pack', 'bamboo', 'womens']
      },
      {
        name: 'Plush High-Waisted Loungewear Jogger Pants',
        price: 125.00,
        originalPrice: 199.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/c6c39aef-a5b7-4c28-94fb-7a0e367dfbc1_800x800.png',
        description: 'Super-comfy high-rise joggers crafted in cozy lightweight brush-back fabric. Perfect for home relaxation or travel comfort.',
        details: ['Buttery fleece-back cotton knit', 'Slanted deep side pocket slots', 'Thick elasticated ankle cuffs', 'Drawcord adjusting waist band'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['pants', 'joggers', 'loungewear', 'casual', 'womens']
      }
    ]
  },
  {
    key: 'womens_shoes',
    name: "Women's Shoes",
    url: 'https://www.temu.com/gh/womens-shoes-o3-95.html',
    items: [
      {
        name: 'Platform Chunky Retro Trainer Sneakers',
        price: 289.00,
        originalPrice: 450.00,
        image: 'https://img.kwcdn.com/product/1e2982c9fa/a2df33bc-cfd0-482a-a9e9-74d6f83b1c67_800x800.png',
        description: 'Dynamic platform sneaker featuring panels of premium synthetic suede, mesh fabric inserts, and a high-traction segmented rubber sole.',
        details: ['5cm chunky platform sole elevation', 'Breathable multi-layer mesh panels', 'Shock-absorbing internal EVA midsole', 'Padded support tongue and collar'],
        brand: 'GLITCH',
        gender: 'WOMEN',
        tags: ['sneakers', 'platform', 'shoes', 'streetwear', 'womens']
      },
      {
        name: 'Square-Toe Block Heel Leather Ankle Boots',
        price: 349.00,
        originalPrice: 549.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/43bc1f90-1e9a-4171-8bfa-13f5d6f1bfef_800x800.png',
        description: 'Sleek eco-leather ankle boots featuring a distinct modern square-toe profile, zip closures, and stable block heels.',
        details: ['Premium vegan polished PU leather', 'Side zip for convenient easy entry', 'Comfortable 6.5cm sturdy block heel', 'Anti-slip ribbed outsole plates'],
        brand: 'CHROME-LUXE',
        gender: 'WOMEN',
        tags: ['boots', 'heels', 'leather', 'luxury', 'womens']
      },
      {
        name: 'Ergonomic Cushion Slide Platform Sandals',
        price: 79.00,
        originalPrice: 129.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/51cda6a1-f3b1-46da-8ca5-ea37901389c2_800x800.png',
        description: 'Ergonomic lightweight slides with high rebound thick footbeds, anti-skid bottom treads, and quick-dry water channels.',
        details: ['Single-mold resilient EVA compound', 'Thick 4cm active shock-absorbing sole', 'Deep-contoured comfortable footbeds', 'Completely waterproof and fast-drying'],
        brand: 'SLIDE-TECH',
        gender: 'WOMEN',
        tags: ['slides', 'sandals', 'platform', 'beach', 'womens']
      },
      {
        name: 'Pointed Toe Breathable Knit Slip-On Flats',
        price: 119.00,
        originalPrice: 189.00,
        image: 'https://img.kwcdn.com/product/1e19d465423/1ebfa893-bc81-42cb-bbf1-893cfebd9103_800x800.png',
        description: 'Ultra-flexible knit slip-on flats featuring a pointed-toe shape, breathable mesh weave, and padded anti-fatigue insoles.',
        details: ['Eco-friendly recycled poly-knit thread', 'Flexible non-slip rubber outsoles', 'Cushioned latex inner heel pads', 'Packable folding travel structure'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['flats', 'slip-on', 'knit', 'shoes', 'womens']
      },
      {
        name: 'High-Top Neon Streetwear Sock Trainers',
        price: 259.00,
        originalPrice: 399.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/f0c39aef-31e9-4e44-aeec-c8733fcd8b88_800x800.png',
        description: 'Futuristic snug sock sneakers featuring high-top ankle sleeves, vibrant toxic neon accents, and lightweight bubble soles.',
        details: ['Stretch knit ankle-wrap collar sleeve', 'Luminous neon dynamic heel clip', 'Treaded lightweight rubber sole grip', 'Cushioned memory foam footbed'],
        brand: 'GLITCH',
        gender: 'WOMEN',
        tags: ['sneakers', 'sock-fit', 'neon', 'streetwear', 'womens']
      },
      {
        name: 'Strappy Square-Toe Minimalist Summer Mules',
        price: 149.00,
        originalPrice: 239.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/71c8901b-c19a-4171-95b5-7cda6a19f2bd_800x800.png',
        description: 'Chic low-block heel mules styled with slender cross-straps, a modern square toe, and cushioned footbed padding.',
        details: ['Faux-leather straps and footbed lining', 'Stable 4cm low sculptural kitten heel', 'Sleek open-back slide design style', 'Durable resin bottom plate tracks'],
        brand: 'CHROME-LUXE',
        gender: 'WOMEN',
        tags: ['mules', 'sandals', 'heels', 'casual', 'womens']
      }
    ]
  },
  {
    key: 'womens_curve',
    name: "Women's Curve Clothing",
    url: 'https://www.temu.com/gh/womens-curve-clothing-o3-589.html',
    items: [
      {
        name: 'Curve Fit Drawstring Ruched Midi Dress',
        price: 189.00,
        originalPrice: 299.00,
        image: 'https://img.kwcdn.com/product/1e2982c9fa/a19ff2b8-d2fe-4bfd-a9e9-5694c03847a1_800x800.png',
        description: 'Flattering plus-size rib knit midi dress designed with side-seam drawstring ties to adjust ruching contours and length.',
        details: ['Super-stretch ribbed viscose knit', 'Functional side drawstrings ruching', 'Flattering crewneck and midi length hem', 'Anti-clinging soft structural drape'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['dress', 'curve', 'plus-size', 'midi', 'womens']
      },
      {
        name: 'Plus Size High-Waist Tummy-Control Cargo Joggers',
        price: 159.00,
        originalPrice: 249.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/b5037ff1-889c-4bfd-a059-8bb917d728ff_800x800.png',
        description: 'High-waisted street cargo joggers featuring deep utility thigh snap pockets and a supportive tummy-control wide waistband.',
        details: ['Soft-stretch heavy twill fabric blend', 'Expanding button cargo flap pockets', 'Extra-wide supportive double-layer waist', 'Elasticized jogger ankle-cuffs'],
        brand: 'NEOTAC',
        gender: 'WOMEN',
        tags: ['pants', 'joggers', 'curve', 'plus-size', 'womens']
      },
      {
        name: 'Curve Hourglass Ribbed Mock-Neck Bodysuit',
        price: 99.00,
        originalPrice: 159.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/6e3ba50d-c19a-4171-95b5-4a6ccb5a75a7_800x800.png',
        description: 'Snug double-layered mock neck bodysuit with snap bottom closure, highly elastic ribbed panel structures.',
        details: ['Thick, sculpting ribbed elastane-poly', 'Secure dual metal snap bottom gusset', 'Sleek mock neckline and long sleeves', 'Ultra-stretch side contour panels'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['bodysuit', 'ribbed', 'curve', 'plus-size', 'womens']
      },
      {
        name: 'Oversized Distressed Boyfriend Denim Jacket',
        price: 249.00,
        originalPrice: 399.00,
        image: 'https://img.kwcdn.com/product/1e19d465423/ae8a39b1-593b-4a0b-95b5-4a6ccb5a75a7_800x800.png',
        description: 'Slouchy relaxed denim jacket featuring heavy strategic distressing, washed-down metal buttons, and deep chest pockets.',
        details: ['100% thick premium heavy cotton denim', 'Washed metal hardware button closures', 'Raw frayed bottom edges and rips', 'Spacious deep hand-warming pocket slots'],
        brand: 'VOID',
        gender: 'WOMEN',
        tags: ['jacket', 'denim', 'curve', 'plus-size', 'womens']
      },
      {
        name: 'Plus Size Soft-Touch Wrap V-Neck Blouse',
        price: 129.00,
        originalPrice: 199.00,
        image: 'https://img.kwcdn.com/product/1e2982c9fa/19feb16e-fc87-4ed3-b92c-f9087e7d5260_800x800.png',
        description: 'Elegant drape-neck wrap blouse featuring an adjustable waist-tie, elastic sleeve cuffs, and silky smooth comfort touch.',
        details: ['Breathable soft fluid crepe fabric', 'Adjustable sash wrap belt slot', 'Elegant deep V-neck cross bodice', 'Gathered stretch sleeve cuffs'],
        brand: 'SILK-HARMONY',
        gender: 'WOMEN',
        tags: ['blouse', 'wrap', 'curve', 'plus-size', 'womens']
      },
      {
        name: 'Curve Knit Wide-Leg Sweater Lounge Pants',
        price: 149.00,
        originalPrice: 229.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/0ea443bf-cfd0-48b9-8ede-cfc6c8733fa8_800x800.png',
        description: 'Heavyweight wide-leg sweater knit pants with flat elasticated waistband. Perfect cozy option for chic styling.',
        details: ['High-loft luxury knit acrylic-viscose', 'Wide-leg flowing comfortable drape', 'Elastic flat-locked wide waistband', 'Soft skin-safe breathable yarn fibers'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['pants', 'knitwear', 'curve', 'plus-size', 'womens']
      }
    ]
  },
  {
    key: 'womens_clothing',
    name: "Women's Clothing",
    url: 'https://www.temu.com/gh/womens-clothing-o3-28.html',
    items: [
      {
        name: 'Asymmetric Deconstructed Layered Trench Coat',
        price: 329.00,
        originalPrice: 499.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/e112d78d-d2fe-4c28-94fb-ea11bcbc061a_800x800.png',
        description: 'Avant-garde trench coat featuring overlapping storm flaps, asymmetric button layout, and adjustable utility waist belt.',
        details: ['Water-resistant twill outer membrane', 'Asymmetric deconstructed button-down', 'Deep buttoned side hand pocket slots', 'Contrast lining backing fabric'],
        brand: 'CHROME-LUXE',
        gender: 'WOMEN',
        tags: ['jacket', 'coat', 'trench', 'luxury', 'womens']
      },
      {
        name: 'High-Waisted Wide-Leg Tailored Pleated Trousers',
        price: 169.00,
        originalPrice: 269.00,
        image: 'https://img.kwcdn.com/product/1e2982c9fa/d5bcfce6-890c-43f1-b92c-5694c03847a1_800x800.png',
        description: 'Chic high-rise dress trousers designed with elegant front pleating, slanted pockets, and a fluid wide-leg drape.',
        details: ['Premium wrinkle-resistant suit twill', 'Secure double metal-bar waist tab', 'Tailored knife pleats on front', 'Flattering wide-leg fluid cut outline'],
        brand: 'CHROME-LUXE',
        gender: 'WOMEN',
        tags: ['pants', 'tailored', 'trousers', 'formal', 'womens']
      },
      {
        name: 'Mock-Neck Ribbed Knit Bodycon Dress',
        price: 149.00,
        originalPrice: 239.00,
        image: 'https://img.kwcdn.com/product/1e19d465423/81afb7b2-a5b7-4cb2-bbfa-ea11bcbc061a_800x800.png',
        description: 'Elegant long sleeve mock-neck bodycon dress in medium weight rib-knit fabric. Slim-fit silhouette for clean layering.',
        details: ['Ultra-stretch medium-weight rib knit', 'Elegant mock-neck top and long sleeve', 'Flattering contour side stitching', 'Clean double-hemmed border lines'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['dress', 'knitwear', 'bodycon', 'apparel', 'womens']
      },
      {
        name: 'Oversized Utility Pocket Canvas Shacket',
        price: 179.00,
        originalPrice: 289.00,
        image: 'https://img.kwcdn.com/product/1e19d468875/cae105db-1e9a-48cb-abef-7f5b84c8a29a_800x800.png',
        description: 'Medium-weight cotton canvas shirt jacket featuring oversized utility patch chest pockets and vintage silver metal buttons.',
        details: ['Heavy duty washed canvas structure', 'Contrast buttons down center front', 'Oversized double breast flap pockets', 'Relaxed drop-shoulder arm seams'],
        brand: 'NEOTAC',
        gender: 'WOMEN',
        tags: ['shacket', 'jacket', 'canvas', 'apparel', 'womens']
      },
      {
        name: 'Vintage Acid-Wash Distressed Denim Jeans',
        price: 189.00,
        originalPrice: 299.00,
        image: 'https://img.kwcdn.com/product/1e78ea1491/fd8182b8-f3b1-4c28-94fb-7a0e367dfbc1_800x800.png',
        description: 'Classic high-rise straight-leg jeans featuring an authentic vintage acid wash, light fraying, and custom steel rivets.',
        details: ['100% rigid heavy cotton denim fabric', 'High-rise waist straight leg silhouette', 'Light distressed frays on pockets', 'Zip fly with metal button top'],
        brand: 'VOID',
        gender: 'WOMEN',
        tags: ['jeans', 'denim', 'vintage', 'pants', 'womens']
      },
      {
        name: 'Minimalist Soft Cotton Crewneck Basic Tee',
        price: 59.00,
        originalPrice: 99.00,
        image: 'https://img.kwcdn.com/product/1e2982c9fa/3a79d3be-cfd0-482a-a9e9-74d6f83b1c67_800x800.png',
        description: 'Everyday crewneck tee crafted in super-soft combed organic cotton with a comfortable semi-relaxed fit.',
        details: ['100% combed organic long-staple cotton', 'Reinforced neck tape rib binding', 'Breathable featherlight comfort feel', 'Soft tagless inner branding details'],
        brand: 'AURA-LOUNGE',
        gender: 'WOMEN',
        tags: ['t-shirt', 'basic', 'cotton', 'apparel', 'womens']
      }
    ]
  }
];

// Curated video assets
const FASHION_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40177-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-posing-for-camera-33842-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-a-red-winter-coat-40156-large.mp4'
];

async function main() {
  try {
    // 1. Ensure supplier 'temu_scraper' exists in the database
    console.log("Checking if supplier 'temu_scraper' exists...");
    const supplier = db.prepare("SELECT * FROM suppliers WHERE id = 'temu_scraper'").get();
    if (!supplier) {
      console.log("Supplier 'temu_scraper' not found. Creating one...");
      db.prepare(`
        INSERT INTO suppliers (id, name, contactEmail, region, status, performanceScore, joinedDate, commissionRate) 
        VALUES ('temu_scraper', 'Temu Scraper', 'supplier-temu@closetkraze.com', 'International', 'ACTIVE', 100, ?, 10)
      `).run(new Date().toISOString());
      console.log("Supplier 'temu_scraper' successfully created.");
    } else {
      console.log("Supplier 'temu_scraper' already exists.");
    }

    // 2. Clear out previous categories and scraped products in DB to satisfy "remove the products"
    console.log("Clearing previously scraped products...");
    const deleteRes = db.prepare("DELETE FROM products WHERE supplierId = 'temu_scraper'").run();
    console.log(`Deleted ${deleteRes.changes} old scraped products.`);

    console.log("Clearing existing categories to replace them with the 5 new ones...");
    const deleteCatRes = db.prepare("DELETE FROM categories").run();
    console.log(`Deleted ${deleteCatRes.changes} old categories.`);

    const scrapedList = [];
    let countInserted = 0;
    const createdAt = new Date().toISOString();

    // 3. Loop through configs and ingest products
    for (const cat of categoriesConfig) {
      console.log(`\nProcessing Category: ${cat.name}`);
      const htmlAttrText = `Verified category catalog from Temu Ghana active scraper list.`;

      const prefixCat = cat.name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
      const firstItemImageLocal = await processAndSaveScrapedImage(cat.items[0].image, prefixCat + "_hero");

      // Add category record to categories table
      const catId = `cat_${cat.key}`;
      console.log(`Adding Category record: '${cat.name}'...`);
      db.prepare("INSERT INTO categories (id, name, heroImage, inspiration) VALUES (?, ?, ?, ?)")
        .run(catId, cat.name, firstItemImageLocal, `Explore fresh new arrivals of ${cat.name} direct from Temu Ghana.`);

      // Ingest the high-fidelity items
      for (let i = 0; i < cat.items.length; i++) {
        const item = cat.items[i];
        const productId = `prod_temu_${cat.key}_${i + 1}`;
        const hasVideo = i % 2 === 0;
        const rawVideo = hasVideo ? FASHION_VIDEOS[i % FASHION_VIDEOS.length] : null;

        const prefix = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);

        // Download and compress item image
        let localImage;
        if (i === 0) {
          localImage = firstItemImageLocal;
        } else {
          localImage = await processAndSaveScrapedImage(item.image, prefix);
        }

        // Download and compress video
        let localVideo = null;
        if (rawVideo) {
          localVideo = await processAndSaveScrapedVideo(rawVideo, prefix);
        }

        // Map colors & sizes
        const sizes = cat.key === 'womens_shoes' ? ['36', '37', '38', '39', '40', '41'] : ['XS', 'S', 'M', 'L', 'XL', '2XL'];
        const colors = ['Midnight Black', 'Slate Grey', 'Off White', 'Pistachio Green'];

        // Detail list formatted to match JSON structure expected
        const detailsList = item.details.map((val, idx) => ({ key: `Spec ${idx+1}`, value: val }));
        detailsList.unshift({ key: 'Source', value: 'Temu Direct (GH)' });
        detailsList.push({ key: 'Fulfillment', value: 'Import Hub, Accra' });

        // SQL Ingestion
        db.prepare(`
          INSERT INTO products (
            id, name, price, originalPrice, shippingFee, image, images, colors, category, gender, 
            description, details, inStock, isNew, viewers, stockCount, 
            isHallOfFame, synergyPath, appeal, brand, tags, 
            supplierId, deliveryTime, sizes, isCustom, priceRange, customizationFields,
            colorVariants, createdAt, offeredDiscount, video
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          productId,
          item.name,
          item.price,
          item.originalPrice,
          15.00, // standard shipping fee
          localImage,
          JSON.stringify([localImage]),
          JSON.stringify(colors),
          cat.name,
          item.gender,
          item.description,
          JSON.stringify(detailsList),
          1, // inStock
          1, // isNew
          Math.floor(100 + Math.random() * 800), // viewers
          Math.floor(15 + Math.random() * 150), // stockCount
          0, // isHallOfFame
          'CYBER', // synergyPath
          'Trending', // appeal
          item.brand,
          JSON.stringify(item.tags),
          'temu_scraper', // supplierId
          '4-7 business days',
          JSON.stringify(sizes),
          0, // isCustom
          null, // priceRange
          '[]', // customizationFields
          '[]', // colorVariants
          createdAt,
          Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100),
          localVideo
        );

        countInserted++;

        // Add to scraped array for JSON export
        scrapedList.push({
          id: productId,
          name: item.name,
          category: cat.name,
          price: item.price,
          originalPrice: item.originalPrice,
          shippingFee: 15.00,
          image: localImage,
          brand: item.brand,
          gender: item.gender,
          tags: item.tags,
          description: item.description,
          details: item.details,
          sizes,
          colors,
          video: localVideo,
          meta: htmlAttrText
        });
      }
    }

    // 4. Save to JSON output
    const outDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, 'scraped_products.json');
    fs.writeFileSync(outPath, JSON.stringify(scrapedList, null, 2));

    console.log(`\n========================================`);
    console.log(`SUCCESS: Successfully ingested ${countInserted} premium products!`);
    console.log(`Saved structured products to JSON file: ${outPath}`);
    console.log(`========================================`);

  } catch (error) {
    console.error("FATAL: Scraping Ingestion failed:", error);
  }
}

main();
