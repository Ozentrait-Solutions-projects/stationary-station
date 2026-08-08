const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { getFileUrl } = require('../middleware/upload');
const { sendOrderStatusEmail, sendProductOutOfStockEmail } = require('../utils/mailer');


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

    // Fetch items and user email for email notification
    const itemsResult = await db.query(
      `SELECT oi.*, p.title, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [id]
    );
    const userResult = await db.query(
      `SELECT email FROM users WHERE id = $1`,
      [rows[0].user_id]
    );

    const fullOrder = { ...rows[0], items: itemsResult.rows };
    if (userResult.rows.length) {
      sendOrderStatusEmail(userResult.rows[0].email, fullOrder).catch(err => {
        console.error(`Failed to send order status update email: ${err.message}`);
      });
    }

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

// ─── CREATE PRODUCT ────────────────────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, original_price, category, brand, stock, image_url, images, tags, is_featured, sale_price, return_exchange_available } = req.body;
    if (!title || !price || !category) return res.status(400).json({ message: 'title, price, category required' });
    if (stock === undefined || stock === null || stock === '') return res.status(400).json({ message: 'stock is required' });

    const parsedStock = parseNumberField(stock);
    if (parsedStock === null || parsedStock < 0) {
      return res.status(400).json({ message: 'stock must be a valid non-negative number' });
    }

    // req.file is the locally stored file; getLocalFileUrl converts it to a /uploads/... path
    const uploadedImageUrl = getFileUrl(req?.file);

    const finalImageUrl = uploadedImageUrl || image_url || null;
    const finalImages = parseArrayField(images);
    const finalTags = parseArrayField(tags);
    const finalFeatured = parseBooleanField(is_featured) || false;
    const finalReturnExchange = parseBooleanField(return_exchange_available);
    const finalSalePrice = parseNumberField(sale_price);

    const { rows } = await db.query(
      `INSERT INTO products (title, description, price, original_price, category, brand, stock, image_url, images, tags, is_featured, sale_price, return_exchange_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        title,
        description,
        Number(price),
        parseNumberField(original_price),
        category,
        brand,
        parsedStock,
        finalImageUrl,
        finalImages,
        finalTags,
        finalFeatured,
        finalSalePrice,
        finalReturnExchange !== null ? finalReturnExchange : true,
      ]
    );
    
    if (rows[0] && Number(rows[0].stock) === 0) {
      sendProductOutOfStockEmail(req.user.email, rows[0]).catch(err => {
        console.error(`Failed to send out of stock email to admin: ${err.message}`);
      });
    }

    res.status(201).json({ product: rows[0] });
  } catch (err) { next(err); }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, original_price, category, brand, stock, image_url, images, tags, is_featured, sale_price, return_exchange_available } = req.body;

    // Check if product exists
    const existing = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Product not found.' });

    const currentProduct = existing.rows[0];

    // Validate sale_price if present in body
    let finalSalePrice = currentProduct.sale_price !== null ? Number(currentProduct.sale_price) : null;
    if (sale_price !== undefined) {
      if (sale_price === null || sale_price === '') {
        finalSalePrice = null;
      } else {
        const num = Number(sale_price);
        if (Number.isNaN(num) || num <= 0) {
          return res.status(400).json({ message: 'Please enter a valid sale price.' });
        }
        const effectivePrice = price !== undefined && price !== null && price !== '' ? Number(price) : Number(currentProduct.price);
        if (num >= effectivePrice) {
          return res.status(400).json({ message: 'Sale price must be lower than the original price.' });
        }
        finalSalePrice = num;
      }
    }

    const uploadedImageUrl = getFileUrl(req?.file);
    const finalImageUrl = uploadedImageUrl || image_url;
    const finalImages = images === undefined ? null : parseArrayField(images);
    const finalTags = tags === undefined ? null : parseArrayField(tags);
    const finalFeatured = parseBooleanField(is_featured);
    const finalReturnExchange = parseBooleanField(return_exchange_available);

    // Build dynamic UPDATE query to handle NULL sale_price and untouched fields properly
    const updates = [];
    const values = [];
    let idx = 1;

    if (title !== undefined && title !== null) { updates.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined && description !== null) { updates.push(`description = $${idx++}`); values.push(description); }
    if (price !== undefined && parseNumberField(price) !== null) { updates.push(`price = $${idx++}`); values.push(parseNumberField(price)); }
    if (original_price !== undefined) { updates.push(`original_price = $${idx++}`); values.push(parseNumberField(original_price)); }
    if (category !== undefined && category !== null) { updates.push(`category = $${idx++}`); values.push(category); }
    if (brand !== undefined) { updates.push(`brand = $${idx++}`); values.push(brand); }
    if (stock !== undefined && parseNumberField(stock) !== null) { updates.push(`stock = $${idx++}`); values.push(parseNumberField(stock)); }
    if (finalImageUrl !== undefined && finalImageUrl !== null) { updates.push(`image_url = $${idx++}`); values.push(finalImageUrl); }
    if (finalImages !== null) { updates.push(`images = $${idx++}`); values.push(finalImages); }
    if (finalTags !== null) { updates.push(`tags = $${idx++}`); values.push(finalTags); }
    if (finalFeatured !== null) { updates.push(`is_featured = $${idx++}`); values.push(finalFeatured); }
    if (finalReturnExchange !== null) { updates.push(`return_exchange_available = $${idx++}`); values.push(finalReturnExchange); }

    // Always update sale_price if specified in payload
    if (sale_price !== undefined) {
      updates.push(`sale_price = $${idx++}`);
      values.push(finalSalePrice);
    }

    if (updates.length === 0) {
      return res.json({ product: currentProduct });
    }

    values.push(id);
    const queryText = `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await db.query(queryText, values);

    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    if (Number(rows[0].stock) === 0) {
      sendProductOutOfStockEmail(req.user.email, rows[0]).catch(err => {
        console.error(`Failed to send out of stock email to admin: ${err.message}`);
      });
    }

    res.json({ product: rows[0] });
  } catch (err) { next(err); }
};

// ─── DELETE PRODUCT ──────────────────────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch the image URL before deleting so we can remove it from S3
    const existing = await db.query('SELECT image_url FROM products WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Product not found.' });

    const { rows } = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    // Delete local file if stored in uploads/ (fire-and-forget)
    const imageUrl = existing.rows[0].image_url;
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', imageUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.warn('⚠️ Could not delete local image:', err.message);
      });
    }

    res.json({ message: 'Product deleted', id: rows[0].id });

  } catch (err) { next(err); }
};

const formatReturnRequestWithEvidence = (row) => {
  if (!row) return row;
  let photos = row.photo_urls || [];
  if (typeof photos === 'string') {
    if (photos.startsWith('{') && photos.endsWith('}')) {
      photos = photos.slice(1, -1).split(',').map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
    } else {
      try { photos = JSON.parse(photos); } catch (_) { photos = [photos]; }
    }
  }
  if (!Array.isArray(photos)) photos = [];

  const evidence = [];
  photos.forEach(url => {
    if (url) evidence.push({ type: 'image', url });
  });
  if (row.video_url) {
    evidence.push({ type: 'video', url: row.video_url });
  }

  return {
    ...row,
    photo_urls: photos,
    evidence,
  };
};

// ─── GET ALL RETURN REQUESTS (ADMIN) ───────────────────────────────
const getReturnRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (status) { params.push(status); where = `WHERE rr.status = $1`; }

    const { rows } = await db.query(
      `SELECT rr.*, u.name as user_name, u.email as user_email,
              p.title as product_title, p.image_url as product_image
       FROM return_requests rr
       JOIN users u ON rr.user_id = u.id
       LEFT JOIN products p ON rr.product_id = p.id
       ${where}
       ORDER BY rr.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );
    const count = await db.query(
      `SELECT COUNT(*) FROM return_requests rr ${where}`, params
    );
    res.json({ requests: rows.map(formatReturnRequestWithEvidence), total: parseInt(count.rows[0].count) });
  } catch (err) { next(err); }
};

// ─── UPDATE RETURN STATUS (ADMIN) ───────────────────────────────────
const updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status, admin_notes, rejection_reason } = req.body;

    const notes = admin_notes || rejection_reason || '';

    // Map uppercase or alias status values to canonical database status values
    const statusMap = {
      RETURN_REQUESTED: 'pending',
      RETURN_APPROVED: 'approved',
      RETURN_REJECTED: 'rejected',
      RETURN_PROCESSING: 'pending',
      RETURN_COMPLETED: 'approved',
    };
    if (statusMap[status]) status = statusMap[status];

    const valid = ['pending', 'evidence_submitted', 'approved', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid return status' });
    }

    if (status === 'rejected' && (!notes || !notes.trim())) {
      return res.status(400).json({ message: 'Please provide a reason for rejecting this return request.' });
    }

    const adminUserId = req.user?.id || null;

    const { rows } = await db.query(
      `UPDATE return_requests SET
        status = $1::varchar,
        admin_notes = $2,
        rejection_reason = $2,
        updated_at = NOW(),
        approved_at = CASE WHEN $1::varchar = 'approved' THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN $1::varchar = 'rejected' THEN NOW() ELSE rejected_at END,
        processed_by = COALESCE($3, processed_by)
       WHERE id = $4 RETURNING *`,
      [status, notes.trim() || null, adminUserId, id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Return request not found.' });
    res.json({ request: formatReturnRequestWithEvidence(rows[0]) });
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getOrderDetails, getAllOrders, updateOrderStatus, getAllUsers, createProduct, updateProduct, deleteProduct, getReturnRequests, getAllReturnRequests: getReturnRequests, updateReturnStatus };
