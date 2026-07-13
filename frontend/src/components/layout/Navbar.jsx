import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Heart, Search, Menu, X, User,
  LogOut, Package, LayoutDashboard, ChevronDown,
  MapPin, ChevronRight, Globe, Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDebounce } from '../../hooks/useDebounce';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatters';
import { reverseGeocodeLocation, formatDetectedLocation } from '../../utils/location';

const CATEGORIES = [
  'All', 'Electronics', 'Fashion', 'Home & Kitchen',
  'Books', 'Sports', 'Beauty', 'Gaming', 'Furniture',
];

const NAV_LINKS = [
  { label: 'Today\'s Deals', to: '/products?featured=true' },
  { label: 'Electronics',    to: '/products?category=Electronics' },
  { label: 'Fashion',        to: '/products?category=Fashion' },
  { label: 'Home & Kitchen', to: '/products?category=Home+%26+Kitchen' },
  { label: 'Gaming',         to: '/products?category=Gaming' },
  { label: 'Sports',         to: '/products?category=Sports' },
  { label: 'Beauty',         to: '/products?category=Beauty' },
  { label: 'Books',          to: '/products?category=Books' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount, setSidebarOpen } = useCart();
  const { language, setLanguage, languages, t } = useLanguage();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchCat, setSearchCat]     = useState('All');
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocus, setSearchFocus] = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [catOpen, setCatOpen]         = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  const [langOpen, setLangOpen]       = useState(false);
  const langRef = useRef(null);

  // Location state
  const [locationText, setLocationText] = useState(() => {
    return localStorage.getItem('nexcart_location') || 'India';
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const locationRef = useRef(null);
  const [locationOpen, setLocationOpen] = useState(false);

  const searchRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setCatOpen(false);
    setLangOpen(false);
    setLocationOpen(false);
  }, [location]);

  useEffect(() => {
    if (debouncedSearch.length < 2) { setSuggestions([]); return; }
    productService.searchSuggestions(debouncedSearch)
      .then(res => setSuggestions(res.data.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [debouncedSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocus(false);
      if (!e.target.closest('.profile-menu')) setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (locationRef.current && !locationRef.current.contains(e.target)) setLocationOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams({ search: searchQuery.trim() });
    if (searchCat && searchCat !== 'All') params.set('category', searchCat);
    navigate(`/products?${params.toString()}`);
    setSearchQuery('');
    setSuggestions([]);
    setSearchFocus(false);
  };

  const selectLanguage = (code) => {
    setLanguage(code);
    setLangOpen(false);
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    setLocationOpen(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await reverseGeocodeLocation(latitude, longitude, 'en');
          const city = formatDetectedLocation(data.address, data.display_name);
          setLocationText(city);
          localStorage.setItem('nexcart_location', city);
        } catch {
          setLocationText('India');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.warn('Location error:', err.message);
        setLocationLoading(false);
        alert('Unable to detect location. Please allow location access in your browser settings.');
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <>
      {/* ── Main Nav ─────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'shadow-lg' : ''}`}
        style={{ backgroundColor: '#131921' }}>

        {/* Top Bar */}
        <div className="nexcart-container">
          <div className="flex items-center h-14 gap-2 sm:gap-4">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-1.5 group border-2 border-transparent hover:border-white/30 rounded px-2 py-1 transition-all duration-150">
              <div className="w-7 h-7 rounded bg-[#FF9900] flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-[#131921]" />
              </div>
              <span className="font-display font-bold text-white text-lg leading-none hidden sm:block">
                Nex<span className="text-[#FF9900]">Cart</span>
              </span>
            </Link>

            {/* Delivery Location */}
            <div className="relative hidden lg:block" ref={locationRef}>
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex flex-col items-start border-2 border-transparent hover:border-white/30 rounded px-2 py-1 transition-all duration-150 min-w-[120px] group"
                title="Select delivery location"
              >
                <span className="text-[#A0AEC0] text-[10px] leading-none group-hover:text-white">{t('deliverTo')}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {locationLoading
                    ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin flex-shrink-0" />
                    : <MapPin className="w-3.5 h-3.5 text-white flex-shrink-0" />
                  }
                  <span className="text-white font-bold text-sm truncate max-w-[90px]">{locationText}</span>
                </div>
              </button>

              <AnimatePresence>
                {locationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute top-full left-0 mt-1 w-64 rounded-lg overflow-hidden shadow-xl z-50"
                    style={{ backgroundColor: '#232F3E', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-xs text-[#A0AEC0]">{t('currentLocation')}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF9900] flex-shrink-0" />
                        <span className="text-sm font-semibold text-[#E7E9EA]">{locationText}</span>
                      </div>
                    </div>
                    <button
                      onClick={detectLocation}
                      disabled={locationLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#007185] hover:bg-white/5 transition-colors disabled:opacity-60"
                    >
                      {locationLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <MapPin className="w-4 h-4" />
                      }
                      {locationLoading ? t('detecting') : t('detectMyLocation')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-3xl relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="flex h-10 rounded-lg overflow-hidden shadow-sm">
                {/* Category dropdown */}
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setCatOpen(!catOpen)}
                    className="h-full flex items-center gap-1 px-3 text-xs font-medium text-dark-900 bg-[#e8e0d0] hover:bg-[#d5cdc0] whitespace-nowrap"
                  >
                    <span className="hidden md:inline">{searchCat === 'All' ? 'All' : searchCat.length > 10 ? searchCat.slice(0, 9) + '…' : searchCat}</span>
                    <span className="md:hidden">All</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {catOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 mt-0.5 w-48 rounded-lg overflow-hidden shadow-xl z-50"
                        style={{ backgroundColor: '#232F3E', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => { setSearchCat(cat); setCatOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              searchCat === cat
                                ? 'text-[#FF9900] font-semibold bg-white/5'
                                : 'text-[#E7E9EA] hover:bg-white/5'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input */}
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  className="flex-1 h-full px-4 text-dark-900 text-sm focus:outline-none bg-white placeholder-[#6B7280]"
                />

                {/* Search button */}
                <button
                  type="submit"
                  className="px-4 flex items-center justify-center bg-[#FEBD69] hover:bg-[#FF9900] transition-colors duration-150"
                >
                  <Search className="w-5 h-5 text-dark-900" />
                </button>
              </form>

              {/* Suggestions */}
              <AnimatePresence>
                {searchFocus && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 shadow-xl"
                    style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {suggestions.map(s => (
                      <Link
                        key={s.id}
                        to={`/products/${s.id}`}
                        onClick={() => { setSearchFocus(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors duration-100"
                      >
                        <img
                          src={s.image_url} alt={s.title}
                          className="w-10 h-10 object-cover rounded flex-shrink-0"
                          onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#E7E9EA] truncate">{s.title}</p>
                          <p className="text-xs text-[#A0AEC0]">{s.category} · {formatPrice(s.price)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">

              {/* Language Switcher */}
              <div className="relative hidden xl:block" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 border-2 border-transparent hover:border-white/30 rounded px-2 py-1 transition-all duration-150"
                >
                  <Globe className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">{language}</span>
                  <ChevronDown className={`w-3 h-3 text-white transition-transform duration-150 ${langOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -5 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 w-44 rounded-lg overflow-hidden shadow-xl z-50"
                      style={{ backgroundColor: '#232F3E', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <p className="px-4 pt-3 pb-1 text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">{t('language')}</p>
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => selectLanguage(lang.code)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            language === lang.code
                              ? 'text-[#FF9900] font-semibold bg-white/5'
                              : 'text-[#E7E9EA] hover:bg-white/5'
                          }`}
                        >
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                          {language === lang.code && (
                            <span className="ml-auto text-[#FF9900] text-xs font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Account */}
              {user ? (
                <div className="relative profile-menu">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex flex-col items-start border-2 border-transparent hover:border-white/30 rounded px-2 py-1 transition-all duration-150 min-w-[80px]"
                  >
                    <span className="text-[#A0AEC0] text-[10px] leading-none">Hello, {user.name?.split(' ')[0]}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="text-white font-bold text-sm">Account</span>
                      <ChevronDown className="w-3 h-3 text-white" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1 w-64 rounded-lg overflow-hidden z-50 shadow-xl"
                        style={{ backgroundColor: '#232F3E', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FF9900] flex items-center justify-center text-dark-900 font-bold flex-shrink-0">
                              {user.avatar
                                ? <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                : user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#E7E9EA] truncate">{user.name}</p>
                              <p className="text-xs text-[#A0AEC0] truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-1">
                          {[
                            { to: '/profile', icon: User,            label: 'Your Account' },
                            { to: '/orders',  icon: Package,         label: 'Your Orders' },
                            { to: '/wishlist',icon: Heart,           label: 'Your Wishlist' },
                          ].map(item => (
                            <Link key={item.to} to={item.to}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#E7E9EA] hover:bg-white/5 transition-colors"
                            >
                              <item.icon className="w-4 h-4 text-[#A0AEC0]" />
                              {item.label}
                            </Link>
                          ))}
                          {isAdmin && (
                            <Link to="/admin"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#FF9900] hover:bg-white/5 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Admin Dashboard
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-white/10 py-1">
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex flex-col items-start border-2 border-transparent hover:border-white/30 rounded px-2 py-1 transition-all duration-150 min-w-[80px]"
                >
                  <span className="text-[#A0AEC0] text-[10px] leading-none">Hello, Guest</span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-white font-bold text-sm">Sign in</span>
                    <ChevronDown className="w-3 h-3 text-white" />
                  </div>
                </Link>
              )}

              {/* Returns & Orders */}
              <Link to="/orders"
                className="hidden md:flex flex-col items-start border-2 border-transparent hover:border-white/30 rounded px-2 py-1 transition-all duration-150 min-w-[80px]"
              >
                <span className="text-[#A0AEC0] text-[10px] leading-none">{t('returns')}</span>
                <span className="text-white font-bold text-sm mt-0.5">& Orders</span>
              </Link>

              {/* Wishlist */}
              {user && (
                <Link to="/wishlist"
                  className="relative border-2 border-transparent hover:border-white/30 rounded p-2 transition-all duration-150"
                >
                  <Heart className="w-6 h-6 text-white" />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => user ? setSidebarOpen(true) : navigate('/login')}
                className="relative flex items-end gap-1 border-2 border-transparent hover:border-white/30 rounded px-2 py-1 transition-all duration-150 group"
              >
                <div className="relative">
                  <ShoppingCart className="w-8 h-8 text-white" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#FF9900] text-dark-900 text-[11px] font-extrabold px-1"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-white font-bold text-sm hidden sm:block pb-1">{t('cart')}</span>
              </button>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded border-2 border-transparent hover:border-white/30 transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category Nav Strip */}
        <div style={{ backgroundColor: '#232F3E', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          className="hidden lg:block">
          <div className="nexcart-container">
            <div className="flex items-center gap-0 h-10 overflow-x-auto no-scrollbar">
              {/* All / Hamburger */}
              <Link
                to="/products"
                className="flex items-center gap-1.5 px-3 h-full text-sm text-[#E7E9EA] font-medium whitespace-nowrap hover:text-white hover:bg-white/10 border-2 border-transparent hover:border-white/20 rounded transition-all duration-150"
              >
                <Menu className="w-4 h-4" />
                All
              </Link>
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 h-full flex items-center text-sm text-[#E7E9EA] whitespace-nowrap hover:text-white hover:bg-white/10 border-2 border-transparent hover:border-white/20 rounded transition-all duration-150"
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/products"
                className="px-3 h-full flex items-center text-sm text-[#FEBD69] whitespace-nowrap hover:text-[#FF9900] transition-colors duration-150 ml-auto"
              >
                {t('seeAllDeals')}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                style={{ top: '56px' }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-14 bottom-0 w-80 z-50 overflow-y-auto lg:hidden"
                style={{ backgroundColor: '#131921', borderRight: '1px solid rgba(255,255,255,0.1)' }}
              >
                {/* User section */}
                <div className="p-4 border-b border-white/10" style={{ backgroundColor: '#232F3E' }}>
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF9900] flex items-center justify-center text-dark-900 font-bold">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#E7E9EA] text-sm">Hello, {user.name}</p>
                        <p className="text-xs text-[#A0AEC0]">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <Link to="/login" className="btn-amazon-orange w-full justify-center py-2.5 rounded-lg text-sm font-semibold">
                      Sign In
                    </Link>
                  )}
                </div>

                {/* Location detection in mobile */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-2 font-semibold">{t('deliverTo')}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF9900]" />
                      <span className="text-sm text-[#E7E9EA] font-medium">{locationText}</span>
                    </div>
                    <button
                      onClick={detectLocation}
                      disabled={locationLoading}
                      className="text-xs text-[#007185] hover:text-[#FF9900] transition-colors flex items-center gap-1 disabled:opacity-60"
                    >
                      {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {locationLoading ? t('detecting') : t('detectMyLocation')}
                    </button>
                  </div>
                </div>

                {/* Language in mobile */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-2 font-semibold">{t('language')}</p>
                  <div className="flex gap-2 flex-wrap">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => selectLanguage(lang.code)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          language === lang.code
                            ? 'bg-[#FF9900] text-[#131921]'
                            : 'bg-white/5 text-[#A0AEC0] hover:bg-white/10'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nav links */}
                <div className="py-2">
                  <p className="px-4 py-2 text-xs text-[#6B7280] uppercase tracking-wider font-semibold">{t('browse')}</p>
                  {NAV_LINKS.map(link => (
                    <Link key={link.to} to={link.to}
                      className="flex items-center justify-between px-4 py-3 text-sm text-[#E7E9EA] hover:bg-white/5 border-b border-white/5 transition-colors"
                    >
                      {link.label}
                      <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                    </Link>
                  ))}
                </div>

                {user && (
                  <div className="py-2 border-t border-white/10">
                    <p className="px-4 py-2 text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Account</p>
                    {[
                      { to: '/profile', icon: User,    label: 'Your Account' },
                      { to: '/orders',  icon: Package, label: 'Your Orders' },
                      { to: '/wishlist',icon: Heart,   label: 'Your Wishlist' },
                    ].map(item => (
                      <Link key={item.to} to={item.to}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#E7E9EA] hover:bg-white/5 transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-[#A0AEC0]" />
                        {item.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#FF9900] hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer — account for fixed navbar (top bar + category strip on desktop) */}
      <div className="h-14 lg:h-[96px]" />
    </>
  );
}
