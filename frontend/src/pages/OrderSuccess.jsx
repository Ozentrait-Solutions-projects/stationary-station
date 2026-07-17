import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ShoppingBag, Truck, Mail } from 'lucide-react';
import { orderService } from '../services/productService';
import { formatPrice, formatDate, ORDER_STATUS } from '../utils/formatters';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getOrder(id)
      .then(res => setOrder(res.data.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center py-12 px-4 page-enter">
      <div className="max-w-lg w-full">

        {/* Success icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg bg-emerald-500"
            style={{ boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-2">
              Order Placed! 🎉
            </h1>
            <p className="text-gray-400 text-sm font-semibold">
              Thank you! Your order has been confirmed and is being processed.
            </p>
          </motion.div>
        </div>

        {/* Email notification notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 p-3 rounded-xl mb-4 text-sm bg-indigo-50 border border-indigo-100 font-bold text-indigo-700"
        >
          <Mail className="w-4 h-4 text-indigo-650 flex-shrink-0" />
          <span>
            Confirmation email sent to your registered address
          </span>
        </motion.div>

        {/* Order details card */}
        {!loading && order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100 font-semibold">
              <div>
                <p className="text-xs text-gray-450 uppercase tracking-wider font-bold">Order Number</p>
                <p className="font-extrabold text-indigo-650 mt-0.5">#{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-455 uppercase tracking-wider font-bold">Placed</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{formatDate(order.created_at)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <span className="text-xl">{ORDER_STATUS[order.status]?.icon}</span>
              </div>
              <div>
                <p className="font-bold text-gray-805 text-sm">{ORDER_STATUS[order.status]?.label}</p>
                <p className="text-xs text-gray-400 font-bold">Expected delivery: 2-5 business days</p>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-emerald-600 font-bold">
                <Truck className="w-4 h-4" />
                FREE Delivery
              </div>
            </div>

            {/* Items */}
            <div className="px-5 py-4 space-y-3 border-b border-gray-100">
              {order.items?.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=56'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity} · {formatPrice(item.price_at_purchase)} each</p>
                  </div>
                  <p className="text-sm font-black text-gray-900 flex-shrink-0">
                    {formatPrice(item.price_at_purchase * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Price & Delivery */}
            <div className="px-5 py-4 space-y-3 border-b border-gray-100">
              {order.shipping_address && (
                <div className="p-3 rounded-xl text-sm bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1 font-bold">Delivering to:</p>
                  <p className="text-gray-800 font-extrabold">{order.shipping_address.full_name}</p>
                  <p className="text-gray-500 text-xs mt-0.5 font-semibold">{order.shipping_address.address_line}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-bold">Order Total</span>
                <span className="text-xl font-black text-gray-950">{formatPrice(order.final_price)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex gap-3">
              <Link
                to="/orders"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-xs"
              >
                <Package className="w-4 h-4" />
                Track Order
              </Link>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="rounded-2xl animate-pulse bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="skeleton h-4 w-32 rounded" />
            </div>
            <div className="p-5 space-y-4">
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-12 rounded" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
