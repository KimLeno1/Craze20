import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('data_temu_mens_clothing.html', 'utf-8');
const $ = cheerio.load(html);

console.log("=== Parsing Initial I18n Store V2 ===");

$('script').each((i, el) => {
  const text = $(el).html() || '';
  if (text.includes('window.__InitialI18nStore__')) {
    console.log(`Found window.__InitialI18nStore__ in Script #${i}`);
    
    // Split by window.__InitialI18nStore__=
    const parts = text.split(/window\.__InitialI18nStore__\s*=/);
    if (parts.length > 1) {
      let jsonStr = parts[1].trim();
      // Find the closing semicolon
      const semiIdx = jsonStr.indexOf(';');
      if (semiIdx !== -1) {
        jsonStr = jsonStr.substring(0, semiIdx).trim();
      }
      
      try {
        const store = JSON.parse(jsonStr);
        console.log("Successfully parsed JSON store!");
        fs.writeFileSync('i18n_store_extracted.json', JSON.stringify(store, null, 2));
        
        // Explore the keys
        if (store.en) {
          console.log("Keys under store.en:", Object.keys(store.en));
          // Print sample sub-keys or search for product list patterns
          for (const key of Object.keys(store.en)) {
            console.log(`  - Key: ${key}, keys:`, Object.keys(store.en[key]).slice(0, 5));
          }
        }
      } catch (e) {
        console.log("Failed parsing JSON:", e.message);
        console.log("JSON snippet:", jsonStr.substring(0, 200));
      }
    }
  }
});
