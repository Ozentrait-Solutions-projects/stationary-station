const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.DATABASE_URL ? {} : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  ssl: (process.env.DATABASE_URL || process.env.DB_SSL === 'true')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ PostgreSQL connected');
  }
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
  process.exit(-1);
});

// Auto-ensure critical tables exist
const initDbTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_otps (
        email       VARCHAR(150) PRIMARY KEY,
        otp         VARCHAR(6) NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error('⚠️ DB table auto-init warning:', err.message);
  }
};
initDbTables();

/**
 * Execute a query with optional parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from pool (for transactions)
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
