import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Migration Script: Upload local product images to S3 / Cloudflare R2 and update database URLs.
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-s3.ts
 * 
 * Required Environment Variables:
 *   S3_ENDPOINT (e.g. https://<account_id>.r2.cloudflarestorage.com or s3.us-east-1.amazonaws.com)
 *   S3_BUCKET_NAME (e.g. closetkraze-media)
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   CDN_PUBLIC_URL (e.g. https://media.closetkraze.top or https://closetkraze-media.r2.cloudflarestorage.com)
 */

async function main() {
  console.log('🚀 Starting S3/R2 Media Migration...');

  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET_NAME || 'closetkraze-media';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const cdnPublicUrl = (process.env.CDN_PUBLIC_URL || 'https://media.closetkraze.top').replace(/\/$/, '');

  if (!accessKeyId || !secretAccessKey) {
    console.warn('⚠️ S3 credentials missing (S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY). Running in DRY-RUN mode.');
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: endpoint || undefined,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });

  const uploadsDir = path.join(process.cwd(), 'public/uploads/products');
  if (!fs.existsSync(uploadsDir)) {
    console.error(`❌ Uploads directory not found at ${uploadsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(f => /\.(webp|jpg|jpeg|png|gif|svg)$/i.test(f));
  console.log(`📸 Found ${files.length} images in ${uploadsDir}`);

  let uploadedCount = 0;
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const fileContent = fs.readFileSync(filePath);
    const s3Key = `products/${file}`;

    let mimeType = 'image/webp';
    if (file.endsWith('.jpg') || file.endsWith('.jpeg')) mimeType = 'image/jpeg';
    if (file.endsWith('.png')) mimeType = 'image/png';
    if (file.endsWith('.svg')) mimeType = 'image/svg+xml';

    if (accessKeyId && secretAccessKey) {
      try {
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: fileContent,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }));
        uploadedCount++;
        console.log(`  ✓ Uploaded [${uploadedCount}/${files.length}]: ${s3Key}`);
      } catch (err: any) {
        console.error(`  ❌ Failed to upload ${file}:`, err.message);
      }
    } else {
      console.log(`  [DRY-RUN] Would upload ${s3Key} (${(fileContent.length / 1024).toFixed(1)} KB)`);
    }
  }

  // Update Database SQLite URLs
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  if (fs.existsSync(dbPath)) {
    console.log('🔄 Updating image URLs in SQLite database...');
    const db = new Database(dbPath);

    const products = db.prepare('SELECT id, image, images FROM products').all() as any[];
    let updatedDbCount = 0;

    const updateStmt = db.prepare('UPDATE products SET image = ?, images = ? WHERE id = ?');

    for (const prod of products) {
      let imageChanged = false;
      let newImage = prod.image;
      let newImages = prod.images;

      if (prod.image && prod.image.startsWith('/uploads/products/')) {
        const filename = prod.image.replace('/uploads/products/', '');
        newImage = `${cdnPublicUrl}/products/${filename}`;
        imageChanged = true;
      }

      if (prod.images) {
        try {
          const parsed = JSON.parse(prod.images);
          if (Array.isArray(parsed)) {
            const updatedArr = parsed.map((img: string) => {
              if (typeof img === 'string' && img.startsWith('/uploads/products/')) {
                imageChanged = true;
                return `${cdnPublicUrl}/products/${img.replace('/uploads/products/', '')}`;
              }
              return img;
            });
            newImages = JSON.stringify(updatedArr);
          }
        } catch {}
      }

      if (imageChanged) {
        updateStmt.run(newImage, newImages, prod.id);
        updatedDbCount++;
      }
    }

    console.log(`✅ Updated ${updatedDbCount} products with CDN image URLs`);
  }

  console.log('✨ Migration complete!');
}

main().catch(console.error);
