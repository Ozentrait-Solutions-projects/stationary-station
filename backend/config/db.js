const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: databaseUrl,
  ...(process.env.DATABASE_URL ? {} : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  ssl: (databaseUrl || process.env.DB_SSL === 'true')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ PostgreSQL connected');
  }
});

// Log pool errors gracefully — NEVER call process.exit in serverless environments
pool.on('error', (err) => {
  console.warn('⚠️ PostgreSQL idle client pool warning:', err.message);
});

// Auto-ensure critical tables and schema columns exist
const initDbTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_otps (
        email       VARCHAR(150) PRIMARY KEY,
        otp         VARCHAR(6) NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS return_exchange_available BOOLEAN DEFAULT TRUE;

      ALTER TABLE return_requests
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS processed_by INTEGER;

      CREATE TABLE IF NOT EXISTS return_requests (
        id              SERIAL PRIMARY KEY,
        order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        order_item_id   INTEGER REFERENCES order_items(id) ON DELETE SET NULL,
        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id      INTEGER REFERENCES products(id) ON DELETE SET NULL,
        type            VARCHAR(20) NOT NULL DEFAULT 'return' CHECK (type IN ('return','exchange')),
        reason          TEXT,
        status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','evidence_submitted','approved','rejected')),
        photo_urls      TEXT[],
        video_url       TEXT,
        admin_notes     TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_addresses (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label         VARCHAR(50) DEFAULT 'Home',
        full_name     VARCHAR(100),
        phone         VARCHAR(20),
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city          VARCHAR(100) NOT NULL,
        state         VARCHAR(100),
        pin_code      VARCHAR(20),
        country       VARCHAR(100) DEFAULT 'India',
        is_default    BOOLEAN DEFAULT FALSE,
        lat           NUMERIC(10,7),
        lng           NUMERIC(10,7),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_return_requests_user    ON return_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_return_requests_order   ON return_requests(order_id);
      CREATE INDEX IF NOT EXISTS idx_return_requests_status  ON return_requests(status);
      CREATE INDEX IF NOT EXISTS idx_user_addresses_user     ON user_addresses(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_user             ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_products_category        ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_featured        ON products(is_featured);
    `);
  } catch (err) {
    console.warn('⚠️ DB table auto-init warning:', err.message);
  }
};

const initPromise = initDbTables();

/**
 * Execute a query with optional parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from pool (for transactions)
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool, initPromise };
