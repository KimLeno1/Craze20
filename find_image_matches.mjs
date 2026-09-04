import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('database.sqlite');
const products = db.prepare('SELECT id, name, category, image FROM products').all();

// Recursively find all files in clothes
function getAllClothesFiles(dir) {
  const results = [];
  function traverse(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const p = path.join(currentDir, item);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        traverse(p);
      } else {
        results.push({
          fullPath: p,
          name: item,
          baseName: path.basename(item, path.extname(item)),
          relativePath: path.relative('clothes', p),
          size: stat.size
        });
      }
    }
  }
  traverse(dir);
  return results;
}

const clothesFiles = getAllClothesFiles('clothes');
console.log(`Found ${clothesFiles.length} files in clothes directory.`);

let resolvedCount = 0;
let unresolvedCount = 0;

for (const p of products) {
  if (!p.image) continue;
  
  const expectedRelativePath = p.image.startsWith('/') ? p.image.substring(1) : p.image;
  const expectedPathOnDisk = path.join('public', expectedRelativePath);
  
  if (fs.existsSync(expectedPathOnDisk)) {
    // Already exists
    continue;
  }
  
  // File is missing. Let's find a match by filename in clothes
  const expectedFilename = path.basename(p.image);
  const expectedBaseName = path.basename(p.image, '.webp');
  
  // Find in clothesFiles
  const matches = clothesFiles.filter(cf => cf.baseName === expectedBaseName);
  
  if (matches.length > 0) {
    resolvedCount++;
    console.log(`[MATCH FOUND] Product ID: ${p.id} expects: ${expectedRelativePath}`);
    for (const match of matches) {
      console.log(`  -> Can resolve using: ${match.fullPath} (size: ${match.size} bytes)`);
    }
  } else {
    unresolvedCount++;
    if (unresolvedCount <= 10) {
      console.log(`[NO MATCH] Product ID: ${p.id} expects: ${expectedRelativePath} (Filename: ${expectedBaseName})`);
    }
  }
}

console.log(`Match summary: ${resolvedCount} resolved, ${unresolvedCount} unresolved.`);
