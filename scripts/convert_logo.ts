import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.join(process.cwd(), 'logo', 'closet-kraze-logo.svg');
const jpgPath = path.join(process.cwd(), 'logo', 'closet-kraze-logo.jpg');

async function convert() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .flatten({ background: '#050505' }) // Replace transparency with black background if any
      .jpeg({ quality: 100 })
      .toFile(jpgPath);
    console.log('Successfully created JPG logo');
  } catch (error) {
    console.error('Error generating JPG:', error);
  }
}

convert();
