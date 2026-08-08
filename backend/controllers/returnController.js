const db = require('../config/db');
const { getFileUrl } = require('../middleware/upload');

// ─── CREATE RETURN / EXCHANGE REQUEST ─────────────────────────────
const createReturnRequest = async (req, res, next) => {
  try {
    const { order_id, order_item_id, product_id, type = 'return', reason } = req.body;

    if (!order_id || !product_id) {
      return res.status(400).json({ message: 'order_id and product_id are required' });
    }
    if (!['return', 'exchange'].includes(type)) {
      return res.status(400).json({ message: 'type must be "return" or "exchange"' });
    }

    // Verify the order belongs to this user and is delivered
    const orderCheck = await db.query(
      `SELECT o.id, o.status FROM orders o WHERE o.id = $1 AND o.user_id = $2`,
      [order_id, req.user.id]
    );
    if (!orderCheck.rows.length) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (orderCheck.rows[0].status !== 'delivered') {
      return res.status(400).json({ message: 'Return/Exchange requests can only be made for delivered orders' });
    }

    // Check product is in the order
    const itemCheck = await db.query(
      `SELECT oi.id FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = $2`,
      [order_id, product_id]
    );
    if (!itemCheck.rows.length) {
      return res.status(400).json({ message: 'Product not found in this order' });
    }

    // Check if return request already exists for this item
    const existing = await db.query(
      `SELECT id, status FROM return_requests WHERE order_id = $1 AND product_id = $2 AND user_id = $3`,
      [order_id, product_id, req.user.id]
    );
    if (existing.rows.length) {
      return res.status(409).json({
        message: 'A return/exchange request already exists for this item',
        request: existing.rows[0],
      });
    }

    const { rows } = await db.query(
      `INSERT INTO return_requests (order_id, order_item_id, user_id, product_id, type, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [order_id, order_item_id || itemCheck.rows[0].id, req.user.id, product_id, type, reason || null]
    );

    res.status(201).json({ request: rows[0] });
  } catch (err) {
    next(err);
  }
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

// ─── UPLOAD RETURN EVIDENCE ───────────────────────────────────────
const uploadReturnEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify request belongs to user
    const { rows } = await db.query(
      'SELECT * FROM return_requests WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    const request = rows[0];
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files || {}).flat();

    const photoUrls = [];
    let videoUrl = request.video_url;

    for (const file of uploadedFiles) {
      const isVideo = file.mimetype.startsWith('video/');
      const fileUrl = getFileUrl(file);
      if (!fileUrl) continue;

      if (isVideo) {
        videoUrl = fileUrl;
      } else {
        photoUrls.push(fileUrl);
      }
    }

    // Merge with existing photos (up to 5)
    const existingPhotos = Array.isArray(request.photo_urls) ? request.photo_urls : [];
    const allPhotos = [...existingPhotos, ...photoUrls].slice(0, 5);

    if (allPhotos.length === 0 && !videoUrl) {
      return res.status(400).json({ message: 'At least one photo or video is required as evidence' });
    }

    const updated = await db.query(
      `UPDATE return_requests
       SET photo_urls = $1, video_url = $2, status = 'evidence_submitted', updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [allPhotos, videoUrl, id]
    );

    res.json({ request: formatReturnRequestWithEvidence(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
};

// ─── GET MY RETURN REQUESTS ────────────────────────────────────────
const getMyReturnRequests = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT rr.*, p.title as product_title, p.image_url as product_image,
              o.created_at as order_date
       FROM return_requests rr
       LEFT JOIN products p ON rr.product_id = p.id
       LEFT JOIN orders o ON rr.order_id = o.id
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows.map(formatReturnRequestWithEvidence) });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE RETURN REQUEST ─────────────────────────────────────
const getReturnRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT rr.*, p.title as product_title, p.image_url as product_image
       FROM return_requests rr
       LEFT JOIN products p ON rr.product_id = p.id
       WHERE rr.id = $1 AND rr.user_id = $2`,
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Return request not found' });
    res.json({ request: formatReturnRequestWithEvidence(rows[0]) });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReturnRequest, uploadReturnEvidence, getMyReturnRequests, getReturnRequest };
