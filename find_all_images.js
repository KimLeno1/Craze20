import fs from 'fs';

const files = [
  'data_temu_mens_clothing.html',
  'data_temu_womens_lingerie_lounge.html',
  'data_temu_womens_shoes.html',
  'data_temu_womens_curve_clothing.html',
  'data_temu_womens_clothing.html'
];

console.log("=== Collecting all image-like URLs across all 5 files ===");

const allImages = new Set();

const imgRegex = /https?:\/\/[^"\s']+\.(?:jpg|jpeg|png|webp|gif)/gi;

for (const file of files) {
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf-8');
    const matches = html.match(imgRegex) || [];
    matches.forEach(url => {
      // Clean URL of any escaping or garbage characters at the end
      let cleanUrl = url.replace(/\\/g, '');
      if (cleanUrl.includes('kwcdn') || cleanUrl.includes('temucdn')) {
        allImages.add(cleanUrl);
      }
    });
  }
}

console.log(`Found ${allImages.size} unique kwcdn/temucdn image URLs:`);
const imgList = Array.from(allImages);
imgList.forEach((url, i) => {
  console.log(`${i + 1}: ${url}`);
});
