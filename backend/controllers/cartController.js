const db = require('../config/db');

const formatCartItem = (item) => {
  if (!item) return item;
  const priceNum = Number(item.price);
  const salePriceNum = item.sale_price !== null && item.sale_price !== undefined ? Number(item.sale_price) : null;
  
  if (salePriceNum !== null) {
    return {
      ...item,
      price: salePriceNum,
      original_price: item.original_price ? Math.max(Number(item.original_price), priceNum) : priceNum,
      sale_price: salePriceNum
    };
  }
  return {
    ...item,
    price: priceNum,
    original_price: item.original_price ? Number(item.original_price) : null
  };
};

// ─── GET CART ────────────────────────────────────────────────────
const getCart = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.quantity, c.created_at,
              p.id as product_id, p.title, p.price, p.original_price, p.sale_price,
              p.image_url, p.stock, p.category, p.brand
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ cart: rows.map(formatCartItem) });
  } catch (err) { next(err); }
};

// ─── ADD TO CART ─────────────────────────────────────────────────
const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ message: 'product_id is required' });

    const product = await db.query('SELECT stock FROM products WHERE id = $1', [product_id]);
    if (!product.rows.length) return res.status(404).json({ message: 'Product not found' });
    if (product.rows[0].stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

    await db.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart.quantity + $3`,
      [req.user.id, product_id, quantity]
    );

    // Return updated cart
    const { rows } = await db.query(
      `SELECT c.id, c.quantity, p.id as product_id, p.title, p.price, p.original_price, p.sale_price, p.image_url, p.stock
       FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ cart: rows.map(formatCartItem), message: 'Added to cart' });
  } catch (err) { next(err); }
};

// ─── UPDATE QUANTITY ─────────────────────────────────────────────
const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

    const item = await db.query('SELECT c.*, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = $1 AND c.user_id = $2', [id, req.user.id]);
    if (!item.rows.length) return res.status(404).json({ message: 'Cart item not found' });
    if (quantity > item.rows[0].stock) return res.status(400).json({ message: 'Exceeds available stock' });

    await db.query('UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3', [quantity, id, req.user.id]);
    const { rows } = await db.query(
      `SELECT c.id, c.quantity, p.id as product_id, p.title, p.price, p.original_price, p.sale_price, p.image_url, p.stock
       FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ cart: rows.map(formatCartItem) });
  } catch (err) { next(err); }
};

// ─── REMOVE FROM CART ────────────────────────────────────────────
const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM cart WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    const { rows } = await db.query(
      `SELECT c.id, c.quantity, p.id as product_id, p.title, p.price, p.original_price, p.sale_price, p.image_url, p.stock
       FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ cart: rows.map(formatCartItem), message: 'Removed from cart' });
  } catch (err) { next(err); }
};

// ─── CLEAR CART ──────────────────────────────────────────────────
const clearCart = async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
    res.json({ cart: [], message: 'Cart cleared' });
  } catch (err) { next(err); }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
