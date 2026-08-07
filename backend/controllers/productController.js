const db = require('../config/db');

// ─── GET ALL PRODUCTS (with filtering, sorting, pagination) ──────
const getProducts = async (req, res, next) => {
  try {
    const {
      category, minPrice, maxPrice, minRating,
      sort = 'created_at_desc', search, page = 1, limit = 12,
      featured,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`LOWER(category) = LOWER($${params.length})`);
    }
    if (minPrice) {
      params.push(Number(minPrice));
      conditions.push(`price >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(Number(maxPrice));
      conditions.push(`price <= $${params.length}`);
    }
    if (minRating) {
      params.push(Number(minRating));
      conditions.push(`rating >= $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(LOWER(title) LIKE LOWER($${params.length}) OR LOWER(brand) LIKE LOWER($${params.length}) OR LOWER(description) LIKE LOWER($${params.length}))`);
    }
    if (featured === 'true') {
      conditions.push(`is_featured = TRUE`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortMap = {
      price_asc:        'price ASC',
      price_desc:       'price DESC',
      rating_desc:      'rating DESC',
      created_at_desc:  'created_at DESC',
      popularity:       'review_count DESC',
    };
    const orderBy = sortMap[sort] || 'created_at DESC';

    // Count total
    const countResult = await db.query(`SELECT COUNT(*) FROM products ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Fetch page
    params.push(parseInt(limit));
    params.push(offset);
    const { rows } = await db.query(
      `SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      products: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE PRODUCT ──────────────────────────────────────────
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });

    // Fetch reviews with user name
    const reviews = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({ product: rows[0], reviews: reviews.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET CATEGORIES ──────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC`
    );
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET FEATURED PRODUCTS ───────────────────────────────────────
const getFeatured = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM products WHERE is_featured = TRUE ORDER BY rating DESC LIMIT 8'
    );
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET RECENTLY VIEWED ─────────────────────────────────────────
const getRecentlyViewed = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.* FROM recently_viewed rv
       JOIN products p ON rv.product_id = p.id
       WHERE rv.user_id = $1
       ORDER BY rv.viewed_at DESC LIMIT 8`,
      [req.user.id]
    );
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
};

// ─── TRACK RECENTLY VIEWED ───────────────────────────────────────
const trackView = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query(
      `INSERT INTO recently_viewed (user_id, product_id, viewed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = NOW()`,
      [req.user.id, id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ─── CHECK PURCHASED ─────────────────────────────────────────────
const checkPurchased = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
       LIMIT 1`,
      [req.user.id, id]
    );
    res.json({ purchased: rows.length > 0 });
  } catch (err) { next(err); }
};

// ─── ADD REVIEW (verified purchase only) ──────────────────────────
const addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, body } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // ── Verified purchase check ───────────────────────────────────
    const purchaseCheck = await db.query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
       LIMIT 1`,
      [req.user.id, id]
    );
    if (!purchaseCheck.rows.length) {
      return res.status(403).json({
        message: 'Only verified purchasers who have received this product can submit a review.',
      });
    }

    // Check if user already reviewed this product
    const reviewCheck = await db.query(
      `SELECT 1 FROM reviews WHERE user_id = $1 AND product_id = $2`,
      [req.user.id, id]
    );
    if (reviewCheck.rows.length) {
      return res.status(400).json({
        message: 'You have already reviewed this product.',
      });
    }

    const { rows } = await db.query(
      `INSERT INTO reviews (user_id, product_id, rating, title, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, id, rating, title, body]
    );

    // Update product rating
    await db.query(
      `UPDATE products SET
        rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE product_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
       WHERE id = $1`,
      [id]
    );

    const review = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
      [rows[0].id]
    );

    res.status(201).json({ review: review.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── SEARCH SUGGESTIONS ──────────────────────────────────────────
const searchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const { rows } = await db.query(
      `SELECT id, title, category, image_url, price FROM products
       WHERE LOWER(title) LIKE LOWER($1) OR LOWER(brand) LIKE LOWER($1)
       LIMIT 6`,
      [`%${q}%`]
    );
    res.json({ suggestions: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts, getProduct, getCategories, getFeatured,
  getRecentlyViewed, trackView, addReview, searchSuggestions, checkPurchased,
};
