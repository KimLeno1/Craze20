import fs from 'fs';
import path from 'path';

function countFiles(dir) {
  let count = 0;
  let emptyCount = 0;
  if (!fs.existsSync(dir)) return { count, emptyCount };
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const p = path.join(currentDir, item);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        traverse(p);
      } else {
        count++;
        if (stat.size === 0) {
          emptyCount++;
        }
      }
    }
  }
  
  traverse(dir);
  return { count, emptyCount };
}

console.log('Clothes directory:', countFiles('clothes'));
console.log('Uploads directory:', countFiles('public/uploads/products'));
