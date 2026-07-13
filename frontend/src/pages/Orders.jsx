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
    <div style={{ backgroundColor: '#0F1111' }} className="min-h-screen page-enter">
      <div className="nexcart-container py-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#E7E9EA]">Your Orders</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
          <Link to="/products" className="btn-amazon-secondary text-sm px-4 py-2 rounded-lg">
            Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden animate-pulse" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#1B2533' }}>
                  <div className="flex gap-6">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="skeleton w-20 h-20 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg py-20 text-center" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <Package className="w-16 h-16 text-[#374151] mx-auto mb-4" />
            </motion.div>
            <h3 className="font-display text-xl font-semibold text-[#E7E9EA] mb-2">No orders yet</h3>
            <p className="text-[#6B7280] mb-8">Start shopping to place your first order.</p>
            <Link to="/products" className="btn-amazon-orange text-sm px-8 py-3 rounded-lg inline-flex items-center gap-2 font-bold">
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
                  className="rounded-lg overflow-hidden"
                  style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    style={{ backgroundColor: '#1B2533', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Order Placed</p>
                        <p className="font-medium text-[#E7E9EA] mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Total</p>
                        <p className="font-bold text-[#E7E9EA] mt-0.5">{formatPrice(order.final_price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Payment</p>
                        <p className="font-medium text-[#E7E9EA] mt-0.5 capitalize">{order.payment_method || 'Card'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Order # {order.id}</p>
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
                          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                            <Clock className="w-3 h-3" />
                            <span>Est. delivery: 2-5 days</span>
                          </div>
                        )}

                        {/* Cancel Order Button */}
                        {canCancel && !isConfirming && (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={isCancelling}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-2.5 py-1.5 rounded-lg border border-red-400/30 hover:border-red-400/60 hover:bg-red-500/10 disabled:opacity-50"
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
                          <div className="flex items-start gap-3 p-3 rounded-lg"
                            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#E7E9EA]">Cancel this order?</p>
                              <p className="text-xs text-[#A0AEC0] mt-0.5">This action cannot be undone. The stock will be restored.</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[#A0AEC0] hover:bg-white/10 transition-colors"
                              >
                                Keep
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={isCancelling}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1 disabled:opacity-60"
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
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(progress / 5) * 100}%`, backgroundColor: '#FF9900' }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label, idx) => (
                            <span key={label} className={`text-[9px] ${idx < progress ? 'text-[#FF9900]' : 'text-[#374151]'}`}>
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
                      <div key={item.id} className="flex items-center gap-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden" style={{ backgroundColor: '#1B2533' }}>
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${item.product_id}`} className="text-sm font-medium text-[#E7E9EA] hover:text-[#FF9900] transition-colors line-clamp-1">
                            {item.title}
                          </Link>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            Qty: {item.quantity} · {formatPrice(item.price_at_purchase)} each
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Link to={`/products/${item.product_id}`}
                              className="text-xs text-[#007185] hover:text-[#FF9900] hover:underline transition-colors">
                              Buy it again
                            </Link>
                            <span className="text-[#374151]">|</span>
                            <Link to={`/products/${item.product_id}`}
                              className="text-xs text-[#007185] hover:text-[#FF9900] hover:underline transition-colors">
                              View item
                            </Link>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm text-[#E7E9EA]">{formatPrice(item.price_at_purchase * item.quantity)}</p>
                        </div>
                      </div>
                    ))}

                    {/* Delivery info */}
                    {order.shipping_address && (
                      <div className="flex items-start gap-2 p-3 rounded-lg text-xs text-[#A0AEC0]" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <Truck className="w-3.5 h-3.5 text-[#007185] flex-shrink-0 mt-0.5" />
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
