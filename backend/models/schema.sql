-- ============================================================
-- NexCart Database Schema
-- ============================================================

-- Drop existing tables (for re-run safety)
DROP TABLE IF EXISTS recently_viewed CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS verification_otps CASCADE;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  avatar      TEXT,
  phone       VARCHAR(20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VERIFICATION OTPS
-- ============================================================
CREATE TABLE verification_otps (
  email       VARCHAR(150) PRIMARY KEY,
  otp         VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  price          NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  category       VARCHAR(100) NOT NULL,
  brand          VARCHAR(100),
  stock          INTEGER NOT NULL DEFAULT 0,
  image_url      TEXT,
  images         TEXT[],
  rating         NUMERIC(3,2) DEFAULT 0,
  review_count   INTEGER DEFAULT 0,
  tags           TEXT[],
  is_featured    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CART
-- ============================================================
CREATE TABLE cart (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE wishlist (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE coupons (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(50) UNIQUE NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses         INTEGER DEFAULT 100,
  used_count       INTEGER DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_price      NUMERIC(10,2) NOT NULL,
  discount         NUMERIC(10,2) DEFAULT 0,
  final_price      NUMERIC(10,2) NOT NULL,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  coupon_code      VARCHAR(50),
  shipping_address JSONB,
  payment_method   VARCHAR(50) DEFAULT 'mock',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id                 SERIAL PRIMARY KEY,
  order_id           INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id         INTEGER NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  quantity           INTEGER NOT NULL,
  price_at_purchase  NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title       VARCHAR(200),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- RECENTLY VIEWED
-- ============================================================
CREATE TABLE recently_viewed (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- ============================================================
-- SEED DATA — USERS
-- ============================================================
-- password: Admin@123
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@nexcart.com', '$2b$10$ipI3/x31uF94tJUfaHOMhO7/z7sSk9cGJusMzxyHCOjj7CvA7E8Qi', 'admin'),
('John Doe', 'john@example.com', '$2b$10$ipI3/x31uF94tJUfaHOMhO7/z7sSk9cGJusMzxyHCOjj7CvA7E8Qi', 'user'),
('Jane Smith', 'jane@example.com', '$2b$10$ipI3/x31uF94tJUfaHOMhO7/z7sSk9cGJusMzxyHCOjj7CvA7E8Qi', 'user');

-- ============================================================
-- SEED DATA — PRODUCTS
-- ============================================================
INSERT INTO products (title, description, price, original_price, category, brand, stock, image_url, images, rating, review_count, tags, is_featured) VALUES
-- Electronics
('Sony WH-1000XM5 Headphones',
 'Industry-leading noise canceling with Speak-to-Chat technology. Up to 30-hour battery life with quick charging.',
 24999, 34999, 'Electronics', 'Sony', 50,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
 ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600','https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'],
 4.8, 2341, ARRAY['headphones','wireless','noise-canceling'], TRUE),

('Apple iPhone 15 Pro',
 '48MP main camera, A17 Pro chip, titanium design, Action Button, USB-C. The most advanced iPhone ever.',
 134900, 154900, 'Electronics', 'Apple', 30,
 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
 ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'],
 4.9, 5821, ARRAY['iphone','smartphone','apple'], TRUE),

('Samsung Galaxy S24 Ultra',
 '200MP camera, Snapdragon 8 Gen 3, built-in S Pen, 5000mAh battery, AI-powered features.',
 124999, 144999, 'Electronics', 'Samsung', 25,
 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600',
 ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
 4.7, 3412, ARRAY['samsung','smartphone','android'], TRUE),

('MacBook Pro 14" M3',
 'M3 chip, 16GB RAM, 512GB SSD, Liquid Retina XDR display, 22-hour battery life.',
 199900, 229900, 'Electronics', 'Apple', 15,
 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
 ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600','https://images.unsplash.com/photo-1611186871525-3b15c2e6f6c5?w=600'],
 4.9, 1823, ARRAY['macbook','laptop','apple'], TRUE),

('LG 27" 4K IPS Monitor',
 'Ultra HD 4K IPS display, 99% sRGB, HDR400, USB-C power delivery, ergonomic stand.',
 32999, 42999, 'Electronics', 'LG', 40,
 'https://images.unsplash.com/photo-1527443224154-c4a573d5f5f2?w=600',
 ARRAY['https://images.unsplash.com/photo-1527443224154-c4a573d5f5f2?w=600'],
 4.6, 987, ARRAY['monitor','4k','display'], FALSE),

-- Fashion
('Nike Air Max 270',
 'Nike''s tallest Air unit yet gives you a super-soft ride that feels as impossible as it looks.',
 12999, 16999, 'Fashion', 'Nike', 100,
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
 ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600','https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600'],
 4.5, 4521, ARRAY['shoes','nike','running'], TRUE),

('Levi''s 511 Slim Fit Jeans',
 'The slim fit jean that started it all. Sits below waist, slim through hip and thigh, straight leg.',
 3999, 5499, 'Fashion', 'Levi''s', 200,
 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600',
 ARRAY['https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600'],
 4.3, 2100, ARRAY['jeans','denim','fashion'], FALSE),

('Ray-Ban Aviator Sunglasses',
 'Classic aviator style with UV protection. Gold metal frame, green crystal lens.',
 8999, 12000, 'Fashion', 'Ray-Ban', 75,
 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600',
 ARRAY['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'],
 4.6, 3200, ARRAY['sunglasses','eyewear','fashion'], FALSE),

-- Home & Lifestyle
('Dyson V15 Detect Vacuum',
 'Laser Detect technology reveals microscopic dust. 60-min run time, auto boost suction.',
 52900, 64900, 'Home & Kitchen', 'Dyson', 20,
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
 ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
 4.8, 1456, ARRAY['vacuum','dyson','home'], TRUE),

('Instant Pot Duo 7-in-1',
 'Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, warmer.',
 8999, 12999, 'Home & Kitchen', 'Instant Pot', 60,
 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
 ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
 4.7, 8921, ARRAY['cooking','kitchen','instant-pot'], FALSE),

('IKEA POÄNG Armchair',
 'Layer-glued bent beech frame gives comfortable resilience. Choose cover separately.',
 12999, 15999, 'Furniture', 'IKEA', 30,
 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
 ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
 4.4, 2341, ARRAY['chair','furniture','ikea'], FALSE),

('Scented Luxury Candle Set',
 'Set of 6 hand-poured soy wax candles with calming fragrances. 40+ hour burn time each.',
 2999, 4500, 'Home & Kitchen', 'Aromatic Co', 150,
 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600',
 ARRAY['https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600'],
 4.5, 892, ARRAY['candles','home-decor','lifestyle'], FALSE),

-- Books
('Atomic Habits — James Clear',
 'No.1 New York Times bestseller. Tiny changes, remarkable results. The definitive guide to habit formation.',
 699, 999, 'Books', 'Penguin', 500,
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
 ARRAY['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'],
 4.9, 12453, ARRAY['self-help','habits','bestseller'], FALSE),

('The Psychology of Money',
 'Timeless lessons on wealth, greed, and happiness by Morgan Housel. A must-read for every investor.',
 599, 899, 'Books', 'Jaico', 400,
 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600',
 ARRAY['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600'],
 4.8, 8321, ARRAY['finance','money','investing'], FALSE),

-- Sports
('Fitbit Charge 6',
 'Built-in GPS, heart rate monitoring, sleep tracking, 7-day battery, 40+ exercise modes.',
 14999, 19999, 'Sports', 'Fitbit', 80,
 'https://images.unsplash.com/photo-1575311373937-040b8e1fd6b3?w=600',
 ARRAY['https://images.unsplash.com/photo-1575311373937-040b8e1fd6b3?w=600'],
 4.4, 3201, ARRAY['fitness','tracker','wearable'], FALSE),

('Yoga Mat Premium',
 'Non-slip 6mm thick yoga mat with alignment lines, carrying strap. Eco-friendly TPE material.',
 1999, 3500, 'Sports', 'YogaFlow', 200,
 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
 ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600'],
 4.6, 1823, ARRAY['yoga','fitness','wellness'], FALSE),

-- Beauty
('Charlotte Tilbury Pillow Talk Lipstick',
 'The world''s best-selling lip liner and lipstick duo in the iconic Pillow Talk pink-nude shade.',
 3999, 5200, 'Beauty', 'Charlotte Tilbury', 120,
 'https://images.unsplash.com/photo-1586495777744-4e6232bf8ec5?w=600',
 ARRAY['https://images.unsplash.com/photo-1586495777744-4e6232bf8ec5?w=600'],
 4.7, 4512, ARRAY['makeup','lipstick','beauty'], FALSE),

('The Ordinary Skincare Set',
 'Complete routine: Hyaluronic Acid, Niacinamide, Retinol, AHA/BHA. Dermatologist recommended.',
 4999, 7500, 'Beauty', 'The Ordinary', 90,
 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
 ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'],
 4.8, 6234, ARRAY['skincare','beauty','routine'], TRUE),

-- Gaming
('PlayStation 5 Console',
 'Experience lightning-fast loading with PS5''s ultra-high speed SSD. Haptic feedback DualSense.',
 54990, 59990, 'Gaming', 'Sony', 10,
 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600',
 ARRAY['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600'],
 4.9, 9821, ARRAY['ps5','gaming','console'], TRUE),

('Razer DeathAdder V3 Mouse',
 'Ultra-lightweight 63g gaming mouse, Focus Pro 30K sensor, 90-hour battery, optical switches.',
 8999, 11999, 'Gaming', 'Razer', 60,
 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600',
 ARRAY['https://images.unsplash.com/photo-1527814050087-3793815479db?w=600'],
 4.6, 2341, ARRAY['gaming','mouse','razer'], FALSE);

-- ============================================================
-- SEED DATA — COUPONS
-- ============================================================
INSERT INTO coupons (code, discount_percent, max_uses, expires_at) VALUES
('NEXCART10', 10, 1000, NOW() + INTERVAL '1 year'),
('WELCOME20', 20, 500, NOW() + INTERVAL '6 months'),
('SALE30', 30, 100, NOW() + INTERVAL '1 month'),
('FIRST50', 50, 50, NOW() + INTERVAL '2 weeks');

-- ============================================================
-- SEED DATA — REVIEWS
-- ============================================================
-- We'll add reviews for user 2 (john) on first few products
INSERT INTO reviews (user_id, product_id, rating, title, body) VALUES
(2, 1, 5, 'Absolutely incredible headphones!', 'Best noise cancellation I have ever experienced. Worth every rupee.'),
(2, 2, 5, 'iPhone 15 Pro is a beast', 'The camera quality is phenomenal. Action button is a game changer.'),
(2, 6, 4, 'Great shoes, super comfy', 'Bought these for daily runs. Very comfortable, cushioning is top notch.'),
(3, 1, 4, 'Great but expensive', 'Amazing sound quality but the price is steep. Good for professionals.'),
(3, 4, 5, 'MacBook is perfect', 'M3 chip is incredibly fast. Battery life is unreal at 22 hours.'),
(3, 19, 5, 'PS5 is worth the wait', 'Finally got my hands on one. The haptic feedback is mind blowing.');

-- Update review counts and ratings
UPDATE products SET review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = products.id),
                   rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE product_id = products.id), products.rating)
WHERE id IN (SELECT DISTINCT product_id FROM reviews);

SELECT 'Database schema and seed data applied successfully!' AS status;
