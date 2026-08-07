-- ============================================================
-- NexCart — 100% Stationery Marketplace Database Schema
-- ============================================================

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
-- SEED DATA — USERS (password: password123)
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@nexcart.com', '$2b$10$gUxqLvMtNx/CT7MT9e19F.oSWEHs9v7BgugDmx7Ksxxs2L3ksbeOW', 'admin'),
('John Doe', 'john@example.com', '$2b$10$gUxqLvMtNx/CT7MT9e19F.oSWEHs9v7BgugDmx7Ksxxs2L3ksbeOW', 'user'),
('Jane Smith', 'jane@example.com', '$2b$10$gUxqLvMtNx/CT7MT9e19F.oSWEHs9v7BgugDmx7Ksxxs2L3ksbeOW', 'user');


-- ============================================================
-- SEED DATA — 100% STATIONERY PRODUCTS
-- ============================================================
INSERT INTO products (title, description, price, original_price, category, brand, stock, image_url, images, rating, review_count, tags, is_featured) VALUES

-- ── WRITING INSTRUMENTS ──────────────────────────────────────
('Parker Sonnet Gold Trim Fountain Pen',
 'Hand-crafted 18K solid gold nib fountain pen with deep black lacquer finish and 23K gold plated trim. Engineered for flawless precision and luxury writing.',
 4999.00, 6500.00, 'Writing', 'Parker', 25,
 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=85','https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&q=85'],
 4.9, 142, ARRAY['fountain-pen','luxury','parker','writing'], TRUE),

('Faber-Castell Grip 2011 Gel Pen Set (Pack of 5)',
 'Ergonomic triangular barrel with raised dot grip zone for effortless writing. Fast-drying, smudge-proof gel ink in rich black and blue shades.',
 499.00, 699.00, 'Writing', 'Faber-Castell', 120,
 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=85'],
 4.7, 512, ARRAY['gel-pen','faber-castell','pens','office'], TRUE),

('Pilot G2 Premium Retractable Gel Pens 0.7mm (Pack of 10)',
 'America''s #1 selling gel ink pen. Dynamic Gel Ink Formula for ultra-smooth skip-free writing with contoured rubber grip.',
 899.00, 1200.00, 'Writing', 'Pilot', 90,
 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&q=85'],
 4.8, 890, ARRAY['pilot','gel-pens','writing','school'], TRUE),

('Rotring 800 Mechanical Pencil 0.5mm Full Metal Body',
 'Iconic precision mechanical pencil with brass mechanism and retractable lead guide pipe. Hexagonal matte black metal body.',
 3499.00, 4500.00, 'Writing', 'Rotring', 35,
 'https://images.unsplash.com/photo-1603513492128-ba7bc9b3e143?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1603513492128-ba7bc9b3e143?w=600&q=85'],
 4.9, 210, ARRAY['mechanical-pencil','rotring','drafting','architecture'], TRUE),

('Staedtler Mars Lumograph Pencil Set (12 Degrees)',
 'Premium quality drawing pencils ranging from 6H to 8B. Super-bonded lead resists breaking, ideal for technical drawing and shading.',
 1250.00, 1600.00, 'Writing', 'Staedtler', 75,
 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=85'],
 4.8, 340, ARRAY['pencils','drawing','staedtler','art'], FALSE),

('STABILO BOSS ORIGINAL Pastel Highlighters (Pack of 6)',
 'The classic highlighter in soft pastel colors. Anti-Dry-Out technology allows 4 hours cap-off time without drying.',
 699.00, 899.00, 'Markers & Highlighters', 'Stabilo', 200,
 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=85'],
 4.9, 1250, ARRAY['highlighters','stabilo','pastel','study'], TRUE),

-- ── NOTEBOOKS & DIARIES ──────────────────────────────────────
('Moleskine Classic Hardcover Journal (Large, Dotted, Black)',
 'The legendary notebook used by artists and thinkers. Thread-bound hard cover, 240 acid-free ivory pages, inner expandable pocket.',
 2199.00, 2799.00, 'Notebooks', 'Moleskine', 60,
 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=85','https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=85'],
 4.9, 640, ARRAY['moleskine','notebook','bullet-journal','hardbound'], TRUE),

('Leuchtturm1917 A5 Medium Dotted Hardcover Notebook',
 'Masterwork German engineering with 251 numbered pages, 80gsm ink-proof paper, double page marker, and blank table of contents.',
 2499.00, 3100.00, 'Notebooks', 'Leuchtturm1917', 45,
 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=85'],
 4.8, 480, ARRAY['journal','leuchtturm','dotted','bestseller'], TRUE),

('Classmate Pulse 5-Subject Spiral Notebook 300 Pages',
 'High quality bright white paper with durable polypropylene cover and mobile pocket separator. Smooth twin-wire binding.',
 299.00, 399.00, 'Notebooks', 'Classmate', 300,
 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=85'],
 4.6, 1850, ARRAY['classmate','spiral-notebook','student','college'], FALSE),

('Paperkraft Executive Leatherette 2026 Daily Planner',
 'Handcrafted vegan leather daily planner with magnetic closure, ribbon bookmark, pen loop, and gold gilded page edges.',
 1499.00, 2199.00, 'Diaries', 'Paperkraft', 40,
 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=85'],
 4.7, 310, ARRAY['diary','planner','paperkraft','executive'], TRUE),

('Post-it Super Sticky Notes 3x3 Inches (Pack of 6 Pads)',
 '2x the sticking power. Stick and re-stick effortlessly on walls, monitors, and doors without residue.',
 549.00, 750.00, 'Notebooks', '3M Post-it', 250,
 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=85'],
 4.8, 1420, ARRAY['sticky-notes','post-it','office','memo'], FALSE),

-- ── OFFICE & DESK SUPPLIES ──────────────────────────────────
('Casio FX-991EX ClassWiz Non-Programmable Scientific Calculator',
 'High-resolution LCD display with 552 functions. Solar + battery dual power. Approved for board & competitive exams.',
 1495.00, 1795.00, 'Calculators', 'Casio', 150,
 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&q=85'],
 4.9, 3210, ARRAY['calculator','casio','scientific','engineering'], TRUE),

('Natural Bamboo Desk Organizer with Phone Stand',
 'Eco-friendly solid bamboo organizer featuring 6 compartments for pens, sticky notes, paperclips, and smartphone dock.',
 1299.00, 1899.00, 'Desk Accessories', 'EcoDesk', 80,
 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=85'],
 4.7, 275, ARRAY['desk-organizer','bamboo','office','wooden'], TRUE),

('Magnetic Dry Erase Whiteboard (2x3 Feet) with Marker Holder',
 'Premium scratch-resistant aluminum frame whiteboard with smooth surface. Includes 4 markers, eraser, and 6 magnets.',
 1999.00, 2800.00, 'Office Supplies', 'Whitemark', 50,
 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=85'],
 4.6, 410, ARRAY['whiteboard','office','magnetic','presentation'], FALSE),

('TaoTronics Dimmable LED Desk Lamp with Wireless Charging',
 '5 color modes and 7 brightness levels with eye-caring flicker-free light. Integrated 10W Fast Qi Wireless Charger.',
 2999.00, 4200.00, 'Desk Accessories', 'TaoTronics', 40,
 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=600&q=85'],
 4.8, 590, ARRAY['desk-lamp','led','study','office'], TRUE),

('Kangaro Heavy Duty Expanding File Folder A4 (12 Pockets)',
 'Durable poly folder with index tab labels and secure elastic band closure. Holds up to 1000 sheets.',
 649.00, 899.00, 'Files & Folders', 'Kangaro', 110,
 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=85'],
 4.5, 330, ARRAY['files','folders','kangaro','organization'], FALSE),

-- ── ART & CRAFT ─────────────────────────────────────────────
('Winsor & Newton Cotman Water Colour Studio Set (45 Half Pans)',
 'Professional quality watercolor set with high pigment load and optimal transparency. Includes pocket brush and mixing palette.',
 6499.00, 8500.00, 'Colors & Paints', 'Winsor & Newton', 20,
 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=85'],
 4.9, 185, ARRAY['watercolors','art','winsor-newton','painting'], TRUE),

('Faber-Castell Albrecht Dürer Watercolour Pencils (24 Set)',
 'Unsurpassed lightfastness and brilliance. Soft, vibrant color stroke turns into rich watercolor with a wet brush.',
 3999.00, 5200.00, 'Colors & Paints', 'Faber-Castell', 30,
 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=85'],
 4.8, 290, ARRAY['colored-pencils','faber-castell','art','drawing'], TRUE),

('Tombow Dual Brush Pen Art Markers (10 Pastel Shades)',
 'Flexible brush tip and fine tip in one marker. Water-based ink blends seamlessly for hand lettering and watercolor art.',
 1999.00, 2699.00, 'Markers & Highlighters', 'Tombow', 65,
 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=85'],
 4.9, 610, ARRAY['tombow','brush-pen','lettering','calligraphy'], TRUE),

('Canson XL Series Watercolor Paper Pad A4 300gsm (30 Sheets)',
 'Cold press textured 140lb heavyweight paper suitable for watercolor, acrylic, and gouache without warping.',
 1150.00, 1500.00, 'Art & Craft', 'Canson', 85,
 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=85'],
 4.7, 440, ARRAY['canson','watercolor-paper','art-pad','sketchbook'], FALSE),

-- ── SCHOOL & BACKPACKS ──────────────────────────────────────
('Wildcraft Workpacks Ergonomic Laptop Backpack 30L',
 'Multi-compartment water-resistant school and college backpack with padded back system and rain cover.',
 1799.00, 2499.00, 'Backpacks', 'Wildcraft', 100,
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=85'],
 4.6, 920, ARRAY['backpack','wildcraft','school','bag'], TRUE),

('Maped Helix Oxford Metal Geometry Box Set',
 'Classic metal tin box containing compass, divider, protractor, set squares, ruler, pencil, eraser, and sharpener.',
 399.00, 599.00, 'School Supplies', 'Maped', 180,
 'https://images.unsplash.com/photo-1584697964400-2ae6b29675ae?w=600&q=85',
 ARRAY['https://images.unsplash.com/photo-1584697964400-2ae6b29675ae?w=600&q=85'],
 4.5, 730, ARRAY['geometry-box','maped','school','math'], FALSE);

-- ============================================================
-- SEED DATA — COUPONS
-- ============================================================
INSERT INTO coupons (code, discount_percent, max_uses, expires_at) VALUES
('NEXCART10', 10, 1000, NOW() + INTERVAL '1 year'),
('STATIONERY20', 20, 500, NOW() + INTERVAL '6 months'),
('STUDENT30', 30, 100, NOW() + INTERVAL '1 month'),
('WELCOME50', 50, 50, NOW() + INTERVAL '2 weeks');

-- ============================================================
-- SEED DATA — REVIEWS
-- ============================================================
INSERT INTO reviews (user_id, product_id, rating, title, body) VALUES
(2, 1, 5, 'The ultimate writing instrument!', 'The gold nib glides on paper like butter. A true heirloom piece.'),
(2, 7, 5, 'Best journal I have ever owned', 'The paper quality handles fountain pen ink without any ghosting or bleeding.'),
(2, 12, 5, 'Lifesaver for engineering exams', 'ClassWiz screen is sharp and natural display makes calculations effortless.'),
(3, 2, 4, 'Very smooth and comfortable grip', 'Love the raised dot grip. Writes cleanly without smudging.'),
(3, 6, 5, 'Gorgeous pastel shades', 'Does not bleed through standard notebook paper. Perfect for bullet journaling.');

-- Update review counts and ratings
UPDATE products SET review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = products.id),
                   rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE product_id = products.id), products.rating)
WHERE id IN (SELECT DISTINCT product_id FROM reviews);

SELECT 'Stationery database schema and seed data applied successfully!' AS status;
