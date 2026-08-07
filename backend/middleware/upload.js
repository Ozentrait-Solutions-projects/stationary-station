const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ─── Ensure upload directories exist ─────────────────────────────────────────
const UPLOAD_BASE = path.join(__dirname, '..', 'uploads');
const IMAGE_DIR = path.join(UPLOAD_BASE, 'images');
const VIDEO_DIR = path.join(UPLOAD_BASE, 'videos');
const RETURN_DIR = path.join(UPLOAD_BASE, 'returns');

[UPLOAD_BASE, IMAGE_DIR, VIDEO_DIR, RETURN_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
 * Get the public URL for a locally stored file.
 * req.file.path is the absolute FS path; we convert it to /uploads/images/<filename>
 */
const getLocalFileUrl = (req) => {
  if (!req.file) return null;
  // Normalize to forward slashes and make path relative to uploads/
  const relative = path.relative(UPLOAD_BASE, req.file.path).replace(/\\/g, '/');
  return `/uploads/${relative}`;
};

// ─── Stub: modular AWS-ready interface ───────────────────────────────────────
// When migrating to AWS later: replace upload/uploadEvidence with multer-s3 instances
// and getLocalFileUrl with req.file.location (S3 URL). No other code needs to change.

module.exports = { upload, uploadEvidence, getLocalFileUrl };