import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('data_temu_mens_clothing.html', 'utf-8');
const $ = cheerio.load(html);

console.log("=== Parsing Initial I18n Store ===");

let foundStore = null;
$('script').each((i, el) => {
  const text = $(el).html() || '';
  if (text.includes('window.__InitialI18nStore__')) {
    console.log(`Found window.__InitialI18nStore__ in Script #${i}`);
    
    // Extract the JSON
    const startIdx = text.indexOf('window.__InitialI18nStore__ =') + 'window.__InitialI18nStore__ ='.length;
    // Find the end, which is usually a semicolon before the next statement
    const subText = text.substring(startIdx).trim();
    // Let's parse as much of the JSON as possible, or parse with an eval/regex since it's JS assignment
    try {
      // Find the closing semicolon of the assignment
      let endIdx = subText.lastIndexOf(';');
      if (endIdx === -1) endIdx = subText.length;
      let jsonStr = subText.substring(0, endIdx).trim();
      if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
      
      // We can parse it as JSON
      const store = JSON.parse(jsonStr);
      console.log("Successfully parsed JSON store!");
      foundStore = store;
    } catch (e) {
      console.log("JSON.parse failed, trying eval-like extraction...", e.message);
    }
  }
});

if (foundStore) {
  // Let's save the keys or write a sample of the store structure
  const keys = Object.keys(foundStore);
  console.log("Store keys:", keys);
  if (foundStore.en) {
    const enKeys = Object.keys(foundStore.en);
    console.log("en keys:", enKeys);
    
    // Look for product or goods listings deep in the store
    function findKeysWithGoods(obj, path = '') {
      if (!obj || typeof obj !== 'object') return;
      
      for (const [k, v] of Object.entries(obj)) {
        const curPath = path ? `${path}.${k}` : k;
        if (k.toLowerCase().includes('goods') || k.toLowerCase().includes('product') || Array.isArray(v)) {
          if (Array.isArray(v)) {
            console.log(`Found Array at path: ${curPath} (length: ${v.length})`);
            if (v.length > 0 && typeof v[0] === 'object') {
              console.log("Sample item from array:", JSON.stringify(v[0]).substring(0, 300));
            }
          } else {
            console.log(`Found object matching key "${k}" at path: ${curPath}`);
          }
        }
        findKeysWithGoods(v, curPath);
      }
    }
    
    findKeysWithGoods(foundStore.en);
  }
}
