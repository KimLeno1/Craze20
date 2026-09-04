import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import { authenticateAny, AuthRequest } from '../middleware/auth.js';

const execPromise = promisify(exec);

let isFfmpegAvailable: boolean | null = null;

async function checkFfmpeg(): Promise<boolean> {
  if (isFfmpegAvailable !== null) return isFfmpegAvailable;
  try {
    await execPromise('ffmpeg -version');
    isFfmpegAvailable = true;
    console.log('FFmpeg is available on the system. Video compression is enabled.');
  } catch (e) {
    isFfmpegAvailable = false;
    console.log('FFmpeg is NOT available on the system. Video upload will bypass compression.');
  }
  return isFfmpegAvailable;
}

const router = Router();

const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const uploadVideo = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

const processImage = async (req: AuthRequest & { file?: any }, res: any) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  try {
    const type = req.path.split('/').pop(); // product, feed, profile, category
    
    // Validate mimetype
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ status: 'error', message: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' });
    }

    const subDir = type === 'category' ? 'admin' : type === 'feed' ? 'feeds' : type === 'profile' ? 'profiles' : 'products';
    const targetDir = path.join(uploadDir, subDir);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Sanitize original filename and get extension
    const parsedPath = path.parse(req.file.originalname);
    const originalName = parsedPath.name
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50); // Limit length
    const ext = parsedPath.ext.toLowerCase() || '.jpg';
    
    const userId = req.user?.id || 'anon';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    const filename = `${originalName}_${userId}_${uniqueSuffix}.webp`;
    const filepath = path.join(targetDir, filename);

    await sharp(req.file.buffer)
      .resize({ 
        width: 1600, 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .rotate() 
      .webp({ 
        quality: 85, 
        effort: 6, 
        smartSubsample: true 
      })
      .toFile(filepath);

    res.json({ status: 'success', url: `/uploads/${subDir}/${filename}` });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process image' });
  }
};

router.post('/product', authenticateAny, upload.single('image'), processImage);
router.post('/feed', authenticateAny, upload.single('image'), processImage);
router.post('/profile', authenticateAny, upload.single('image'), processImage);
router.post('/category', authenticateAny, upload.single('image'), processImage);

router.post('/video', authenticateAny, uploadVideo.single('video'), async (req: AuthRequest & { file?: any }, res: any) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No video file uploaded' });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
  const tempDir = path.join(uploadDir, 'tmp');
  const videoDir = path.join(uploadDir, 'videos');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Validate mimetype
  const validMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska', 'video/avi'];
  if (!validMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ status: 'error', message: 'Invalid file type. Only MP4, WebM, OGG, MOV, MKV and AVI are allowed.' });
  }

  // Sanitize original filename
  const parsedPath = path.parse(req.file.originalname);
  const originalName = parsedPath.name
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50); // Limit length
  const ext = parsedPath.ext.toLowerCase() || '.mp4';

  const tempInputPath = path.join(tempDir, `input_${uniqueSuffix}${ext}`);
  const outFilename = `${originalName}_${req.user?.id || 'anon'}_${uniqueSuffix}.mp4`;
  const targetOutputPath = path.join(videoDir, outFilename);

  try {
    const hasFfmpeg = await checkFfmpeg();
    if (!hasFfmpeg) {
      throw new Error('ffmpeg_not_available');
    }

    // Write buffer to temporary input file
    fs.writeFileSync(tempInputPath, req.file.buffer);

    console.log(`Starting video compression for ${req.file.originalname} (size: ${(req.file.buffer.length / (1024 * 1024)).toFixed(2)} MB)...`);
    const startTime = Date.now();

    // Use scale min(1280,iw) and divide height by 2 to prevent division by odd numbers inside H.264 profiles
    // CRF 28 -preset fast ensures efficient compression and speed
    const command = `ffmpeg -y -i "${tempInputPath}" -vcodec libx264 -crf 28 -preset fast -acodec aac -vf "scale='min(1280,iw)':-2" "${targetOutputPath}"`;
    
    await execPromise(command);

    const originalSize = req.file.buffer.length;
    const compressedSize = fs.statSync(targetOutputPath).size;
    const compressionRatio = ((1 - (compressedSize / originalSize)) * 100).toFixed(1);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`Video compression finished in ${durationSec}s. Original: ${(originalSize / (1024 * 1024)).toFixed(2)}MB, Compressed: ${(compressedSize / (1024 * 1024)).toFixed(2)}MB. Ratio: ${compressionRatio}%`);

    // Clean up temporary file
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }

    res.json({ 
      status: 'success', 
      url: `/uploads/videos/${outFilename}`,
      meta: {
        originalSize,
        compressedSize,
        compressionRatio: parseFloat(compressionRatio),
        timeTaken: parseFloat(durationSec)
      }
    });

  } catch (error: any) {
    console.error('Error during video compression, attempting raw fallback:', error);
    
    // Clean up temporary file if exists
    if (fs.existsSync(tempInputPath)) {
      try { fs.unlinkSync(tempInputPath); } catch (e) {}
    }

    // Attempt raw fallback as safe-fail mechanism so users are not blocked if ffmpeg experiences an issue
    try {
      const fallbackFilename = `${originalName}_${req.user?.id || 'anon'}_${uniqueSuffix}${ext}`;
      const fallbackPath = path.join(videoDir, fallbackFilename);
      fs.writeFileSync(fallbackPath, req.file.buffer);
      console.log(`Saved raw fallback file to: ${fallbackPath}`);
      return res.json({ 
        status: 'success', 
        url: `/uploads/videos/${fallbackFilename}`,
        meta: {
          originalSize: req.file.buffer.length,
          compressedSize: req.file.buffer.length,
          compressionRatio: 0,
          isCompressed: false,
          warning: 'Video saved in raw format because compression failed.'
        }
      });
    } catch (fallbackError: any) {
      console.error('Fatal upload error, both compression and fallback failed:', fallbackError);
      return res.status(500).json({ status: 'error', message: 'Failed to process and compress video: ' + (error.message || error) });
    }
  }
});

export default router;
