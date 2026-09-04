import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('data_temu_mens_clothing.html', 'utf-8');
const $ = cheerio.load(html);

console.log("=== Searching for all image-related strings or URLs ===");

// Let's grab all text from script tag 21
const scriptText = $('script').eq(21).html() || '';
console.log(`Script 21 text length: ${scriptText.length}`);

// Let's write scriptText to a separate file to inspect or parse
fs.writeFileSync('script_21_content.js', scriptText);

// Regex for anything that looks like an image URL: http...webp or http...jpg or similar
const imgRegex = /https?:\/\/[^"\s']+\.(?:jpg|jpeg|png|webp)/gi;
const urls = scriptText.match(imgRegex) || [];
console.log(`Found ${urls.length} image URLs in Script 21.`);
console.log("Sample URLs:", urls.slice(0, 10));

// Also let's search for keywords like "thumbUrl", "imgUrl", "goods_name", "goodsName", "price"
const keywords = ["goodsName", "goods_name", "price", "goods_id", "thumb_url", "hd_thumb_url"];
keywords.forEach(kw => {
  const index = scriptText.indexOf(kw);
  console.log(`Keyword "${kw}" found at index: ${index}`);
});
