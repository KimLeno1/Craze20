import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('data_temu_mens_clothing.html', 'utf-8');
const $ = cheerio.load(html);

console.log("=== Listing Script Tags ===");
$('script').each((i, el) => {
  const src = $(el).attr('src') || '';
  const text = $(el).html() || '';
  console.log(`Script #${i}: src="${src}", size=${text.length} chars, snippet="${text.substring(0, 150).replace(/\s+/g, ' ')}..."`);
});
