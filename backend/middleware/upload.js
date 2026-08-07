const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

// ─── S3 Client ───────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ─── File Filter: Images only ─────────────────────────────────────────────────
const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, WEBP images are allowed'));
  }
  cb(null, true);
};

// ─── File Filter: Images + Video ─────────────────────────────────────────────
const evidenceFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only images (JPG, PNG, WEBP) and videos (MP4, MOV, WEBM) are allowed'));
  }
  cb(null, true);
};

// ─── S3 Storage: Products ──────────────────────────────────────────────────
const productStorage = multerS3({
  s3,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `products/product-${unique}${safeExt}`);
  },
});

// ─── S3 Storage: Return Evidence ──────────────────────────────────────────────
const returnStorage = multerS3({
  s3,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isVideo = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'].includes(file.mimetype);
    const prefix = isVideo ? 'returns/videos' : 'returns/photos';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeExt = ext || (isVideo ? '.mp4' : '.jpg');
    cb(null, `${prefix}/evidence-${unique}${safeExt}`);
  },
});

// ─── Multer Instances ─────────────────────────────────────────────────────────
const upload = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const uploadEvidence = multer({
  storage: returnStorage,
  fileFilter: evidenceFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for videos
});

module.exports = { upload, uploadEvidence, s3 };