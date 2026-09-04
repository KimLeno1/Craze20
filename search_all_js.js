import fs from 'fs';

const html = fs.readFileSync('temu_test.html', 'utf-8');

console.log("Searching for product-related patterns in raw HTML...");

const keys = [
  'goods_id', 'goodsId', 'goods_name', 'goodsName', 'thumb_url', 'thumbUrl', 
  'price', 'sales', 'score', 'rating', 'mall_id', 'mallId', 'link', 
  'short_name', 'shortName', 'hd_thumb_url', 'hdThumbUrl', 'carousel_images', 'image'
];

for (const key of keys) {
  const indices = [];
  let idx = html.indexOf('"' + key + '"');
  while (idx !== -1) {
    indices.push(idx);
    if (indices.length >= 5) break;
    idx = html.indexOf('"' + key + '"', idx + 1);
  }
  
  let idxSingle = html.indexOf("'" + key + "'");
  while (idxSingle !== -1) {
    indices.push(idxSingle);
    if (indices.length >= 5) break;
    idxSingle = html.indexOf("'" + key + "'", idxSingle + 1);
  }

  if (indices.length > 0) {
    console.log(`Key "${key}": found ${indices.length} occurrences. First occurrence snippet:`);
    const firstIdx = indices[0];
    const start = Math.max(0, firstIdx - 150);
    const end = Math.min(html.length, firstIdx + 150);
    console.log(`Snippet: ... ${html.substring(start, end).replace(/\s+/g, ' ')} ...`);
  } else {
    console.log(`Key "${key}": NOT found.`);
  }
}
