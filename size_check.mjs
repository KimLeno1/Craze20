import fs from 'fs';
import path from 'path';

function getSizes(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getSizes(fullPath);
    } else {
      console.log(`${fullPath}: ${fs.statSync(fullPath).size}`);
    }
  }
}

getSizes('./clothes');
