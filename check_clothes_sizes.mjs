import fs from 'fs';
import path from 'path';

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
      } else {
        results.push({
          path: p,
          size: stat.size
        });
      }
    }
  }
  traverse(dir);
  return results;
}

const files = getFiles('clothes');
console.log('Total clothes files:', files.length);

const sizeRanges = {
  '0-100 bytes': 0,
  '100 bytes - 1 KB': 0,
  '1 KB - 10 KB': 0,
  '10 KB - 100 KB': 0,
  '100 KB+': 0
};

for (const f of files) {
  if (f.size <= 100) sizeRanges['0-100 bytes']++;
  else if (f.size <= 1024) sizeRanges['100 bytes - 1 KB']++;
  else if (f.size <= 10240) sizeRanges['1 KB - 10 KB']++;
  else if (f.size <= 102400) sizeRanges['10 KB - 100 KB']++;
  else sizeRanges['100 KB+']++;
}

console.log('File size distribution in clothes dir:', sizeRanges);

console.log('Sample files with sizes:');
console.log(files.slice(0, 10));
