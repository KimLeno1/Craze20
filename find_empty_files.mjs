import fs from 'fs';
import path from 'path';

function findEmpty(dir) {
  const emptyFiles = [];
  function traverse(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'dist-server') continue;
      const p = path.join(currentDir, item);
      try {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          traverse(p);
        } else if (stat.size === 0) {
          emptyFiles.push(p);
        }
      } catch (e) {}
    }
  }
  traverse(dir);
  return emptyFiles;
}

const empties = findEmpty('.');
console.log('Total empty files:', empties.length);
empties.slice(0, 50).forEach(f => console.log(f));
