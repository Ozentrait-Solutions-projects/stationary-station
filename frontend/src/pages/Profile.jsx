import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Package, Heart, Save, Loader2, ChevronRight, Mail, Shield, LayoutDashboard, MapPin, Globe, Plus, Navigation, Trash2, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';
import { orderService, addressService } from '../services/productService';
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

  // Address management
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', full_name: '', phone: '', address_line1: '', city: '', state: '', pin_code: '', country: 'India' });
  const [savingAddress, setSavingAddress] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    addressService.getAddresses().then(res => setAddresses(res.data.addresses || [])).catch(() => {});
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported by your browser');
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const addr = data.address;
          setAddressForm(f => ({
            ...f,
            address_line1: [addr.road, addr.suburb].filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            pin_code: addr.postcode || '',
            country: addr.country || 'India',
          }));
          toast.success('Location detected! Please review and save.');
        } catch {
          toast.error('Could not reverse-geocode location. Please fill address manually.');
        }
        setDetectingLocation(false);
      },
      () => { toast.error('Location access denied.'); setDetectingLocation(false); },
      { timeout: 10000 }
    );
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.address_line1 || !addressForm.city) return toast.error('Address and city are required');
    setSavingAddress(true);
    try {
      const res = await addressService.createAddress(addressForm);
      setAddresses(prev => [res.data.address, ...prev.filter(a => !(addressForm.is_default && a.is_default))]);
      setAddressForm({ label: 'Home', full_name: '', phone: '', address_line1: '', city: '', state: '', pin_code: '', country: 'India' });
      setShowAddressForm(false);
      toast.success('Address saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save address'); }
    finally { setSavingAddress(false); }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await addressService.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address removed');
    } catch { toast.error('Failed to remove address'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Default address updated');
    } catch { toast.error('Failed to update default'); }
  };

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

                {/* Delivery Addresses section */}
                <div className="rounded-2xl p-5 mt-4 bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <h2 className="font-black text-gray-950 text-base">Saved Addresses</h2>
                    </div>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Address
                    </button>
                  </div>

                  {/* Add Address Form */}
                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSaveAddress}
                        className="overflow-hidden mb-4"
                      >
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-gray-700">New Address</p>
                            <button
                              type="button"
                              onClick={detectingLocation ? undefined : detectLocation}
                              disabled={detectingLocation}
                              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all disabled:opacity-60"
                            >
                              {detectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                              {detectingLocation ? 'Detecting…' : 'Use My Location'}
                            </button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <input className="input text-sm" placeholder="Label (e.g. Home, Office)" value={addressForm.label} onChange={e => setAddressForm(f => ({...f, label: e.target.value}))} />
                            <input className="input text-sm" placeholder="Your full name" value={addressForm.full_name} onChange={e => setAddressForm(f => ({...f, full_name: e.target.value}))} />
                            <input className="input text-sm sm:col-span-2" placeholder="Address line * (street, landmark)" required value={addressForm.address_line1} onChange={e => setAddressForm(f => ({...f, address_line1: e.target.value}))} />
                            <input className="input text-sm" placeholder="City *" required value={addressForm.city} onChange={e => setAddressForm(f => ({...f, city: e.target.value}))} />
                            <input className="input text-sm" placeholder="State" value={addressForm.state} onChange={e => setAddressForm(f => ({...f, state: e.target.value}))} />
                            <input className="input text-sm" placeholder="PIN Code" value={addressForm.pin_code} onChange={e => setAddressForm(f => ({...f, pin_code: e.target.value}))} />
                            <input className="input text-sm" placeholder="Country" value={addressForm.country} onChange={e => setAddressForm(f => ({...f, country: e.target.value}))} />
                            <input className="input text-sm" placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm(f => ({...f, phone: e.target.value}))} />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!addressForm.is_default} onChange={e => setAddressForm(f => ({...f, is_default: e.target.checked}))} className="accent-indigo-600 w-4 h-4" />
                            <span className="text-xs font-bold text-gray-600">Set as default delivery address</span>
                          </label>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowAddressForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2 rounded-xl text-xs hover:bg-gray-50 transition-colors">Cancel</button>
                            <button type="submit" disabled={savingAddress} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors disabled:opacity-60">
                              {savingAddress ? 'Saving…' : 'Save Address'}
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Saved addresses list */}
                  {addresses.length === 0 ? (
                    <div className="text-center py-6">
                      <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-semibold">No saved addresses yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className={`p-3 rounded-xl border transition-all ${addr.is_default ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-100 bg-gray-50/50'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">{addr.label}</span>
                                {addr.is_default && <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-2.5 h-2.5" />Default</span>}
                              </div>
                              <p className="text-sm font-bold text-gray-800">{addr.full_name}</p>
                              <p className="text-xs text-gray-500 font-medium">{addr.address_line1}</p>
                              <p className="text-xs text-gray-500 font-medium">{[addr.city, addr.state, addr.pin_code].filter(Boolean).join(', ')}</p>
                              <p className="text-xs text-gray-400 font-medium">{addr.country}{addr.phone ? ` · ${addr.phone}` : ''}</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              {!addr.is_default && (
                                <button onClick={() => handleSetDefault(addr.id)} title="Set as default" className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors">
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteAddress(addr.id)} title="Remove address" className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Language section */}
                <div className="rounded-2xl p-5 mt-4 bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-indigo-650" />
                    <h2 className="font-black text-gray-950 text-base">{t('language', 'Language')}</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-500 font-bold">
                    <p>Preferred display language: <span className="text-gray-700 font-black">{languages.find(l => l.code === language)?.label}</span></p>
                    <div className="flex gap-2 flex-wrap">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            toast.success(`Language set to ${lang.label}`);
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-black border transition-all duration-150 ${
                            language === lang.code
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs ring-1 ring-indigo-300'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="mr-1.5">{lang.flag}</span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold mt-3">Changing the language updates the display text in the app (searchbar, product page labels, and key UI strings).</p>
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
