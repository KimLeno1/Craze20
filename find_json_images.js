import fs from 'fs';

const html = fs.readFileSync('data_temu_mens_clothing.html', 'utf-8');

console.log("=== Scanning Raw HTML Text for Product Image Patterns ===");

// Regex for kwcdn product images
const kwcdnProductRegex = /"([^"]*kwcdn[^"]*product[^"]*)"/gi;
const matches = [...html.matchAll(kwcdnProductRegex)].map(m => m[1]);

console.log(`Found ${matches.length} matches for kwcdn product images.`);
if (matches.length > 0) {
  console.log("Unique matches (up to 20):");
  const uniqueMatches = [...new Set(matches)];
  uniqueMatches.slice(0, 20).forEach((m, idx) => console.log(`${idx+1}: ${m}`));
} else {
  console.log("No specific matches containing both 'kwcdn' and 'product' in quotes.");
  
  // Broad search for any kwcdn or temucdn string
  const broadRegex = /"([^"]*(?:kwcdn|temucdn)[^"]*)"/gi;
  const broadMatches = [...html.matchAll(broadRegex)].map(m => m[1]);
  console.log(`Found ${broadMatches.length} broad matches containing 'kwcdn' or 'temucdn'.`);
  if (broadMatches.length > 0) {
    const uniqueBroad = [...new Set(broadMatches)];
    console.log("Unique broad matches (up to 20):");
    uniqueBroad.slice(0, 20).forEach((m, idx) => console.log(`${idx+1}: ${m}`));
  }
}
