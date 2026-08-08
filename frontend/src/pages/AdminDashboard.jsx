import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp,
  Plus, Edit3, Trash2, Loader2, BarChart2, ArrowUpRight,
  X, Save, Upload, Eye, MapPin, CreditCard, Phone, Mail,
  User as UserIcon, CheckCircle2, RotateCcw, BadgePercent,
} from 'lucide-react';
import { adminService } from '../services/productService';
import api from '../services/api';
import { formatPrice, formatDate, ORDER_STATUS } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const resolveMediaUrl = (url) => {
  if (!url) return url;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;

  const apiBase = api.defaults.baseURL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'orders',     label: 'Orders',     icon: ShoppingBag },
  { id: 'products',   label: 'Products',   icon: Package },
  { id: 'returns',    label: 'Returns',    icon: RotateCcw },
  { id: 'promotions', label: 'Promotions', icon: BadgePercent },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState('dashboard');
  const [data, setData]         = useState(null);
  const [orders, setOrders]     = useState([]);
  const [returns, setReturns]   = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [imageMode, setImageMode]     = useState('url');
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [productModal, setProductModal] = useState(null);
  const [productForm, setProductForm]   = useState({});
  const [loading, setLoading]           = useState(true);
  const [returnDetailId, setReturnDetailId] = useState(null);
  const [updatingReturnId, setUpdatingReturnId] = useState(null);
  const [promoProductId, setPromoProductId] = useState('');
  const [promoSalePrice, setPromoSalePrice] = useState('');
  const [savingPromo, setSavingPromo] = useState(false);

  // Return Rejection Modal & Lightbox Media Preview
  const [rejectingReturnReq, setRejectingReturnReq] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null);

  // Order detail modal
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, ord] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAllOrders(),
      ]);
      setData(dash.data);
      setOrders(ord.data.orders || []);
      // Load products for promotions tab
      const prodRes = await api.get('/products?limit=100');
      setProducts(prodRes.data.products || []);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
    // Load returns in background
    adminService.getAllReturns().then(res => setReturns(res.data.requests || [])).catch(() => {});
  };

  const updateStatus = async (orderId, status) => {
    try {
      await adminService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      // Also update in the detail modal if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status }));
      }
      toast.success('Order status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const openOrderDetails = async (order) => {
    setOrderDetailLoading(true);
    setSelectedOrder(order); // show modal immediately with basic info
    try {
      const res = await adminService.getOrderDetails(order.id);
      setSelectedOrder(res.data.order);
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setProductForm({ ...product, images: product.images?.join(', ') || '', tags: product.tags?.join(', ') || '', sale_price: product.sale_price || '', return_exchange_available: product.return_exchange_available !== false });
      setProductModal('edit');
      setImageMode('url');
      setProductImageFile(null);
      setProductImagePreview(product.image_url || '');
    } else {
      setProductForm({ title:'', description:'', price:'', original_price:'', category:'', brand:'', stock:'1', image_url:'', images:'', tags:'', is_featured:false, sale_price:'', return_exchange_available:true });
      setProductModal('create');
      setImageMode('url');
      setProductImageFile(null);
      setProductImagePreview('');
    }
  };

  const handleProductImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) { setProductImageFile(null); setProductImagePreview(productForm.image_url || ''); return; }
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const saveProduct = async (e) => {
    e.preventDefault();

    // Validate stock
    const stockNum = Number(productForm.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      return toast.error('Please enter a valid stock quantity (0 or more)');
    }

    setSaving(true);
    try {
      const imagesArray = productForm.images ? productForm.images.split(',').map(s => s.trim()).filter(Boolean) : [];
      const tagsArray   = productForm.tags   ? productForm.tags.split(',').map(s => s.trim()).filter(Boolean) : [];

      if (imageMode === 'upload' && productImageFile) {
        const formData = new FormData();
        Object.entries({ title: productForm.title, description: productForm.description,
          price: String(Number(productForm.price)), original_price: productForm.original_price ? String(Number(productForm.original_price)) : '',
          category: productForm.category, brand: productForm.brand, stock: String(stockNum),
          images: JSON.stringify(imagesArray), tags: JSON.stringify(tagsArray), is_featured: String(!!productForm.is_featured),
          sale_price: productForm.sale_price ? String(Number(productForm.sale_price)) : '',
          return_exchange_available: String(productForm.return_exchange_available !== false),
        }).forEach(([k, v]) => formData.append(k, v));
        formData.append('image', productImageFile);
        productModal === 'create' ? await adminService.createProduct(formData) : await adminService.updateProduct(productForm.id, formData);
        toast.success(productModal === 'create' ? 'Product created!' : 'Product updated!');
        setProductModal(null); loadData(); return;
      }

      const payload = { ...productForm, price: Number(productForm.price), original_price: Number(productForm.original_price)||null, stock: stockNum, images: imagesArray, tags: tagsArray,
        sale_price: productForm.sale_price ? Number(productForm.sale_price) : null,
        return_exchange_available: productForm.return_exchange_available !== false,
      };
      productModal === 'create' ? await adminService.createProduct(payload) : await adminService.updateProduct(productForm.id, payload);
      toast.success(productModal === 'create' ? 'Product created!' : 'Product updated!');
      setProductModal(null); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await adminService.deleteProduct(id); toast.success('Product deleted'); loadData(); }
    catch { toast.error('Delete failed'); }
  };

  const STAT_CARDS = data ? [
    { label: 'Total Revenue', value: formatPrice(data.stats.totalRevenue), icon: TrendingUp,  gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)', change: '+12.5%' },
    { label: 'Total Orders',  value: data.stats.totalOrders.toLocaleString(), icon: ShoppingBag, gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', change: '+8.2%' },
    { label: 'Total Users',   value: data.stats.totalUsers.toLocaleString(), icon: UserIcon,    gradient: 'linear-gradient(135deg, #10B981, #059669)', change: '+5.1%' },
    { label: 'Products',      value: data.stats.totalProducts.toLocaleString(), icon: Package,  gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', change: '+2 new' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      <div className="nexcart-container py-4 sm:py-6 px-3 sm:px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-gray-900">Admin Panel</h1>
            <p className="text-xs sm:text-sm text-gray-400 font-bold mt-0.5">Welcome back, {user?.name}</p>
          </div>
          <Link to="/" className="inline-flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all shadow-xs text-xs sm:text-sm self-start sm:self-auto">
            ← Back to Store
          </Link>
        </div>

        {/* Mobile Tabs Bar */}
        <div className="lg:hidden admin-tabs-scroll mb-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`admin-tab-btn ${tab === t.id ? 'active' : ''}`}
            >
              <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-52 flex-shrink-0 space-y-1">
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

          <div className="flex-1 min-w-0">

            {/* ── Dashboard Tab ─────────────────────────────────── */}
            {tab === 'dashboard' && (
              <div className="space-y-5">
                {/* Stat Cards */}
                <div className="admin-stat-grid">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton rounded-2xl animate-pulse" style={{minHeight: '90px'}} />)
                    : STAT_CARDS.map((card, i) => (
                        <motion.div key={card.label}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="admin-stat-card shadow-sm"
                          style={{ background: card.gradient }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                              <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                              <ArrowUpRight className="w-2.5 h-2.5" /> {card.change}
                            </span>
                          </div>
                          <div>
                            <p className="admin-stat-value">{card.value}</p>
                            <p className="admin-stat-label">{card.label}</p>
                          </div>
                        </motion.div>
                      ))
                  }
                </div>

                {/* Revenue Chart */}
                {!loading && data?.revenueByDay?.length > 0 && (
                  <div className="rounded-2xl p-3.5 sm:p-5 bg-white border border-gray-100 shadow-sm w-full overflow-hidden">
                    <h3 className="font-black text-gray-950 mb-3 sm:mb-4 text-xs sm:text-base flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" /> Revenue (Last 30 Days)
                    </h3>
                    <div className="w-full h-[180px] sm:h-[220px] min-w-0 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.revenueByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={d => d.slice(5)} />
                          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={v => formatPrice(v)}
                            contentStyle={{ background: '#FFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px', color: '#111', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Recent Orders + Top Products */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-5">
                  <div className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-950 mb-4 text-sm sm:text-base">Recent Orders</h3>
                    <div className="space-y-3">
                      {(data?.recentOrders || []).slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center justify-between gap-2 text-sm py-2 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded px-2 transition-colors"
                          onClick={() => openOrderDetails(order)}>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 truncate text-xs sm:text-sm">{order.user_name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 font-semibold">#{order.id} · {formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`badge badge-${ORDER_STATUS[order.status]?.color || 'info'} text-[9px] sm:text-[10px]`}>
                              {ORDER_STATUS[order.status]?.label}
                            </span>
                            <span className="font-black text-gray-900 text-xs sm:text-sm">{formatPrice(order.final_price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-955 mb-4 text-sm sm:text-base">Top Selling Products</h3>
                    <div className="space-y-3">
                      {(data?.topProducts || []).map((p, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-b-0">
                          <span className="font-bold text-gray-400 text-xs sm:text-sm w-4 sm:w-5">#{i + 1}</span>
                          <img src={p.image_url} alt={p.title} className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40'; }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-805 truncate">{p.title}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 font-semibold">{Number(p.total_sold).toLocaleString()} sold</p>
                          </div>
                          <p className="text-xs sm:text-sm font-black text-indigo-650 flex-shrink-0">{formatPrice(p.revenue)}</p>
                        </div>
                      ))}
                      {(!data?.topProducts || data.topProducts.length === 0) && (
                        <p className="text-gray-400 text-xs sm:text-sm text-center py-6 font-semibold">No sales data yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Orders Tab ────────────────────────────────────── */}
            {tab === 'orders' && (
              <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                  <h3 className="font-black text-gray-950 text-base sm:text-lg">All Orders ({orders.length})</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Click any order to view details</p>
                </div>

                {/* Mobile Cards View (< md) */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {orders.map(order => (
                    <div key={order.id} className="p-4 space-y-3 bg-white hover:bg-gray-50/80 transition-colors cursor-pointer" onClick={() => openOrderDetails(order)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-indigo-650 font-black text-xs">#{order.id}</span>
                          <h4 className="font-bold text-sm text-gray-900 truncate">{order.user_name}</h4>
                          <p className="text-xs text-gray-400 truncate">{order.user_email}</p>
                        </div>
                        <span className={`badge badge-${ORDER_STATUS[order.status]?.color || 'info'} text-[10px] flex-shrink-0`}>
                          {ORDER_STATUS[order.status]?.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Date</span>
                          <span className="font-semibold text-gray-700">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 block text-[10px]">Total</span>
                          <span className="font-black text-gray-900 text-sm">{formatPrice(order.final_price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                          className="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-750 font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
                        </select>
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="bg-indigo-50 text-indigo-650 hover:bg-indigo-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-center text-gray-400 py-8 font-semibold text-sm">No orders found</p>
                  )}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="amazon-table">
                    <thead>
                      <tr>
                        {['Order ID', 'Customer', 'Date', 'Amount', 'Status', 'Action', 'Details'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => openOrderDetails(order)}>
                          <td className="font-mono text-indigo-650 font-extrabold">#{order.id}</td>
                          <td>
                            <p className="font-bold text-gray-800 truncate max-w-[140px]">{order.user_name}</p>
                            <p className="text-xs text-gray-400 font-semibold truncate max-w-[140px]">{order.user_email}</p>
                          </td>
                          <td className="text-gray-500 font-semibold whitespace-nowrap">{formatDate(order.created_at)}</td>
                          <td className="font-black text-gray-900 whitespace-nowrap">{formatPrice(order.final_price)}</td>
                          <td><span className={`badge badge-${ORDER_STATUS[order.status]?.color || 'info'}`}>{ORDER_STATUS[order.status]?.label}</span></td>
                          <td>
                            <select
                              value={order.status}
                              onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                              className="text-xs bg-gray-50 border border-gray-200 text-gray-750 font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              onClick={e => e.stopPropagation()}
                            >
                              {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
                            </select>
                          </td>
                          <td>
                            <button
                              onClick={() => openOrderDetails(order)}
                              className="flex items-center gap-1.5 text-xs text-[#007185] hover:text-[#FF9900] transition-colors px-2 py-1 rounded hover:bg-white/5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <p className="text-center text-gray-400 py-8 font-semibold">No orders found</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Products Tab ──────────────────────────────────── */}
            {tab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-950">Product Management</h3>
                  <button onClick={() => openProductModal(null)} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-4 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <AdminProductList onEdit={openProductModal} onDelete={deleteProduct} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Returns Tab ────────────────────────────────────── */}
            {tab === 'returns' && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-gray-950">Return & Exchange Requests ({returns.length})</h3>
                  <button onClick={() => adminService.getAllReturns().then(r => setReturns(r.data.requests || []))} className="text-xs text-indigo-600 font-bold hover:text-indigo-800">Refresh</button>
                </div>
                {returns.length === 0 ? (
                  <div className="py-16 text-center">
                    <RotateCcw className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-semibold text-sm">No return requests yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {returns.map(req => {
                      const statusColors = { pending: 'bg-amber-50 text-amber-700 border-amber-200', evidence_submitted: 'bg-blue-50 text-blue-700 border-blue-200', approved: 'bg-emerald-50 text-emerald-700 border-emerald-200', rejected: 'bg-rose-50 text-rose-700 border-rose-200' };
                      const isOpen = returnDetailId === req.id;
                      return (
                        <div key={req.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <img src={req.product_image} alt={req.product_title} className="w-11 h-11 rounded-xl object-cover border border-gray-100 flex-shrink-0" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48'; }} />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-800 line-clamp-2 break-words">{req.product_title}</p>
                              <p className="text-xs text-gray-400 font-semibold break-all">{req.user_name}</p>
                              <p className="text-xs text-gray-400 font-semibold break-all">{req.user_email}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>{req.status.replace('_', ' ')}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.type === 'return' ? 'bg-rose-50 text-rose-600' : 'bg-violet-50 text-violet-600'}`}>{req.type}</span>
                              </div>
                            </div>
                            <button onClick={() => setReturnDetailId(isOpen ? null : req.id)} className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex-shrink-0 whitespace-nowrap">
                              {isOpen ? 'Collapse' : 'View Details'}
                            </button>
                          </div>
                          {isOpen && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                              <div>
                                <p className="text-xs font-bold text-gray-500 mb-1">Customer's Reason</p>
                                <p className="text-sm text-gray-700 font-medium">{req.reason || 'No reason provided'}</p>
                              </div>
                              {req.photo_urls?.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold text-gray-500 mb-2">Evidence Photos (Click to preview)</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {req.photo_urls.map((url, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setLightboxMedia({ url: resolveMediaUrl(url), type: 'image' })}
                                        className="relative group focus:outline-none"
                                      >
                                        <img src={resolveMediaUrl(url)} alt={`Evidence ${i+1}`} className="w-20 h-20 rounded-xl object-cover border border-gray-200 group-hover:opacity-85 transition-opacity" />
                                        <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white text-[10px] font-bold transition-opacity">Zoom</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {req.video_url && (
                                <div>
                                  <p className="text-xs font-bold text-gray-500 mb-2">Evidence Video</p>
                                  <button
                                    type="button"
                                    onClick={() => setLightboxMedia({ url: resolveMediaUrl(req.video_url), type: 'video' })}
                                    className="text-xs text-indigo-600 font-bold underline mb-1 block hover:text-indigo-800"
                                  >
                                    Open Video Lightbox
                                  </button>
                                  <video src={resolveMediaUrl(req.video_url)} controls className="w-full max-h-40 rounded-xl" />
                                </div>
                              )}
                              {(req.admin_notes || req.rejection_reason) && (
                                <div className="p-3 bg-white rounded-xl border border-gray-200">
                                  <p className="text-xs font-bold text-gray-500 mb-1">Admin Response / Rejection Reason</p>
                                  <p className="text-sm text-gray-800 font-semibold">{req.admin_notes || req.rejection_reason}</p>
                                </div>
                              )}
                              {req.status !== 'approved' && req.status !== 'rejected' && (
                                <div className="flex gap-2 pt-2">
                                  <button
                                    disabled={updatingReturnId === req.id}
                                    onClick={async () => {
                                      setUpdatingReturnId(req.id);
                                      try {
                                        const res = await adminService.updateReturnStatus(req.id, 'approved', '');
                                        setReturns(prev => prev.map(r => r.id === req.id ? (res.data.request || { ...r, status: 'approved' }) : r));
                                        toast.success('Return request approved');
                                      } catch (err) {
                                        toast.error(err.response?.data?.message || 'Failed to approve return');
                                      } finally {
                                        setUpdatingReturnId(null);
                                      }
                                    }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                                  >
                                    {updatingReturnId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                    ✓ Approve Return
                                  </button>
                                  <button
                                    disabled={updatingReturnId === req.id}
                                    onClick={() => {
                                      setRejectingReturnReq(req);
                                      setRejectionReasonInput('');
                                    }}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                                  >
                                    ✕ Reject Return
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Promotions Tab ─────────────────────────────────── */}
            {tab === 'promotions' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                  <h3 className="font-black text-gray-950 mb-1">Set Sale Price</h3>
                  <p className="text-xs text-gray-400 font-semibold mb-5">Create a promotional sale price for any product. This will appear as a discounted price on the storefront.</p>
                  <div className="grid sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">Select Product</label>
                      <select
                        value={promoProductId}
                        onChange={e => {
                          setPromoProductId(e.target.value);
                          const p = products.find(x => String(x.id) === e.target.value);
                          setPromoSalePrice(p?.sale_price ? String(p.sale_price) : '');
                        }}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                      >
                        <option value="">— Choose a product —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.title} (₹{p.price}{p.sale_price ? ` → Sale: ₹${p.sale_price}` : ''})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">Sale Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 599"
                        value={promoSalePrice}
                        onChange={e => setPromoSalePrice(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                      />
                    </div>
                  </div>
                  {promoProductId && (() => {
                    const p = products.find(x => String(x.id) === promoProductId);
                    if (!p) return null;
                    const discount = promoSalePrice ? Math.round((1 - Number(promoSalePrice) / p.price) * 100) : 0;
                    return (
                      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-indigo-800">{p.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-black text-indigo-900">₹{promoSalePrice || p.price}</span>
                            {promoSalePrice && <span className="text-sm text-gray-400 line-through">₹{p.price}</span>}
                            {discount > 0 && <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{discount}% OFF</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!promoProductId) {
                                toast.error('Please select a product');
                                return;
                              }
                              if (promoSalePrice !== '') {
                                const num = Number(promoSalePrice);
                                if (Number.isNaN(num) || num <= 0) {
                                  toast.error('Please enter a valid sale price.');
                                  return;
                                }
                                if (p && num >= p.price) {
                                  toast.error('Sale price must be lower than the original price.');
                                  return;
                                }
                              }
                              setSavingPromo(true);
                              try {
                                const payloadVal = promoSalePrice !== '' ? Number(promoSalePrice) : null;
                                const res = await adminService.updateProduct(promoProductId, { sale_price: payloadVal });
                                const updatedProd = res.data.product;
                                setProducts(prev => prev.map(x => String(x.id) === promoProductId ? (updatedProd || { ...x, sale_price: payloadVal }) : x));
                                toast.success(payloadVal !== null ? 'Sale price updated successfully.' : 'Sale price removed');
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to update sale price');
                              } finally {
                                setSavingPromo(false);
                              }
                            }}
                            disabled={savingPromo}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                          >
                            {savingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {savingPromo ? 'Updating...' : (promoSalePrice ? 'Apply Sale' : 'Remove Sale')}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Products with active sale prices */}
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h4 className="font-black text-gray-950 text-sm">Active Promotions</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {products.filter(p => p.sale_price).length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8 font-semibold">No active promotions</p>
                    ) : products.filter(p => p.sale_price).map(p => {
                      const discount = Math.round((1 - p.sale_price / p.price) * 100);
                      return (
                        <div key={p.id} className="flex items-center gap-3 p-4">
                          <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40'; }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 truncate">{p.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm font-black text-gray-900">₹{p.sale_price}</span>
                              <span className="text-xs text-gray-400 line-through">₹{p.price}</span>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{discount}% OFF</span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await adminService.updateProduct(p.id, { sale_price: null });
                                setProducts(prev => prev.map(x => x.id === p.id ? { ...x, sale_price: null } : x));
                                toast.success('Sale price removed');
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to remove sale price');
                              }
                            }}
                            className="text-xs text-rose-600 font-bold hover:text-rose-800 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* ── Order Detail Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedOrder(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[92vh] flex flex-col bg-white border border-gray-200 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 flex-shrink-0 border-b border-gray-150 bg-[#F9FAFB]">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-gray-900">Order Details</h3>
                  <p className="text-xs sm:text-sm text-indigo-650 font-bold font-mono mt-0.5">#{selectedOrder.id}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={`badge badge-${ORDER_STATUS[selectedOrder.status]?.color || 'info'} text-xs`}>
                    {ORDER_STATUS[selectedOrder.status]?.icon} {ORDER_STATUS[selectedOrder.status]?.label}
                  </span>
                  <button onClick={() => setSelectedOrder(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 bg-[#FAFBFD]">
                {orderDetailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
                  </div>
                ) : (
                  <>
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Customer Info */}
                      <div className="rounded-2xl p-5 bg-white border border-gray-150 shadow-xs">
                        <h4 className="text-xs text-indigo-650 uppercase tracking-wider font-extrabold mb-3 flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5" /> Customer
                        </h4>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm flex-shrink-0">
                            {selectedOrder.user_avatar
                              ? <img src={selectedOrder.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                              : selectedOrder.user_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{selectedOrder.user_name}</p>
                            <p className="text-xs text-gray-400 font-semibold">Customer ID #{selectedOrder.user_id}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span>{selectedOrder.user_email}</span>
                          </div>
                          {selectedOrder.shipping_address?.phone && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span>{selectedOrder.shipping_address.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="rounded-2xl p-5 bg-white border border-gray-150 shadow-xs">
                        <h4 className="text-xs text-indigo-650 uppercase tracking-wider font-extrabold mb-3 flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5" /> Payment
                        </h4>
                        <div className="space-y-2.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-400">Method</span>
                            <span className="text-gray-700 capitalize">{selectedOrder.payment_method || 'Card'}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-400">Subtotal</span>
                            <span className="text-gray-700">{formatPrice(selectedOrder.total_price)}</span>
                          </div>
                          {selectedOrder.discount > 0 && (
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-400">Discount {selectedOrder.coupon_code ? `(${selectedOrder.coupon_code})` : ''}</span>
                              <span className="text-emerald-600">-{formatPrice(selectedOrder.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-400">Delivery</span>
                            <span className="text-emerald-600">FREE</span>
                          </div>
                          <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-100">
                            <span className="text-gray-900">Total Paid</span>
                            <span className="text-indigo-600">{formatPrice(selectedOrder.final_price)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {selectedOrder.shipping_address && (
                        <div className="rounded-2xl p-5 bg-white border border-gray-150 shadow-xs">
                          <h4 className="text-xs text-indigo-650 uppercase tracking-wider font-extrabold mb-3 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Delivery Address
                          </h4>
                          <div className="text-xs text-gray-500 font-semibold space-y-1">
                            <p className="font-black text-gray-900 text-sm mb-1">{selectedOrder.shipping_address.full_name}</p>
                            <p>{selectedOrder.shipping_address.address_line}</p>
                            <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.pincode}</p>
                            <p>{selectedOrder.shipping_address.country}</p>
                          </div>
                        </div>
                      )}

                      {/* Order Meta */}
                      <div className="rounded-2xl p-5 bg-white border border-gray-150 shadow-xs">
                        <h4 className="text-xs text-indigo-650 uppercase tracking-wider font-extrabold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Order Info
                        </h4>
                        <div className="space-y-2.5 text-xs font-semibold">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Placed on</span>
                            <span className="text-gray-700">{formatDate(selectedOrder.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status</span>
                            <span className={`badge badge-${ORDER_STATUS[selectedOrder.status]?.color || 'info'} text-[10px]`}>
                              {ORDER_STATUS[selectedOrder.status]?.label}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-gray-450 font-bold">Update Status</span>
                            <select
                              value={selectedOrder.status}
                              onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                              className="text-xs bg-gray-50 border border-gray-200 text-gray-750 font-bold rounded-lg px-2 py-1 focus:outline-none"
                            >
                              {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ordered Products */}
                    <div className="rounded-2xl overflow-hidden bg-white border border-gray-150 shadow-xs">
                      <div className="px-5 py-4 border-b border-gray-100 bg-[#F9FAFB]">
                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-indigo-650" />
                          Ordered Products ({selectedOrder.items?.length || 0})
                        </h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {(selectedOrder.items || []).map(item => (
                          <div key={item.id} className="flex items-center gap-4 p-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 p-1 flex items-center justify-center">
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-contain"
                                onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=56'; }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                              <p className="text-xs text-gray-400 font-semibold mt-0.5">{item.category}{item.brand ? ` · ${item.brand}` : ''}</p>
                              <p className="text-xs text-indigo-655 font-bold mt-1">
                                {formatPrice(item.price_at_purchase)} × {item.quantity}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-black text-sm text-gray-900">{formatPrice(item.price_at_purchase * item.quantity)}</p>
                              <p className="text-[10px] text-gray-450 font-bold mt-1">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                          <p className="text-center text-gray-400 text-sm py-6 font-semibold">No items found</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      {productModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto bg-white border border-gray-100 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="font-black text-base sm:text-lg text-gray-950">
                {productModal === 'create' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={() => setProductModal(null)} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={saveProduct} className="space-y-3">
              <input className="input text-sm" placeholder="Product Title *" required value={productForm.title || ''}
                onChange={e => setProductForm(f => ({ ...f, title: e.target.value }))} />
              <textarea className="input resize-none text-sm" rows={3} placeholder="Description"
                value={productForm.description || ''} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="input text-sm" type="number" placeholder="Price *" required value={productForm.price || ''}
                  onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} />
                <input className="input text-sm" type="number" placeholder="Original Price" value={productForm.original_price || ''}
                  onChange={e => setProductForm(f => ({ ...f, original_price: e.target.value }))} />
                <input className="input text-sm" placeholder="Category *" required value={productForm.category || ''}
                  onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} />
                <input className="input text-sm" placeholder="Brand" value={productForm.brand || ''}
                  onChange={e => setProductForm(f => ({ ...f, brand: e.target.value }))} />
                <div className="col-span-2">
                  <input
                    className="input text-sm w-full"
                    type="number"
                    min="0"
                    placeholder="Stock Quantity * (e.g. 10)"
                    required
                    value={productForm.stock ?? ''}
                    onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))}
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">ℹ️ Set stock to 1 or more so the product is purchasable. Stock = 0 shows "Out of Stock".</p>
                </div>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                {[
                  { label: 'Use Image URL', mode: 'url' },
                  { label: 'Upload Image',  mode: 'upload', icon: Upload },
                ].map(opt => (
                  <button key={opt.mode} type="button" onClick={() => setImageMode(opt.mode)}
                    className={`text-sm rounded-xl px-3 py-2 border transition-colors flex items-center justify-center gap-2 ${
                      imageMode === opt.mode
                        ? 'border-indigo-600 text-indigo-650 font-bold bg-indigo-50/30'
                        : 'text-gray-400 border-gray-200 hover:text-gray-650'
                    }`}
                  >
                    {opt.icon && <opt.icon className="w-4 h-4" />}
                    {opt.label}
                  </button>
                ))}
              </div>

              {imageMode === 'url' ? (
                <input className="input text-sm" placeholder="Main Image URL" value={productForm.image_url || ''}
                  onChange={e => setProductForm(f => ({ ...f, image_url: e.target.value }))} />
              ) : (
                <div className="space-y-2">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="input text-sm" onChange={handleProductImageSelect} />
                  {productImagePreview && (
                    <img src={productImagePreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-gray-150" />
                  )}
                </div>
              )}

              <input className="input text-sm" placeholder="Extra images (comma-separated URLs)" value={productForm.images || ''}
                onChange={e => setProductForm(f => ({ ...f, images: e.target.value }))} />
              <input className="input text-sm" placeholder="Tags (comma-separated)" value={productForm.tags || ''}
                onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))} />

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!productForm.is_featured}
                  onChange={e => setProductForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="accent-[#6366F1] w-4 h-4" />
                <span className="text-sm text-gray-500 font-bold">Featured product</span>
              </label>

              {/* Return & Exchange toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={productForm.return_exchange_available !== false}
                  onChange={e => setProductForm(f => ({ ...f, return_exchange_available: e.target.checked }))}
                  className="accent-emerald-500 w-4 h-4" />
                <span className="text-sm text-gray-500 font-bold">Return &amp; Exchange Available</span>
              </label>

              {/* Sale Price */}
              <div>
                <input className="input text-sm" type="number" min="0" placeholder="Sale Price (leave empty for no sale)"
                  value={productForm.sale_price || ''}
                  onChange={e => setProductForm(f => ({ ...f, sale_price: e.target.value }))} />
                <p className="text-[10px] text-gray-400 font-semibold mt-1">💡 Setting a sale price will show it as a discounted price on the storefront</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setProductModal(null)} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold py-2.5 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Rejection Reason Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {rejectingReturnReq && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setRejectingReturnReq(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-950 text-base">Reject Return Request</h3>
                <button onClick={() => setRejectingReturnReq(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold">Product</p>
                <p className="font-bold text-sm text-gray-800">{rejectingReturnReq.product_title}</p>
                <p className="text-xs text-gray-500 mt-0.5">Requested by {rejectingReturnReq.user_name}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Reason for rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={e => setRejectionReasonInput(e.target.value)}
                  placeholder="Please specify why this return is rejected (e.g. Product returned after eligible 7-day return period)..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReturnReq(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rejectionSubmitting}
                  onClick={async () => {
                    if (!rejectionReasonInput.trim()) {
                      toast.error('Please provide a reason for rejecting this return request.');
                      return;
                    }
                    setRejectionSubmitting(true);
                    try {
                      const res = await adminService.updateReturnStatus(rejectingReturnReq.id, 'rejected', rejectionReasonInput.trim());
                      const updatedReq = res.data.request;
                      setReturns(prev => prev.map(r => r.id === rejectingReturnReq.id ? (updatedReq || { ...r, status: 'rejected', admin_notes: rejectionReasonInput.trim(), rejection_reason: rejectionReasonInput.trim() }) : r));
                      toast.success('Return request rejected');
                      setRejectingReturnReq(null);
                      setRejectionReasonInput('');
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to reject return request');
                    } finally {
                      setRejectionSubmitting(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {rejectionSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Reject Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Evidence Lightbox Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxMedia && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setLightboxMedia(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxMedia(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
              {lightboxMedia.type === 'video' ? (
                <video src={lightboxMedia.url} controls autoPlay className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain" />
              ) : (
                <img src={lightboxMedia.url} alt="Evidence preview" className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain bg-black/40" />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminProductList({ onEdit, onDelete }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products?limit=50')
      .then(res => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton h-32 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-1">
      {products.map(p => (
        <div key={p.id}
          className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
        >
          <img src={p.image_url} alt={p.title} className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-1 border border-gray-100 rounded-lg bg-white flex-shrink-0"
            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48'; }} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs sm:text-sm text-gray-800 truncate">{p.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold">{p.category} · {formatPrice(p.price)}</p>
              {Number(p.stock) > 0
                ? <span className="text-[9px] sm:text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-full">In Stock ({p.stock})</span>
                : <span className="text-[9px] sm:text-[10px] text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded-full">Out of Stock</span>
              }
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => onEdit(p)}
              className="p-1.5 sm:p-2 rounded-xl text-indigo-650 hover:bg-indigo-50 transition-colors" title="Edit">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(p.id)}
              className="p-1.5 sm:p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
