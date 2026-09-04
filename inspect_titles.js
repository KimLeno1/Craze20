import fs from 'fs';
import * as cheerio from 'cheerio';

const files = [
  'data_temu_bags_luggage.html',
  'data_temu_jewelry_accessories.html',
  'data_temu_mens_big_tall.html',
  'data_temu_mens_shoes.html',
  'data_temu_mens_clothing.html'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf-8');
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaKw = $('meta[name="keywords"]').attr('content') || '';
    
    console.log(`\n=== File: ${file} ===`);
    console.log(`Title: ${title}`);
    console.log(`Meta Description: ${metaDesc.substring(0, 150)}...`);
    console.log(`Meta Keywords: ${metaKw}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
