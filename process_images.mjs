import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const clothesDir = path.join(process.cwd(), 'clothes');
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

async function processDirectory(dir, relativePath = '') {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      await processDirectory(itemPath, path.join(relativePath, item));
    } else if (item.match(/\.(jpg|jpeg|png)$/i)) {
      const ext = path.extname(item);
      const name = path.basename(item, ext);
      
      // Compute target directory paths (standard and mapped if 'footware')
      const targetDirs = [path.join(uploadsDir, relativePath)];
      if (relativePath.startsWith('footware')) {
        const mappedRelativePath = relativePath.replace(/^footware/, 'footwear');
        targetDirs.push(path.join(uploadsDir, mappedRelativePath));
      }
      
      for (const targetDir of targetDirs) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const webpPath = path.join(targetDir, `${name}.webp`);
        
        // Skip if file already exists with same size characteristics
        if (fs.existsSync(webpPath)) {
          const webpStat = fs.statSync(webpPath);
          if ((stat.size === 0 && webpStat.size === 0) || (stat.size > 0 && webpStat.size > 0)) {
            // Already processed
            continue;
          }
        }
        
        console.log(`Converting ${itemPath} to ${webpPath}`);
        try {
          if (stat.size === 0) {
             fs.writeFileSync(webpPath, '');
             continue;
          }
          await sharp(itemPath).webp({ quality: 75, effort: 0 }).toFile(webpPath);
        } catch (err) {
          console.error(`Error converting ${itemPath} to ${webpPath}:`, err);
          // Fallback: just copy it
          fs.copyFileSync(itemPath, webpPath);
        }
      }
    } else if (item === 'data.txt') {
      const targetDirs = [path.join(uploadsDir, relativePath)];
      if (relativePath.startsWith('footware')) {
        const mappedRelativePath = relativePath.replace(/^footware/, 'footwear');
        targetDirs.push(path.join(uploadsDir, mappedRelativePath));
      }
      
      for (const targetDir of targetDirs) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const destPath = path.join(targetDir, item);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(itemPath, destPath);
        }
      }
    }
  }
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

processDirectory(clothesDir).then(() => console.log('Done Processing!')).catch(console.error);
