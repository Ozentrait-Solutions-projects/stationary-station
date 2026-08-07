/**
 * NexCart v2 Migration
 * Adds: return_requests, user_addresses tables
 *       sale_price, return_exchange_available columns on products
 * Run: node migrate_v2.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚀 Running NexCart v2 migration...\n');

    // ── products: add sale_price and return_exchange_available ───────────
    await client.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS return_exchange_available BOOLEAN DEFAULT TRUE;
    `);
    console.log('✅ products: added sale_price, return_exchange_available');

    // ── return_requests table ────────────────────────────────────────────
    await client.query(`
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
    `);
    console.log('✅ return_requests: table created');

    // ── user_addresses table ─────────────────────────────────────────────
    await client.query(`
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
    `);
    console.log('✅ user_addresses: table created');

    // ── indexes ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_return_requests_user    ON return_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_return_requests_order   ON return_requests(order_id);
      CREATE INDEX IF NOT EXISTS idx_return_requests_status  ON return_requests(status);
      CREATE INDEX IF NOT EXISTS idx_user_addresses_user     ON user_addresses(user_id);
    `);
    console.log('✅ Indexes created');

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
