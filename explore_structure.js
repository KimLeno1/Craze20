import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('data_temu_mens_clothing.html', 'utf-8');
const $ = cheerio.load(html);

console.log("=== Exploring HTML Structure ===");

// 1. Let's find some elements that contain a dollar sign ($) or similar currency indicator
const elementsWithPrice = [];
$('*').each((i, el) => {
  const text = $(el).text().trim();
  if (text.includes('GH₵') || text.includes('₵') || text.includes('$')) {
    if (text.length < 30) {
      elementsWithPrice.push({
        tag: el.tagName,
        class: $(el).attr('class') || '',
        text: text
      });
    }
  }
});
console.log(`Found ${elementsWithPrice.length} elements with price indicators.`);
console.log("Sample elements with price:", elementsWithPrice.slice(0, 15));

// 2. Let's find any img tags and their full attributes
const imgs = [];
$('img').each((i, el) => {
  imgs.push({
    src: $(el).attr('src') || '',
    alt: $(el).attr('alt') || '',
    class: $(el).attr('class') || '',
    dataSrc: $(el).attr('data-src') || '',
    dataOriginal: $(el).attr('data-original') || ''
  });
});
console.log(`\nFound ${imgs.length} total image elements.`);
console.log("Sample image elements:", imgs.slice(0, 15));
