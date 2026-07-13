const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../middleware/upload');
const db = require('../config/db');

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const parseBooleanField = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const parseNumberField = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const [totalRevenue, totalOrders, totalUsers, totalProducts, recentOrders, revenueByDay, topProducts] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(final_price), 0) as total FROM orders WHERE status != 'cancelled'`),
      db.query(`SELECT COUNT(*) as total FROM orders`),
      db.query(`SELECT COUNT(*) as total FROM users WHERE role = 'user'`),
      db.query(`SELECT COUNT(*) as total FROM products`),
      db.query(`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10`),
      db.query(`SELECT DATE(created_at) as date, SUM(final_price) as revenue, COUNT(*) as orders
                FROM orders WHERE created_at > NOW() - INTERVAL '30 days' AND status != 'cancelled'
                GROUP BY DATE(created_at) ORDER BY date ASC`),
      db.query(`SELECT p.title, p.image_url, p.category, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price_at_purchase) as revenue
                FROM order_items oi JOIN products p ON oi.product_id = p.id
                GROUP BY p.id ORDER BY total_sold DESC LIMIT 5`),
    ]);

    res.json({
      stats: {
        totalRevenue: parseFloat(totalRevenue.rows[0].total),
        totalOrders: parseInt(totalOrders.rows[0].total),
        totalUsers: parseInt(totalUsers.rows[0].total),
        totalProducts: parseInt(totalProducts.rows[0].total),
      },
      recentOrders: recentOrders.rows,
      revenueByDay: revenueByDay.rows,
      topProducts: topProducts.rows,
    });
  } catch (err) { next(err); }
};

// ─── GET SINGLE ORDER DETAILS (ADMIN) ──────────────────────────
const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });

    const items = await db.query(
      `SELECT oi.*, p.title, p.image_url, p.category, p.brand
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ order: { ...rows[0], items: items.rows } });
  } catch (err) { next(err); }
};

// ─── GET ALL ORDERS (ADMIN) ──────────────────────────────────────
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (status) { params.push(status); where = `WHERE o.status = $1`; }

    const { rows } = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${where} ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );
    const count = await db.query(`SELECT COUNT(*) FROM orders ${where}`, params);
    res.json({ orders: rows, total: parseInt(count.rows[0].count) });
  } catch (err) { next(err); }
};

// ─── UPDATE ORDER STATUS ─────────────────────────────────────────
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const { rows } = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json({ order: rows[0] });
  } catch (err) { next(err); }
};

// ─── GET ALL USERS ───────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, avatar, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
};

// ─── CREATE PRODUCT ──────────────────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, original_price, category, brand, stock, image_url, images, tags, is_featured } = req.body;
    if (!title || !price || !category) return res.status(400).json({ message: 'title, price, category required' });

    // req.file.location is the full S3 HTTPS URL provided by multer-s3
    const uploadedImageUrl = req.file ? req.file.location : null;
    const finalImageUrl = uploadedImageUrl || image_url || null;
    const finalImages = parseArrayField(images);
    const finalTags = parseArrayField(tags);
    const finalFeatured = parseBooleanField(is_featured) || false;

    const { rows } = await db.query(
      `INSERT INTO products (title, description, price, original_price, category, brand, stock, image_url, images, tags, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        title,
        description,
        Number(price),
        parseNumberField(original_price),
        category,
        brand,
        parseNumberField(stock) ?? 0,
        finalImageUrl,
        finalImages,
        finalTags,
        finalFeatured,
      ]
    );
    res.status(201).json({ product: rows[0] });
  } catch (err) { next(err); }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, original_price, category, brand, stock, image_url, images, tags, is_featured } = req.body;

    // req.file.location is the full S3 HTTPS URL provided by multer-s3
    const uploadedImageUrl = req.file ? req.file.location : null;
    const finalImageUrl = uploadedImageUrl || image_url;
    const finalImages = images === undefined ? null : parseArrayField(images);
    const finalTags = tags === undefined ? null : parseArrayField(tags);
    const finalFeatured = parseBooleanField(is_featured);

    const { rows } = await db.query(
      `UPDATE products SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        price = COALESCE($3, price), original_price = COALESCE($4, original_price),
        category = COALESCE($5, category), brand = COALESCE($6, brand),
        stock = COALESCE($7, stock), image_url = COALESCE($8, image_url),
        images = COALESCE($9, images), tags = COALESCE($10, tags),
        is_featured = COALESCE($11, is_featured)
       WHERE id = $12 RETURNING *`,
      [
        title,
        description,
        parseNumberField(price),
        parseNumberField(original_price),
        category,
        brand,
        parseNumberField(stock),
        finalImageUrl,
        finalImages,
        finalTags,
        finalFeatured,
        id,
      ]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) { next(err); }
};

// ─── DELETE PRODUCT ──────────────────────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch the image URL before deleting so we can remove it from S3
    const existing = await db.query('SELECT image_url FROM products WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Product not found' });

    const { rows } = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });

    // Delete the image from S3 (fire-and-forget, non-blocking)
    const imageUrl = existing.rows[0].image_url;
    if (imageUrl && imageUrl.includes('.amazonaws.com/')) {
      const key = imageUrl.split('.amazonaws.com/')[1];
      s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })).catch((err) => console.warn('⚠️ Could not delete S3 image:', err.message));
    }

    res.json({ message: 'Product deleted', id: rows[0].id });
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getOrderDetails, getAllOrders, updateOrderStatus, getAllUsers, createProduct, updateProduct, deleteProduct };
