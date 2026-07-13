const db = require('../config/db');

// ─── CREATE ORDER ────────────────────────────────────────────────
const createOrder = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { shipping_address, coupon_code, payment_method = 'mock' } = req.body;

    // Get cart items
    const cartResult = await client.query(
      `SELECT c.quantity, p.id as product_id, p.price, p.stock, p.title
       FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (!cartResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Verify stock
    for (const item of cartResult.rows) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Insufficient stock for ${item.title}` });
      }
    }

    const total_price = cartResult.rows.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Apply coupon
    let discount = 0;
    if (coupon_code) {
      const coupon = await client.query(
        `SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()) AND used_count < max_uses`,
        [coupon_code.toUpperCase()]
      );
      if (coupon.rows.length) {
        discount = (total_price * coupon.rows[0].discount_percent) / 100;
        await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE code = $1', [coupon_code.toUpperCase()]);
      }
    }

    const final_price = Math.max(0, total_price - discount);

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_price, discount, final_price, coupon_code, shipping_address, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, total_price, discount, final_price, coupon_code || null, JSON.stringify(shipping_address), payment_method]
    );
    const order = orderResult.rows[0];

    // Insert order items & decrement stock
    for (const item of cartResult.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [order.id, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);

    await client.query('COMMIT');

    // Return order with items
    const items = await db.query(
      `SELECT oi.*, p.title, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [order.id]
    );

    res.status(201).json({ order: { ...order, items: items.rows } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ─── GET USER ORDERS ─────────────────────────────────────────────
const getMyOrders = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    // Attach items to each order
    const ordersWithItems = await Promise.all(rows.map(async (order) => {
      const items = await db.query(
        `SELECT oi.*, p.title, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
        [order.id]
      );
      return { ...order, items: items.rows };
    }));

    res.json({ orders: ordersWithItems });
  } catch (err) { next(err); }
};

// ─── GET SINGLE ORDER ────────────────────────────────────────────
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });

    const items = await db.query(
      `SELECT oi.*, p.title, p.image_url, p.category FROM order_items oi
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ order: { ...rows[0], items: items.rows } });
  } catch (err) { next(err); }
};

// ─── CANCEL ORDER ────────────────────────────────────────────────
const cancelOrder = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Verify order belongs to user and is cancellable
    const { rows } = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = rows[0];
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Cannot cancel an order that is already ${order.status}` });
    }

    // Restore product stock
    const items = await client.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [id]
    );
    for (const item of items.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Cancel the order
    const updated = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );
    await client.query('COMMIT');
    res.json({ order: updated.rows[0], message: 'Order cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { createOrder, getMyOrders, getOrder, cancelOrder };

