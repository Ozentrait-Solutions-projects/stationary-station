import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Package, Heart, Save, Loader2, ChevronRight, Mail, Shield, LayoutDashboard, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';
import { orderService } from '../services/productService';
import { formatPrice, formatDate, ORDER_STATUS } from '../utils/formatters';
import toast from 'react-hot-toast';
import ProductCard from '../components/product/ProductCard';

const ACCOUNT_SECTIONS = [
  { to: '/orders',  icon: Package,  title: 'Your Orders',   desc: 'Track, return, or buy things again', color: '#FF9900' },
  { to: '/wishlist',icon: Heart,    title: 'Your Wishlist', desc: 'Saved items for purchase later', color: '#e74c3c' },
];

const TABS = [
  { id: 'account', label: 'Account',  icon: User    },
  { id: 'orders',  label: 'Orders',   icon: Package },
  { id: 'wishlist',label: 'Wishlist', icon: Heart   },
];

export default function Profile() {
  const { user, updateUser, isAdmin } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const { wishlist } = useWishlist();
  const [tab, setTab]       = useState('account');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', avatar: user?.avatar || '' });

  useEffect(() => {
    if (tab === 'orders') {
      setLoading(true);
      orderService.getMyOrders()
        .then(res => setOrders(res.data.orders || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] page-enter">
      <div className="nexcart-container py-6 max-w-5xl">

        {/* Account Overview Header */}
        <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border border-gray-100 shadow-sm">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-650 text-2xl font-black overflow-hidden shadow-sm border border-indigo-100">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : user?.name?.[0]?.toUpperCase()
              }
            </div>
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-extrabold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                {user?.role === 'admin' ? '👑 Admin' : '✓ Verified'}
              </span>
            </div>
          </div>
          {isAdmin && (
            <Link to="/admin" className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-purple-100 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
            </Link>
          )}
        </div>

        {/* Quick Action Cards — on account tab home */}
        {tab === 'account' && (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {ACCOUNT_SECTIONS.map(s => (
              <Link key={s.to} to={s.to}
                className="flex items-center gap-4 p-4 rounded-xl transition-all group bg-white border border-gray-100 shadow-xs hover:border-gray-200"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${s.color}18` }}>
                  <s.icon className="w-6 h-6" style={{ color: s.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">{s.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </Link>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="space-y-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  tab === t.id
                    ? 'text-white bg-[#6366F1] shadow-md shadow-indigo-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* ── Account Tab ──────────────────────────────────── */}
            {tab === 'account' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
                  <h2 className="font-black text-gray-950 mb-4 text-base">Personal Information</h2>
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-gray-500 block mb-1.5">Full Name</label>
                        <input className="input text-sm py-2.5" value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-500 block mb-1.5">Phone</label>
                        <input className="input text-sm py-2.5" placeholder="+91 9999999999"
                          value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-bold text-gray-500 block mb-1.5">Email (read-only)</label>
                        <input className="input text-sm py-2.5 opacity-60 cursor-not-allowed" value={user?.email} readOnly />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-bold text-gray-500 block mb-1.5">Avatar URL (optional)</label>
                        <input className="input text-sm py-2.5" placeholder="https://…"
                          value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" disabled={saving} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                {/* Security section */}
                <div className="rounded-2xl p-5 mt-4 bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <h2 className="font-black text-gray-955 text-base">Security</h2>
                  </div>
                  <div className="text-sm text-gray-500 font-bold space-y-2">
                    <p>✓ Two-factor authentication: <span className="text-gray-805 font-medium ml-1">Not enabled</span></p>
                    <p>✓ Password: <span className="text-gray-805 font-medium ml-1">Set</span></p>
                  </div>
                </div>

                {/* Delivery Location section */}
                <div className="rounded-2xl p-5 mt-4 bg-white border border-gray-150 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <h2 className="font-black text-gray-955 text-base">Delivery Country/Region</h2>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 font-bold">
                    <p>Current region set for deliveries:</p>
                    <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">India</span>
                  </div>
                </div>

                {/* Language section */}
                <div className="rounded-2xl p-5 mt-4 bg-white border border-gray-150 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-indigo-650" />
                    <h2 className="font-black text-gray-955 text-base">{t('language', 'Language')}</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-500 font-bold">
                    <p>Preferred display language:</p>
                    <div className="flex gap-2 flex-wrap">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setLanguage(lang.code)}
                          className={`px-4 py-2 rounded-full text-xs font-black border transition-all duration-150 ${
                            language === lang.code
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="mr-1.5">{lang.flag}</span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Orders Tab ───────────────────────────────────── */}
            {tab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-lg animate-pulse" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-2xl py-16 text-center bg-white border border-gray-100 shadow-sm">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="font-black text-gray-950 mb-2">No orders yet</h3>
                    <p className="text-sm text-gray-400 mb-6 font-semibold">Start shopping to see your orders here</p>
                    <Link to="/products" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-6 py-2.5 rounded-full font-bold shadow-md shadow-indigo-100">Shop Now</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => {
                      const st = ORDER_STATUS[order.status];
                      return (
                        <div key={order.id} className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                          <div className="flex items-center justify-between px-4 py-3 text-xs bg-gray-50 border-b border-gray-100 font-semibold text-gray-500">
                            <div className="flex gap-4">
                              <span>Order #{order.id}</span>
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                            <span className={`badge badge-${st?.color || 'info'}`}>{st?.icon} {st?.label}</span>
                          </div>
                          <div className="p-4 flex items-center gap-4">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                              {order.items?.slice(0, 3).map(item => (
                                <img key={item.id} src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48'; }} />
                              ))}
                              {order.items?.length > 3 && (
                                <div className="w-12 h-12 rounded flex items-center justify-center text-xs text-gray-500 font-bold bg-gray-150 flex-shrink-0">
                                  +{order.items.length - 3}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-gray-900 text-sm">{formatPrice(order.final_price)}</p>
                              <p className="text-xs text-gray-400 font-bold">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                            </div>
                            <Link to="/orders" className="text-xs text-indigo-650 hover:text-indigo-850 font-bold flex items-center gap-1 transition-colors">
                              View Details <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Wishlist Tab ──────────────────────────────────── */}
            {tab === 'wishlist' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {wishlist.length === 0 ? (
                  <div className="rounded-2xl py-16 text-center bg-white border border-gray-100 shadow-sm">
                    <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="font-black text-gray-955 mb-2">Wishlist is empty</h3>
                    <p className="text-sm text-gray-400 mb-6 font-semibold">Tap ♥ on products to save them</p>
                    <Link to="/products" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-6 py-2.5 rounded-full font-bold shadow-md shadow-indigo-100">Explore Products</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wishlist.map((item, i) => (
                      <ProductCard key={item.product_id} product={{
                        id: item.product_id, title: item.title, price: item.price,
                        original_price: item.original_price, image_url: item.image_url,
                        rating: item.rating, review_count: item.review_count,
                        category: item.category, brand: item.brand, stock: item.stock,
                      }} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
