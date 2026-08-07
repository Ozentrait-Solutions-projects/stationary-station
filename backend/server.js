require('dotenv').config();



const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global CORS Middleware (FIRST in pipeline) ───────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin || 'https://stationary-v2z6.vercel.app';
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }


  next();
});

// ─── Security & Performance Middleware ───────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));




// ─── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files: serve uploaded images from /uploads ───────────
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads'), {
  maxAge: '30d',
  etag: true,
}));


// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/cart',      require('./routes/cart'));
app.use('/api/wishlist',  require('./routes/wishlist'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/coupons',   require('./routes/coupons'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/returns',   require('./routes/returns'));
app.use('/api/addresses', require('./routes/addresses'));

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
  const origin = req.headers.origin || 'https://stationary-v2z6.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  const origin = req.headers.origin || 'https://stationary-v2z6.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  const status = err.status || err.statusCode || 500;

  let clientMessage = err.message || 'Internal Server Error';
  if (
    status >= 500 ||
    clientMessage.includes('SELECT') ||
    clientMessage.includes('INSERT') ||
    clientMessage.includes('UPDATE') ||
    clientMessage.includes('DELETE') ||
    clientMessage.includes('postgres') ||
    clientMessage.includes('relation') ||
    clientMessage.includes('column')
  ) {
    clientMessage = "Something went wrong on our end. Please try again in a moment.";
  }

  res.status(status).json({
    message: clientMessage,
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
