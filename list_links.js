import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temu_test.html', 'utf-8');
const $ = cheerio.load(html);

console.log("Analyzing links in temu_test.html...");
const links = [];
$('a').each((i, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  links.push({ index: i, href, text });
});

console.log(`Total <a> tags: ${links.length}`);
console.log("First 20 links:");
console.log(links.slice(0, 20));

console.log("\nAnalyzing images in temu_test.html...");
const imgs = [];
$('img').each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  const lazy = $(el).attr('data-src') || $(el).attr('data-original') || '';
  imgs.push({ index: i, src, alt, lazy });
});

console.log(`Total <img> tags: ${imgs.length}`);
console.log("First 10 images:");
console.log(imgs.slice(0, 10));
