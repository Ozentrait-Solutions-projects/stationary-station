const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

// ─── Serverless-safe Upload Directory Initialization ─────────────────────────
// Vercel serverless environment is read-only at /var/task; use OS temp dir if on serverless
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const UPLOAD_BASE = isServerless ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '..', 'uploads');
const IMAGE_DIR = path.join(UPLOAD_BASE, 'images');
const VIDEO_DIR = path.join(UPLOAD_BASE, 'videos');
const RETURN_DIR = path.join(UPLOAD_BASE, 'returns');

[UPLOAD_BASE, IMAGE_DIR, VIDEO_DIR, RETURN_DIR].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn(`⚠️ Could not create upload directory ${dir}:`, err.message);
  }
});

// ─── Generate unique filename ─────────────────────────────────────────────────
const uniqueFilename = (originalname) => {
  const ext = path.extname(originalname || '').toLowerCase();
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${unique}${ext || '.jpg'}`;
};

// ─── File Filter: Images only ─────────────────────────────────────────────────
const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, WEBP, GIF images are allowed'));
  }
  cb(null, true);
};

// ─── File Filter: Images + Video ─────────────────────────────────────────────
const evidenceFileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp',
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only images (JPG, PNG, WEBP) and videos (MP4, MOV, WEBM) are allowed'));
  }
  cb(null, true);
};

// ─── Local Disk Storage: Products ────────────────────────────────────────────
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGE_DIR),
  filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

// ─── Local Disk Storage: Return Evidence ─────────────────────────────────────
const returnStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    cb(null, isVideo ? VIDEO_DIR : RETURN_DIR);
  },
  filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

// ─── Multer Instances ─────────────────────────────────────────────────────────
const upload = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const uploadEvidence = multer({
  storage: returnStorage,
  fileFilter: evidenceFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for videos
});

/**
 * Get public URL for a locally stored file.
 */
const getLocalFileUrl = (req) => {
  if (!req.file) return null;
  const relative = path.relative(UPLOAD_BASE, req.file.path).replace(/\\/g, '/');
  return `/uploads/${relative}`;
};

module.exports = { upload, uploadEvidence, getLocalFileUrl };