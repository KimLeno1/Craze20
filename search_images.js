import fs from 'fs';

const html = fs.readFileSync('temu_test.html', 'utf-8');

console.log("=== Searching for image URLs and domains in temu_test.html ===");

// Regex for URLs ending with jpg, png, webp or containing kwcdn
const regex = /(https?:\/\/[^\s"'()]+(?:\.jpg|\.png|\.webp|kwcdn|temucdn)[^\s"'()]*)/g;
const matches = html.match(regex) || [];
console.log(`Found ${matches.length} potential asset URLs.`);

// Get unique domains/URLs
const uniqueUrls = [...new Set(matches)];
console.log(`Unique URLs count: ${uniqueUrls.length}`);

console.log("\nSample of first 30 URLs found:");
uniqueUrls.slice(0, 30).forEach((url, i) => {
  console.log(`${i + 1}: ${url}`);
});
