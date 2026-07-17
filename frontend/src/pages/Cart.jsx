import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Shield, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, discountPercent } from '../utils/formatters';

export default function CartPage() {
  const { cart, cartTotal, cartLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const savings = cart.reduce((s, i) => {
    const disc = i.original_price ? (i.original_price - i.price) * i.quantity : 0;
    return s + disc;
  }, 0);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  if (cartLoading) return (
    <div className="min-h-screen py-6 bg-[#FAFBFD]">
      <div className="nexcart-container">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 flex gap-4 animate-pulse bg-white border border-gray-100">
                <div className="skeleton w-24 h-24 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-8 w-32 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (cart.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFD]">
      <div className="text-center px-4 py-16">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 bg-white border border-gray-100 shadow-sm">
            <ShoppingBag className="w-14 h-14 text-gray-300" />
          </div>
        </motion.div>
        <h2 className="font-display text-2xl font-black text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-400 mb-8 font-medium">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-8 py-3.5 rounded-full inline-flex items-center gap-2 font-bold shadow-md shadow-indigo-100">
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFD] page-enter">
      <div className="nexcart-container py-6">
        <div className="grid lg:grid-cols-4 gap-6">

          {/* ── Cart Items ─────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h1 className="font-display text-2xl font-black text-gray-900">Shopping Cart</h1>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-400 font-semibold">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                  <button onClick={clearCart} className="text-xs text-indigo-650 font-bold hover:text-red-500 hover:underline transition-colors">
                    Deselect all items
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {cart.map((item, i) => {
                  const disc = discountPercent(item.original_price, item.price);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="px-5 py-4 flex gap-4"
                    >
                      {/* Image */}
                      <Link to={`/products/${item.product_id}`} className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=96'; }}
                          />
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product_id}`}
                          className="text-sm font-semibold text-gray-800 hover:text-indigo-650 hover:underline transition-colors line-clamp-2"
                        >
                          {item.title}
                        </Link>

                        {/* Stock & Prime */}
                        <p className="text-xs text-emerald-600 font-bold mt-1">In Stock</p>
                        <p className="text-xs text-indigo-600 font-bold mt-0.5">✓ FREE Delivery</p>

                        {/* Price on mobile */}
                        <div className="flex items-center gap-2 mt-1 sm:hidden">
                          <span className="font-bold text-gray-900">{formatPrice(item.price)}</span>
                          {item.original_price && item.original_price > item.price && (
                            <span className="text-xs text-gray-400 line-through font-medium">{formatPrice(item.original_price)}</span>
                          )}
                        </div>

                        {/* Actions row */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          {/* Qty stepper */}
                          <div className="flex items-center rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <button
                              onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                              className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-gray-600 text-sm"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-4 py-1.5 text-sm font-bold text-gray-800 border-x border-gray-200 bg-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-gray-600 text-sm disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-gray-200 text-sm">|</span>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 font-bold hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>

                          <span className="text-gray-200 text-sm">|</span>
                          <button className="text-xs text-gray-500 font-bold hover:text-indigo-600 transition-colors">Save for later</button>
                        </div>
                      </div>

                      {/* Price — Desktop */}
                      <div className="hidden sm:block text-right flex-shrink-0">
                        <p className="font-black text-gray-900 text-base">{formatPrice(item.price * item.quantity)}</p>
                        {item.original_price && item.original_price > item.price && (
                          <div className="mt-0.5">
                            <span className="text-xs text-gray-400 line-through font-medium">{formatPrice(item.original_price * item.quantity)}</span>
                            <span className="text-xs text-pink-600 font-black ml-1">-{disc}%</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Subtotal footer */}
              {savings > 0 && (
                <div className="px-5 py-4 text-right text-sm border-t border-gray-100 bg-gray-50">
                  <span className="text-gray-500 font-semibold">Subtotal ({totalItems} items): </span>
                  <span className="font-black text-gray-900 text-base">{formatPrice(cartTotal)}</span>
                  <span className="text-emerald-605 ml-3 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">You save {formatPrice(savings)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Order Summary ──────────────────────────────────────── */}
          <div>
            <div className="rounded-2xl p-5 sticky top-28 space-y-4 bg-white border border-gray-100 shadow-sm">

              {/* Free delivery notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-700 leading-relaxed font-bold">
                  FREE Delivery on your order
                </p>
              </div>

              {/* Subtotal */}
              <div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Savings</span>
                      <span>-{formatPrice(savings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Delivery</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                </div>

                <div className="my-3 border-t border-gray-100" />

                <div className="flex justify-between font-black text-gray-950 text-base">
                  <span>Order Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {/* Coupon hint */}
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Apply coupon at checkout for extra savings</span>
              </div>

              {/* Checkout button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/checkout')}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100"
              >
                Proceed to Buy ({totalItems}) <ArrowRight className="w-4 h-4" />
              </motion.button>

              <Link to="/products" className="block text-center text-sm text-indigo-600 hover:text-indigo-850 hover:underline transition-colors font-bold">
                Continue Shopping
              </Link>

              {/* Trust */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Safe & Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
