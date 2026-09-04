import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temu_test.html', 'utf-8');
const $ = cheerio.load(html);

console.log("Detailed inline scripts analysis:");

$('script').each((i, el) => {
  const content = $(el).html() || '';
  if (content.length === 0) return;
  
  console.log(`\n--- Script #${i} (Length: ${content.length}) ---`);
  console.log("First 150 chars:", content.substring(0, 150).replace(/\s+/g, ' '));
  
  // Search for price-like characters (e.g., "$", "GHS", digit arrays, or decimal patterns)
  // Or look for product names or image formats (e.g., .jpg, .png)
  const jpgCount = (content.match(/\.jpg/g) || []).length;
  const pngCount = (content.match(/\.png/g) || []).length;
  const webpCount = (content.match(/\.webp/g) || []).length;
  const priceCount = (content.match(/price/gi) || []).length;
  const titleCount = (content.match(/title/gi) || []).length;
  
  console.log(`Image/Price Counts - .jpg: ${jpgCount}, .png: ${pngCount}, .webp: ${webpCount}, 'price': ${priceCount}, 'title': ${titleCount}`);
  
  if (jpgCount > 5 || pngCount > 5 || webpCount > 5) {
    console.log("This script tag seems to have MANY image links! Printing a sample of 1000 characters from the middle...");
    const sampleStart = Math.floor(content.length / 2) - 500;
    console.log(content.substring(sampleStart, sampleStart + 1000));
  }
});
