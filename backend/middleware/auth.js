const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Protect routes — verify JWT and attach user to req
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'nexcart_super_secret_key_2026';
    const decoded = jwt.verify(token, JWT_SECRET);


    const { rows } = await db.query(
      'SELECT id, name, email, role, avatar FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
