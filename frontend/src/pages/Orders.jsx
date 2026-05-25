import { useState, useEffect } from 'react';
import { useParams as _useParams, Link } from 'react-router-dom'; // eslint-disable-line no-unused-vars
import { Package, ArrowLeft } from 'lucide-react';
import { orderService } from '../services/productService';
import { formatPrice, formatDate, ORDER_STATUS } from '../utils/formatters';

export default function Orders() {
  // useParams available if single order view needed in future
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getMyOrders()
      .then(res => setOrders(res.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="nexcart-container py-8 max-w-4xl page-enter">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/profile" className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-3xl font-bold text-dark-900 dark:text-white">My Orders</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-32 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-20 text-center">
          <Package className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-dark-700 dark:text-dark-300">No orders yet</h3>
          <p className="text-dark-400 mt-2 mb-8">Start shopping to place your first order</p>
          <Link to="/products" className="btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = ORDER_STATUS[order.status];
            return (
              <div key={order.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-dark-400">Order ID</p>
                    <p className="font-display font-bold text-primary-600 dark:text-primary-400">#{order.id}</p>
                    <p className="text-xs text-dark-400 mt-1">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${st?.color || 'info'}`}>{st?.icon} {st?.label}</span>
                    <p className="font-bold text-dark-900 dark:text-white mt-1">{formatPrice(order.final_price)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex-shrink-0">
                      <img src={item.image_url} alt={item.title} className="w-14 h-14 object-cover rounded-xl" title={item.title} />
                    </div>
                  ))}
                </div>

                {order.shipping_address && (
                  <p className="text-xs text-dark-400 mt-3">
                    📦 {order.shipping_address.address_line}, {order.shipping_address.city} {order.shipping_address.pincode}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
