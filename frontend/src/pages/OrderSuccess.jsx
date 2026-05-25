import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Home } from 'lucide-react';
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
    <div className="nexcart-container py-16 max-w-2xl mx-auto text-center page-enter">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]"
      >
        <CheckCircle2 className="w-12 h-12 text-white" />
      </motion.div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3 }}>
        <h1 className="font-display text-4xl font-extrabold text-dark-900 dark:text-white mb-3">
          Order Placed! 🎉
        </h1>
        <p className="text-dark-500 dark:text-dark-400 text-lg">
          Thank you! Your order has been confirmed and is being processed.
        </p>

        {order && !loading && (
          <div className="card p-6 mt-8 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-400">Order ID</p>
                <p className="font-display font-bold text-primary-600 dark:text-primary-400 text-lg">#{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-dark-400">Placed on</p>
                <p className="font-semibold text-dark-800 dark:text-dark-100 text-sm">{formatDate(order.created_at)}</p>
              </div>
            </div>

            <div className="divider" />

            {/* Status */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800">
              <span className="text-2xl">{ORDER_STATUS[order.status]?.icon}</span>
              <div>
                <p className="font-semibold text-dark-800 dark:text-dark-100">{ORDER_STATUS[order.status]?.label}</p>
                <p className="text-xs text-dark-400">We'll update you when it ships</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {order.items?.map(item => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate">{item.title}</p>
                    <p className="text-xs text-dark-400">Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className="flex justify-between font-bold text-dark-900 dark:text-white text-lg">
              <span>Total Paid</span>
              <span className="gradient-text">{formatPrice(order.final_price)}</span>
            </div>

            {order.shipping_address && (
              <div className="text-sm text-dark-500 dark:text-dark-400 bg-dark-50 dark:bg-dark-800 rounded-xl p-3">
                <p className="font-medium text-dark-700 dark:text-dark-200 mb-1">Delivering to:</p>
                <p>{order.shipping_address.full_name} · {order.shipping_address.phone}</p>
                <p>{order.shipping_address.address_line}, {order.shipping_address.city} {order.shipping_address.pincode}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Link to="/orders" className="btn-outline gap-2">
            <Package className="w-4 h-4" /> Track Order
          </Link>
          <Link to="/" className="btn-primary gap-2">
            <Home className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
