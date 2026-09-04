import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temu_test.html', 'utf-8');
const $ = cheerio.load(html);

const tagCounts = {};
$('*').each((i, el) => {
  const name = el.name;
  tagCounts[name] = (tagCounts[name] || 0) + 1;
});

console.log("HTML Tag Counts:", tagCounts);
