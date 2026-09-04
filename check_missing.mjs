import fs from 'fs';
import path from 'path';

const clothesDir = 'clothes';
const uploadsDir = 'public/uploads/products';

function getFiles(dir) {
  const results = [];
  function traverse(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const p = path.join(currentDir, item);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        traverse(p);
      } else if (item.match(/\.(jpg|jpeg|png)$/i)) {
        results.push({
          fullPath: p,
          relativePath: path.relative(dir, p),
          size: stat.size
        });
      }
    }
  }
  traverse(dir);
  return results;
}

const clothesFiles = getFiles(clothesDir);
console.log('Total clothes files found:', clothesFiles.length);

let missingCount = 0;
let emptyCount = 0;
for (const file of clothesFiles) {
  const ext = path.extname(file.relativePath);
  const baseWithoutExt = file.relativePath.substring(0, file.relativePath.length - ext.length);
  const webpRelativePath = `${baseWithoutExt}.webp`;
  const webpAbsolutePath = path.join(uploadsDir, webpRelativePath);
  
  if (!fs.existsSync(webpAbsolutePath)) {
    missingCount++;
    if (missingCount <= 10) {
      console.log(`Missing converted webp for: ${file.relativePath} (origin size: ${file.size} bytes)`);
    }
  } else {
    const webpStat = fs.statSync(webpAbsolutePath);
    if (webpStat.size === 0) {
      emptyCount++;
    }
  }
}

console.log('Total missing files:', missingCount);
console.log('Total empty files in uploads:', emptyCount);
