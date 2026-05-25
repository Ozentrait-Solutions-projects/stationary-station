import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatters';

export default function CartSidebar() {
  const { cart, cartTotal, sidebarOpen, setSidebarOpen, updateQuantity, removeFromCart, cartLoading } = useCart();
  const { user: _user } = useAuth(); // eslint-disable-line no-unused-vars
  const navigate = useNavigate();

  const handleCheckout = () => {
    setSidebarOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col bg-white dark:bg-dark-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold text-dark-900 dark:text-white">Your Cart</h2>
                {cart.length > 0 && (
                  <span className="badge badge-primary">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-dark-500" />
              </motion.button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                      <div className="skeleton h-6 w-20 rounded" />
                    </div>
                  </div>
                ))
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-dark-300 dark:text-dark-600" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-dark-700 dark:text-dark-300">Your cart is empty</h3>
                  <p className="text-dark-400 text-sm mt-1">Add some products to get started</p>
                  <Link
                    to="/products"
                    onClick={() => setSidebarOpen(false)}
                    className="btn-primary mt-6 text-sm"
                  >
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-3 p-3 rounded-2xl bg-dark-50 dark:bg-dark-800"
                  >
                    <Link to={`/products/${item.product_id}`} onClick={() => setSidebarOpen(false)}>
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0 hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product_id}`}
                        onClick={() => setSidebarOpen(false)}
                        className="text-sm font-semibold text-dark-800 dark:text-dark-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <p className="text-primary-600 dark:text-primary-400 font-bold text-sm mt-1">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-white dark:bg-dark-700 rounded-lg border border-dark-200 dark:border-dark-600">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                            className="p-1.5 text-dark-500 dark:text-dark-300 hover:text-primary-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </motion.button>
                          <span className="w-6 text-center text-sm font-semibold text-dark-800 dark:text-dark-100">
                            {item.quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-1.5 text-dark-500 dark:text-dark-300 hover:text-primary-600 transition-colors disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </motion.button>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer — Order Summary */}
            {cart.length > 0 && (
              <div className="px-6 py-4 border-t border-dark-100 dark:border-dark-700 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-500 dark:text-dark-400">Subtotal</span>
                  <span className="font-bold text-dark-900 dark:text-white">{formatPrice(cartTotal)}</span>
                </div>
                <p className="text-xs text-dark-400">Shipping & taxes calculated at checkout</p>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full btn-primary justify-center py-3.5"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </motion.button>
                <Link
                  to="/cart"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
