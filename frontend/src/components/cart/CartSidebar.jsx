import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatters';

export default function CartSidebar() {
  const {
    cart, cartTotal, cartLoading,
    sidebarOpen, setSidebarOpen,
    updateQuantity, removeFromCart,
  } = useCart();
  const navigate = useNavigate();

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 flex flex-col shadow-2xl bg-white border-l border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-gray-900">
                  Your Cart
                  {totalItems > 0 && (
                    <span className="ml-2 text-sm text-gray-400 font-normal">({totalItems} items)</span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {cartLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="skeleton w-16 h-16 rounded flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-full rounded" />
                        <div className="skeleton h-3 w-2/3 rounded" />
                        <div className="skeleton h-4 w-1/3 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-gray-100">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                  <p className="text-sm text-gray-400 mb-6">Add items to get started</p>
                  <button
                    onClick={() => { setSidebarOpen(false); navigate('/products'); }}
                    className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm py-2.5 rounded-xl font-bold shadow-sm transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-3 pb-3 border-b border-gray-100 bg-white p-3 rounded-2xl shadow-sm"
                    >
                      {/* Image */}
                      <Link to={`/products/${item.product_id}`} onClick={() => setSidebarOpen(false)} className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64'; }}
                          />
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product_id}`}
                          onClick={() => setSidebarOpen(false)}
                          className="text-xs font-semibold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-snug"
                        >
                          {item.title}
                        </Link>
                        <p className="text-sm font-black text-gray-900 mt-1">{formatPrice(item.price)}</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">FREE delivery</p>

                        <div className="flex items-center gap-2 mt-2">
                          {/* Qty */}
                          <div className="flex items-center rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <button
                              onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                              className="px-2.5 py-1 hover:bg-gray-100 transition-colors text-gray-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 py-1 text-xs font-bold text-gray-850 border-x border-gray-200 bg-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="px-2.5 py-1 hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-4 space-y-3 border-t border-gray-100 bg-white shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Subtotal ({totalItems} items)</span>
                  <span className="font-black text-gray-900 text-base">{formatPrice(cartTotal)}</span>
                </div>

                <button
                  onClick={() => { setSidebarOpen(false); navigate('/checkout'); }}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setSidebarOpen(false); navigate('/cart'); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-indigo-650 transition-colors text-center border border-gray-200 hover:bg-gray-50"
                >
                  View Full Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
