import fs from 'fs';
import * as cheerio from 'cheerio';

const files = [
  'data_temu_mens_clothing.html',
  'data_temu_womens_lingerie_lounge.html',
  'data_temu_womens_shoes.html',
  'data_temu_womens_curve_clothing.html',
  'data_temu_womens_clothing.html'
];

console.log("=== Inspecting Downloaded Files ===");

for (const file of files) {
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf-8');
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    console.log(`\nFile: ${file}`);
    console.log(`Title: ${title}`);
    console.log(`HTML size: ${html.length} bytes`);
    
    // Find all images matching kwcdn
    const kwcdnImages = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
      if (src.includes('kwcdn') && !kwcdnImages.includes(src)) {
        kwcdnImages.push(src);
      }
    });
    console.log(`Found ${kwcdnImages.length} images containing kwcdn.`);
    if (kwcdnImages.length > 0) {
      console.log(`Sample images:`, kwcdnImages.slice(0, 5));
    }
    
    // Search for any script tags containing rawData or JSON
    let foundScripts = 0;
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('goodsList') || text.includes('goods_list') || text.includes('__InitialLanguage__')) {
        foundScripts++;
        console.log(`Found interesting script block index ${i} (length ${text.length} chars)`);
      }
    });
    console.log(`Found ${foundScripts} interesting script tags.`);
  } else {
    console.log(`File not found yet: ${file}`);
  }
}
