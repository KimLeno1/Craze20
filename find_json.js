import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temu_test.html', 'utf-8');
const $ = cheerio.load(html);

console.log("Analyzing all script tags in temu_test.html...");
let scriptCount = 0;

$('script').each((i, el) => {
  const content = $(el).html() || '';
  const src = $(el).attr('src') || '';
  if (src) {
    console.log(`Script #${i}: src="${src}"`);
  } else {
    scriptCount++;
    console.log(`Script #${i}: Inline. Length: ${content.length}. Preview: ${content.trim().substring(0, 150)}...`);
  }
});

console.log(`\nTotal inline scripts found: ${scriptCount}`);
