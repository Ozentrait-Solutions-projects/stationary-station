const db = require('../config/db');

// ─── GET ALL ADDRESSES ────────────────────────────────────────────
const getAddresses = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ addresses: rows });
  } catch (err) { next(err); }
};

// ─── CREATE ADDRESS ───────────────────────────────────────────────
const createAddress = async (req, res, next) => {
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, pin_code, country, lat, lng, is_default } = req.body;

    if (!address_line1 || !city) {
      return res.status(400).json({ message: 'address_line1 and city are required' });
    }

    // If setting as default, unset all others first
    if (is_default) {
      await db.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
    }

    // If first address, make it default automatically
    const count = await db.query('SELECT COUNT(*) FROM user_addresses WHERE user_id = $1', [req.user.id]);
    const makeDefault = is_default || parseInt(count.rows[0].count) === 0;

    const { rows } = await db.query(
      `INSERT INTO user_addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pin_code, country, lat, lng, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.id, label || 'Home', full_name || null, phone || null, address_line1, address_line2 || null, city, state || null, pin_code || null, country || 'India', lat || null, lng || null, makeDefault]
    );
    res.status(201).json({ address: rows[0] });
  } catch (err) { next(err); }
};

// ─── UPDATE ADDRESS ───────────────────────────────────────────────
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, full_name, phone, address_line1, address_line2, city, state, pin_code, country, lat, lng, is_default } = req.body;

    // Verify ownership
    const existing = await db.query('SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Address not found' });

    if (is_default) {
      await db.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
    }

    const { rows } = await db.query(
      `UPDATE user_addresses SET
        label = COALESCE($1, label), full_name = COALESCE($2, full_name),
        phone = COALESCE($3, phone), address_line1 = COALESCE($4, address_line1),
        address_line2 = COALESCE($5, address_line2), city = COALESCE($6, city),
        state = COALESCE($7, state), pin_code = COALESCE($8, pin_code),
        country = COALESCE($9, country), lat = COALESCE($10, lat), lng = COALESCE($11, lng),
        is_default = COALESCE($12, is_default)
       WHERE id = $13 AND user_id = $14 RETURNING *`,
      [label, full_name, phone, address_line1, address_line2, city, state, pin_code, country, lat, lng, is_default ?? null, id, req.user.id]
    );
    res.json({ address: rows[0] });
  } catch (err) { next(err); }
};

// ─── DELETE ADDRESS ───────────────────────────────────────────────
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id, is_default',
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Address not found' });

    // If deleted address was default, make the newest one default
    if (rows[0].is_default) {
      await db.query(
        'UPDATE user_addresses SET is_default = TRUE WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [req.user.id]
      );
    }

    res.json({ message: 'Address deleted' });
  } catch (err) { next(err); }
};

// ─── SET DEFAULT ADDRESS ──────────────────────────────────────────
const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
    const { rows } = await db.query(
      'UPDATE user_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Address not found' });
    res.json({ address: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };
