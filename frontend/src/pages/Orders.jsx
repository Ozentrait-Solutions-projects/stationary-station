import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, Truck, Clock, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { orderService } from '../services/productService';
import { formatPrice, formatDate, ORDER_STATUS } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_PROGRESS = {
  pending:    1,
  confirmed:  2,
  processing: 3,
  shipped:    4,
  delivered:  5,
};

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  useEffect(() => {
    orderService.getMyOrders()
      .then(res => setOrders(res.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.success('Order cancelled successfully. Stock has been restored.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] page-enter">
      <div className="nexcart-container py-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-gray-900">Your Orders</h1>
            <p className="text-sm text-gray-400 mt-0.5 font-bold">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
          <Link to="/products" className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs text-sm">
            Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-white border border-gray-100 shadow-xs">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-6">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl py-20 text-center bg-white border border-gray-100 shadow-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            </motion.div>
            <h3 className="font-display text-xl font-black text-gray-950 mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-8 font-semibold">Start shopping to place your first order.</p>
            <Link to="/products" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-8 py-3.5 rounded-full inline-flex items-center gap-2 font-bold shadow-md shadow-indigo-100">
              Shop Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const st       = ORDER_STATUS[order.status];
              const progress = STATUS_PROGRESS[order.status] || 1;
              const canCancel = CANCELLABLE_STATUSES.includes(order.status);
              const isCancelling = cancellingId === order.id;
              const isConfirming = confirmCancelId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm bg-gray-50 border-b border-gray-100 font-semibold text-gray-500">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Order Placed</p>
                        <p className="font-bold text-gray-800 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total</p>
                        <p className="font-extrabold text-gray-900 mt-0.5">{formatPrice(order.final_price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Payment</p>
                        <p className="font-bold text-gray-800 mt-0.5 capitalize">{order.payment_method || 'Card'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Order # {order.id}</p>
                    </div>
                  </div>

                  {/* Status + Progress bar */}
                  <div className="px-4 pt-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{st?.icon}</span>
                        <span className={`font-semibold text-sm badge badge-${st?.color || 'info'}`}>
                          {st?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {order.status !== 'cancelled' && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Est. delivery: 2-5 days</span>
                          </div>
                        )}

                        {/* Cancel Order Button */}
                        {canCancel && !isConfirming && (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={isCancelling}
                            className="flex items-center gap-1.5 text-xs text-rose-600 font-extrabold hover:bg-rose-50 transition-colors px-2.5 py-1.5 rounded-xl border border-rose-200 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cancel Confirmation */}
                    <AnimatePresence>
                      {isConfirming && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-3"
                        >
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100">
                            <AlertTriangle className="w-4 h-4 text-rose-650 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-black text-rose-800">Cancel this order?</p>
                              <p className="text-xs text-rose-700/80 mt-0.5 font-semibold">This action cannot be undone. The stock will be restored.</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-bold"
                              >
                                Keep
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={isCancelling}
                                className="text-xs px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-750 transition-colors flex items-center gap-1 disabled:opacity-60 font-bold"
                              >
                                {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {isCancelling ? 'Cancelling…' : 'Yes, Cancel'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {order.status !== 'cancelled' && (
                      <div className="relative mb-4">
                        <div className="h-1.5 rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-[#6366F1]"
                            style={{ width: `${(progress / 5) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label, idx) => (
                            <span key={label} className={`text-[9px] font-bold ${idx < progress ? 'text-[#6366F1]' : 'text-gray-300'}`}>
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="px-4 pb-4 space-y-3">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center gap-4 py-3 border-t border-gray-100">
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${item.product_id}`} className="text-sm font-bold text-gray-800 hover:text-[#6366F1] transition-colors line-clamp-1">
                            {item.title}
                          </Link>
                          <p className="text-xs text-gray-400 font-bold mt-0.5">
                            Qty: {item.quantity} · {formatPrice(item.price_at_purchase)} each
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Link to={`/products/${item.product_id}`}
                              className="text-xs text-indigo-650 font-bold hover:text-indigo-850 transition-colors">
                              Buy it again
                            </Link>
                            <span className="text-gray-200">|</span>
                            <Link to={`/products/${item.product_id}`}
                              className="text-xs text-indigo-650 font-bold hover:text-indigo-850 transition-colors">
                              View item
                            </Link>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-sm text-gray-900">{formatPrice(item.price_at_purchase * item.quantity)}</p>
                        </div>
                      </div>
                    ))}

                    {/* Delivery info */}
                    {order.shipping_address && (
                      <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-gray-500 bg-gray-50 border border-gray-100 font-semibold">
                        <Truck className="w-3.5 h-3.5 text-indigo-650 flex-shrink-0 mt-0.5" />
                        <span>
                          Delivering to {order.shipping_address.full_name} · {order.shipping_address.address_line}, {order.shipping_address.city}, {order.shipping_address.pincode}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
