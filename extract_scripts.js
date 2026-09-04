import fs from 'fs';

const html = fs.readFileSync('temu_test.html', 'utf-8');

// Look for occurrences of "bag", "backpack", "shoulder", "price", "GHS", or "GH₵"
console.log("Searching HTML for product-related text...");

// Let's count some words
const bagCount = (html.match(/bag/gi) || []).length;
const priceCount = (html.match(/price/gi) || []).length;
const ghsCount = (html.match(/GHS/g) || []).length;
const ghcCount = (html.match(/GH₵/g) || []).length;
const goodsCount = (html.match(/goods/gi) || []).length;

console.log(`Word occurrences - bag: ${bagCount}, price: ${priceCount}, GHS: ${ghsCount}, GH₵: ${ghcCount}, goods: ${goodsCount}`);

// Let's find script tags that might contain "__INITIAL_STATE__" or similar big words
const regex = /window\.[A-Za-z0-9_$]+=({[\s\S]*?});/g;
let match;
let matchCount = 0;
while ((match = regex.exec(html)) !== null) {
  const varName = match[0].split('=')[0].trim();
  const contentLen = match[1].length;
  console.log(`Found global JS assignment: ${varName} of length ${contentLen}`);
  if (contentLen > 500) {
    fs.writeFileSync(`var_${varName.replace(/[^a-zA-Z0-9_$]/g, '_')}.json`, match[1]);
    console.log(`Saved ${varName} content to file.`);
  }
  matchCount++;
}

console.log(`Total variables extracted by regex: ${matchCount}`);
