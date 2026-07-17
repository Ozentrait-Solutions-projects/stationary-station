import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart, Search, Menu, X, User,
  LogOut, Package, LayoutDashboard, ChevronDown,
  ChevronRight, ShoppingBag, Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useDebounce } from '../../hooks/useDebounce';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatters';



const NAV_LINKS = [
  { label: 'Daily Needs', to: '/products?category=Daily+Needs', isNew: true },
  { label: 'Electronics', to: '/products?category=Electronics' },
  { label: 'Fashion', to: '/products?category=Fashion' },
  { label: 'Home & Living', to: '/products?category=Home+%26+Kitchen' },
  { label: 'Beauty', to: '/products?category=Beauty' },
  { label: 'Sports', to: '/products?category=Sports' },
  { label: 'Books', to: '/products?category=Books' },
];


export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount, setSidebarOpen } = useCart();
  const { wishlist = [] } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocus, setSearchFocus] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const wishlistCount = wishlist.length || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([]);
      return;
    }

    productService.searchSuggestions(debouncedSearch)
      .then((res) => setSuggestions(res.data.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [debouncedSearch]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocus(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const params = new URLSearchParams({ search: searchQuery.trim() });
    navigate(`/products?${params.toString()}`);
    setSearchQuery('');
    setSuggestions([]);
    setSearchFocus(false);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-all duration-200 ${scrolled ? 'shadow-md' : ''}`}>
        
        {/* Top Navbar */}
        <div className="nexcart-container">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <svg width="38" height="38" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-105 transition-transform duration-200">
                <path d="M6 6H13.5L22.5 30H15L6 6Z" fill="url(#nexLogoG1)" />
                <path d="M22.5 30H30V6H22.5V30Z" fill="url(#nexLogoG2)" />
                <path d="M6 6V18L13.5 30L22.5 30L6 6Z" fill="url(#nexLogoG3)" />
                <defs>
                  <linearGradient id="nexLogoG1" x1="6" y1="6" x2="22.5" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366F1"/>
                    <stop offset="100%" stopColor="#EC4899"/>
                  </linearGradient>
                  <linearGradient id="nexLogoG2" x1="22.5" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3B82F6"/>
                    <stop offset="100%" stopColor="#6366F1"/>
                  </linearGradient>
                  <linearGradient id="nexLogoG3" x1="6" y1="6" x2="13.5" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#EC4899"/>
                    <stop offset="100%" stopColor="#3B82F6"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-gray-900 text-xl tracking-tight leading-none">
                  Nex<span className="text-[#6366F1]">Cart</span>
                </span>
                <span className="text-[10px] text-gray-400 font-semibold mt-0.5 tracking-wider">
                  Live Smart, Shop Happy
                </span>
              </div>
            </Link>



            {/* Search Bar */}
            <div className="flex-1 max-w-2xl relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="flex items-center h-12 bg-[#F9FAFB] rounded-full border border-gray-200 px-2 py-1 shadow-sm focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200">
                <input
                  type="text"
                  placeholder="Search NexCart…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  className="flex-1 h-full px-4 bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400 font-medium"
                />
                
                {/* Search button */}
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#6366F1] hover:bg-[#4F46E5] transition-colors duration-150 text-white shadow-sm"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {searchFocus && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl overflow-hidden z-50 shadow-xl border border-gray-100"
                  >
                    {suggestions.map(s => (
                      <Link
                        key={s.id}
                        to={`/products/${s.id}`}
                        onClick={() => { setSearchFocus(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#EEF2FF] transition-colors duration-100"
                      >
                        <img
                          src={s.image_url} alt={s.title}
                          className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                          onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
                          <p className="text-xs text-indigo-500 font-medium">{s.category} · {formatPrice(s.price)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">



              {/* Account */}
              {user ? (
                <div className="relative profile-menu">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex flex-col items-start border-2 border-transparent hover:border-gray-150 rounded px-2 py-1 transition-all duration-150 min-w-[80px]"
                  >
                    <span className="text-gray-400 text-[10px] leading-none">Hello, {user.name?.split(' ')[0]}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="text-gray-800 font-bold text-sm">Account</span>
                      <ChevronDown className="w-3 h-3 text-gray-600" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl overflow-hidden z-50 shadow-xl border border-gray-100"
                      >
                        <div className="p-4 border-b border-gray-100 bg-[#F9FAFB]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-1">
                          {[
                            { to: '/profile', icon: User, label: 'Your Account' },
                            { to: '/orders', icon: Package, label: 'Your Orders' },
                            { to: '/wishlist', icon: Heart, label: 'Your Wishlist' },
                          ].map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <item.icon className="w-4 h-4 text-gray-400" />
                              {item.label}
                            </Link>
                          ))}
                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 hover:bg-gray-50 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Admin Dashboard
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
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
                  className="flex flex-col items-start border-2 border-transparent hover:border-gray-150 rounded px-2 py-1 transition-all duration-150 min-w-[80px]"
                >
                  <span className="text-gray-400 text-[10px] leading-none">Hello, Guest</span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-gray-800 font-bold text-sm">Sign in</span>
                    <ChevronDown className="w-3 h-3 text-gray-600" />
                  </div>
                </Link>
              )}

              {/* Returns & Orders */}
              <Link to="/orders"
                className="hidden md:flex flex-col items-start border-2 border-transparent hover:border-gray-150 rounded px-2 py-1 transition-all duration-150 min-w-[80px]"
              >
                <span className="text-gray-400 text-[10px] leading-none">Returns</span>
                <span className="text-gray-800 font-bold text-sm mt-0.5">& Orders</span>
              </Link>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors">
                <div className="relative">
                  <Heart className="w-6 h-6 stroke-[2]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#3B82F6] text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1">Wishlist</span>
              </Link>

              {/* Cart */}
              <button
                onClick={() => user ? setSidebarOpen(true) : navigate('/login')}
                className="relative flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6 stroke-[2]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-gray-600 font-bold text-[10px] mt-1 hidden sm:block">Cart</span>
              </button>

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="border-t border-gray-100 bg-white">
          <div className="nexcart-container">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                <Link
                  to="/products"
                  className="flex items-center gap-2 bg-[#EEF2FF] text-[#6366F1] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full hover:bg-indigo-100 transition-all duration-150 flex-shrink-0"
                >
                  <Menu className="w-4 h-4" />
                  All Categories
                  <ChevronDown className="w-3.5 h-3.5" />
                </Link>

                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="relative flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-indigo-600 transition-colors uppercase tracking-wider whitespace-nowrap px-1 py-1"
                  >
                    {link.label}
                    {link.isNew && (
                      <span className="bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none transform -translate-y-2 scale-90">
                        NEW
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex flex-shrink-0">
                <Link
                  to="/products?featured=true"
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-400 via-pink-500 to-[#8B5CF6] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:opacity-95 transition-all duration-200"
                >
                  <Crown className="w-4 h-4" />
                  Premium Deals
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                style={{ top: '80px' }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-20 bottom-0 w-80 bg-white z-50 overflow-y-auto lg:hidden border-r border-gray-100 shadow-2xl"
              >
                <div className="p-6 border-b border-gray-100 bg-[#F9FAFB]">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Hello, {user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-gray-800 font-semibold text-sm mb-1">Welcome to NexCart</p>
                      <Link to="/login" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-center py-2.5 rounded-xl text-xs font-bold transition-colors">
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>

                <div className="py-2">
                  <p className="px-4 py-2 text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Browse</p>
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-6 py-3.5 text-sm font-semibold text-gray-700 hover:bg-[#EEF2FF] border-b border-gray-50 transition-colors"
                    >
                      {link.label}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>

                {user && (
                  <div className="py-4 border-t border-gray-100">
                    <p className="px-6 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">My Account</p>
                    {[
                      { to: '/profile', icon: User, label: 'Your Profile' },
                      { to: '/orders', icon: Package, label: 'Your Orders' },
                      { to: '/wishlist', icon: Heart, label: 'Your Wishlist' },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-[#EEF2FF] transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-gray-400" />
                        {item.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-indigo-600 hover:bg-[#EEF2FF] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-6 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
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

      <div className="h-20 lg:h-[136px]" />
    </>
  );
}
