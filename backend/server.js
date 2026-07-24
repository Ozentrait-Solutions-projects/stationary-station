require('dotenv').config();

// ─── AWS S3 Config Guard ──────────────────────────────────────────
const REQUIRED_AWS_VARS = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET_NAME'];
const missingAws = REQUIRED_AWS_VARS.filter((v) => !process.env[v] || process.env[v].startsWith('your_'));
if (missingAws.length > 0) {
  console.warn(`⚠️  AWS S3 not configured. Missing or placeholder values: ${missingAws.join(', ')}`);
  console.warn('   Image uploads will fail until you fill in these variables in your .env file.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Performance Middleware ───────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── CORS ────────────────────────────────────────────────────────
const clientOrigin = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.replace(/\/$/, '')
  : 'http://localhost:3000';

app.use(cors({
  origin: clientOrigin,
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/coupons',  require('./routes/coupons'));
app.use('/api/admin',    require('./routes/admin'));

// ─── Root & Health Check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'NexCart API is running' });
});

app.get(['/favicon.ico', '/favicon.png'], (req, res) => res.status(204).end());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'NexCart API v1.0' });
});

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 NexCart API running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
