import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, TrendingUp,
  Plus, Edit3, Trash2, Loader2, BarChart2, ArrowUpRight,
  X, Save, Upload,
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

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [data, setData]     = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers]   = useState([]);
  const [saving, setSaving] = useState(false);
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');

  const [productModal, setProductModal] = useState(null); // null | 'create' | product object
  const [productForm, setProductForm]   = useState({});
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, ord, usr] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAllOrders(),
        adminService.getAllUsers(),
      ]);
      setData(dash.data);
      setOrders(ord.data.orders || []);
      setUsers(usr.data.users || []);
    } catch (err) { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await adminService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setProductForm({ ...product, images: product.images?.join(', ') || '', tags: product.tags?.join(', ') || '' });
      setProductModal('edit');
      setImageMode('url');
      setProductImageFile(null);
      setProductImagePreview(product.image_url || '');
    } else {
      setProductForm({ title:'', description:'', price:'', original_price:'', category:'', brand:'', stock:0, image_url:'', images:'', tags:'', is_featured:false });
      setProductModal('create');
      setImageMode('url');
      setProductImageFile(null);
      setProductImagePreview('');
    }
  };

  const handleProductImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProductImageFile(null);
      setProductImagePreview(productForm.image_url || '');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setProductImageFile(file);
    setProductImagePreview(objectUrl);
  };

  const saveProduct = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const imagesArray = productForm.images ? productForm.images.split(',').map(s => s.trim()).filter(Boolean) : [];
      const tagsArray = productForm.tags ? productForm.tags.split(',').map(s => s.trim()).filter(Boolean) : [];

      if (imageMode === 'upload' && productImageFile) {
        const formData = new FormData();
        formData.append('title', productForm.title || '');
        formData.append('description', productForm.description || '');
        formData.append('price', String(Number(productForm.price)));
        formData.append('original_price', productForm.original_price ? String(Number(productForm.original_price)) : '');
        formData.append('category', productForm.category || '');
        formData.append('brand', productForm.brand || '');
        formData.append('stock', String(Number(productForm.stock || 0)));
        formData.append('images', JSON.stringify(imagesArray));
        formData.append('tags', JSON.stringify(tagsArray));
        formData.append('is_featured', String(!!productForm.is_featured));
        formData.append('image', productImageFile);

        if (productModal === 'create') {
          await adminService.createProduct(formData);
          toast.success('Product created!');
        } else {
          await adminService.updateProduct(productForm.id, formData);
          toast.success('Product updated!');
        }
        setProductModal(null);
        loadData();
        return;
      }

      const payload = {
        ...productForm,
        price: Number(productForm.price),
        original_price: Number(productForm.original_price) || null,
        stock: Number(productForm.stock),
        images: imagesArray,
        tags: tagsArray,
      };

      if (productModal === 'create') {
        await adminService.createProduct(payload);
        toast.success('Product created!');
      } else {
        await adminService.updateProduct(productForm.id, payload);
        toast.success('Product updated!');
      }
      setProductModal(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await adminService.deleteProduct(id);
      toast.success('Product deleted');
      loadData();
    } catch { toast.error('Delete failed'); }
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    { id: 'orders',    label: 'Orders',     icon: ShoppingBag },
    { id: 'products',  label: 'Products',   icon: Package },
    { id: 'users',     label: 'Users',      icon: Users },
  ];

  const STAT_CARDS = data ? [
    { label: 'Total Revenue', value: formatPrice(data.stats.totalRevenue), icon: TrendingUp, color: 'from-primary-500 to-primary-600', change: '+12.5%' },
    { label: 'Total Orders',  value: data.stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'from-accent-500 to-accent-600', change: '+8.2%' },
    { label: 'Total Users',   value: data.stats.totalUsers.toLocaleString(), icon: Users, color: 'from-green-500 to-emerald-600', change: '+5.1%' },
    { label: 'Products',      value: data.stats.totalProducts.toLocaleString(), icon: Package, color: 'from-amber-500 to-orange-500', change: '+2 new' },
  ] : [];

  return (
    <div className="nexcart-container py-8 page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-dark-900 dark:text-white">Admin Panel</h1>
          <p className="text-dark-400 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link to="/" className="btn-ghost text-sm">← Back to Store</Link>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${tab === t.id ? 'bg-primary-600 text-white shadow-glow-sm' : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </aside>

        {/* Mobile Tab Buttons */}
        <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar mb-4 w-full">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${tab === t.id ? 'bg-primary-600 text-white' : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {/* Dashboard Tab */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {loading ? Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-28 rounded-2xl animate-pulse" />) :
                  STAT_CARDS.map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }}
                      className={`card p-5 bg-gradient-to-br ${card.color} text-white border-0`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <card.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> {card.change}
                        </span>
                      </div>
                      <p className="font-display text-2xl font-extrabold">{card.value}</p>
                      <p className="text-white/80 text-xs mt-1">{card.label}</p>
                    </motion.div>
                  ))
                }
              </div>

              {/* Revenue Chart */}
              {!loading && data?.revenueByDay?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary-500" /> Revenue (Last 30 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => formatPrice(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent Orders + Top Products */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="card p-5">
                  <h3 className="font-display font-bold text-dark-900 dark:text-white mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {(data?.recentOrders || []).slice(0,5).map(order => (
                      <div key={order.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-dark-800 dark:text-dark-100 truncate">{order.user_name}</p>
                          <p className="text-xs text-dark-400">#{order.id} · {formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`badge badge-${ORDER_STATUS[order.status]?.color || 'info'} text-[10px]`}>{ORDER_STATUS[order.status]?.label}</span>
                          <span className="font-bold text-dark-900 dark:text-white">{formatPrice(order.final_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Products */}
                <div className="card p-5">
                  <h3 className="font-display font-bold text-dark-900 dark:text-white mb-4">Top Selling Products</h3>
                  <div className="space-y-3">
                    {(data?.topProducts || []).map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-display font-bold text-dark-300 dark:text-dark-600 text-sm w-4">#{i+1}</span>
                        <img src={p.image_url} alt={p.title} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate">{p.title}</p>
                          <p className="text-xs text-dark-400">{Number(p.total_sold).toLocaleString()} sold</p>
                        </div>
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">{formatPrice(p.revenue)}</p>
                      </div>
                    ))}
                    {(!data?.topProducts || data.topProducts.length === 0) && (
                      <p className="text-dark-400 text-sm text-center py-4">No sales data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {tab === 'orders' && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-dark-100 dark:border-dark-700">
                <h3 className="font-display font-bold text-dark-900 dark:text-white">All Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-dark-50 dark:bg-dark-800">
                      {['Order ID','Customer','Date','Amount','Status','Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-primary-600 dark:text-primary-400 font-bold">#{order.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-dark-800 dark:text-dark-100 truncate max-w-[120px]">{order.user_name}</p>
                          <p className="text-xs text-dark-400 truncate max-w-[120px]">{order.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-dark-500 dark:text-dark-400 whitespace-nowrap">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3 font-bold text-dark-900 dark:text-white whitespace-nowrap">{formatPrice(order.final_price)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge badge-${ORDER_STATUS[order.status]?.color || 'info'}`}>{ORDER_STATUS[order.status]?.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            className="text-xs rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            {Object.keys(ORDER_STATUS).map(s => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <p className="text-center text-dark-400 py-8">No orders found</p>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {tab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-dark-900 dark:text-white">Product Management</h3>
                <button onClick={() => openProductModal(null)} className="btn-primary text-sm gap-2">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dark-50 dark:bg-dark-800">
                        {['Product','Category','Price','Stock','Rating','Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                      {/* We fetch products on demand */}
                      {(data?.topProducts?.length === 0 || true) && orders.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-dark-400">Loading products…</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-dark-100 dark:border-dark-700">
                  <AdminProductList onEdit={openProductModal} onDelete={deleteProduct} />
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-dark-100 dark:border-dark-700">
                <h3 className="font-display font-bold text-dark-900 dark:text-white">All Users ({users.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-dark-50 dark:bg-dark-800">
                      {['User','Email','Role','Joined'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-dark-800 dark:text-dark-100">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-dark-500 dark:text-dark-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-dark-500 dark:text-dark-400 whitespace-nowrap">{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {productModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            className="w-full max-w-lg card p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-dark-900 dark:text-white">
                {productModal === 'create' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={() => setProductModal(null)} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700">
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>
            <form onSubmit={saveProduct} className="space-y-3">
              <input className="input" placeholder="Product Title *" required value={productForm.title || ''}
                onChange={e => setProductForm(f => ({...f, title: e.target.value}))} />
              <textarea className="input resize-none" rows={3} placeholder="Description"
                value={productForm.description || ''} onChange={e => setProductForm(f => ({...f, description: e.target.value}))} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" type="number" placeholder="Price *" required value={productForm.price || ''}
                  onChange={e => setProductForm(f => ({...f, price: e.target.value}))} />
                <input className="input" type="number" placeholder="Original Price" value={productForm.original_price || ''}
                  onChange={e => setProductForm(f => ({...f, original_price: e.target.value}))} />
                <input className="input" placeholder="Category *" required value={productForm.category || ''}
                  onChange={e => setProductForm(f => ({...f, category: e.target.value}))} />
                <input className="input" placeholder="Brand" value={productForm.brand || ''}
                  onChange={e => setProductForm(f => ({...f, brand: e.target.value}))} />
                <input className="input" type="number" placeholder="Stock" value={productForm.stock || 0}
                  onChange={e => setProductForm(f => ({...f, stock: e.target.value}))} />
              </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`text-sm rounded-xl px-3 py-2 border transition-colors ${imageMode === 'url' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-dark-200 dark:border-dark-600 text-dark-500 dark:text-dark-300'}`}
                  >
                    Use Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`text-sm rounded-xl px-3 py-2 border transition-colors flex items-center justify-center gap-2 ${imageMode === 'upload' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-dark-200 dark:border-dark-600 text-dark-500 dark:text-dark-300'}`}
                  >
                    <Upload className="w-4 h-4" /> Upload Image
                  </button>
                </div>

                {imageMode === 'url' ? (
                  <input className="input" placeholder="Main Image URL" value={productForm.image_url || ''}
                    onChange={e => setProductForm(f => ({...f, image_url: e.target.value}))} />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="input"
                      onChange={handleProductImageSelect}
                    />
                    {productImagePreview && (
                      <img src={productImagePreview} alt="Product preview" className="w-24 h-24 rounded-xl object-cover border border-dark-200 dark:border-dark-700" />
                    )}
                  </div>
                )}

              <input className="input" placeholder="Extra images (comma-separated URLs)" value={productForm.images || ''}
                onChange={e => setProductForm(f => ({...f, images: e.target.value}))} />
              <input className="input" placeholder="Tags (comma-separated)" value={productForm.tags || ''}
                onChange={e => setProductForm(f => ({...f, tags: e.target.value}))} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!productForm.is_featured}
                  onChange={e => setProductForm(f => ({...f, is_featured: e.target.checked}))}
                  className="accent-primary-600 w-4 h-4" />
                <span className="text-sm text-dark-600 dark:text-dark-300">Featured product</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setProductModal(null)} className="flex-1 btn-ghost border border-dark-200 dark:border-dark-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Inline product list component
function AdminProductList({ onEdit, onDelete }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllOrders({ limit: 1 }) // Just to check admin; actual product fetch:
    api.get('/products?limit=50')
    .then(res => setProducts(res.data.products || []))
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-32 rounded-xl skeleton" />;

  return (
    <div className="space-y-2">
      {products.map(p => (
        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors">
          <img src={p.image_url} alt={p.title} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-dark-800 dark:text-dark-100 truncate">{p.title}</p>
            <p className="text-xs text-dark-400">{p.category} · Stock: {p.stock} · {formatPrice(p.price)}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(p)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(p.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
