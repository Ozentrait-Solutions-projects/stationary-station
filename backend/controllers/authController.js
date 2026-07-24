const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendOTPEmail } = require('../utils/mailer');

/** Generate JWT */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─── SEND OTP ─────────────────────────────────────────────────────
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      `INSERT INTO verification_otps (email, otp, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = NOW()`,
      [email.toLowerCase(), otp, expiresAt]
    );

    await sendOTPEmail(email.toLowerCase(), otp);
    res.json({ message: 'Verification code sent successfully!' });
  } catch (err) {
    next(err);
  }
};

// ─── REGISTER ────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password, and verification code are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Verify OTP
    const otpRes = await db.query(
      'SELECT otp, expires_at FROM verification_otps WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!otpRes.rows.length) {
      return res.status(400).json({ message: 'No verification code found for this email. Please request a new one.' });
    }
    const record = otpRes.rows[0];
    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Clean up OTP
    await db.query('DELETE FROM verification_otps WHERE email = $1', [email.toLowerCase()]);

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, avatar',
      [name.trim(), email.toLowerCase(), hash]
    );

    const user = rows[0];
    res.status(201).json({ token: generateToken(user.id), user });
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { rows } = await db.query(
      'SELECT id, name, email, password_hash, role, avatar FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { password_hash, ...safeUser } = user;
    res.json({ token: generateToken(user.id), user: safeUser });
  } catch (err) {
    next(err);
  }
};

// ─── GET ME ──────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET
        name    = COALESCE($1, name),
        phone   = COALESCE($2, phone),
        avatar  = COALESCE($3, avatar)
       WHERE id = $4
       RETURNING id, name, email, role, avatar, phone`,
      [name, phone, avatar, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── CHANGE PASSWORD ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, sendOTP };
