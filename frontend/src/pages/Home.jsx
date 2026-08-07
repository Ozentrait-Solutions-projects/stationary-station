import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Truck, Shield, RotateCcw,
  Star, Tag, Gift, Sparkles, Pen, BookOpen,
  Heart, ShoppingBag, ChevronLeft, ChevronRight,
  Award, Package, Users, BadgePercent, TrendingUp,
  Pencil, Palette, Calculator, Briefcase,
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatters';
import toast from 'react-hot-toast';

// ── Animated counter ──────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + increment, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

// ── Stationery brand list ────────────────────────────────────────
const BRANDS = ['Parker', 'Faber-Castell', 'Moleskine', 'Stabilo', 'Pilot', 'Rotring', 'Staedtler', 'Casio', 'Tombow', 'Winsor & Newton', 'Leuchtturm1917', 'Classmate', 'Wildcraft', 'Maped', 'Canson'];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ h: 11, m: 59, s: 59 });
  const [slide, setSlide] = useState(0);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();

  const SLIDES = [
    {
      tag: 'Premium Stationery • Delivered to Your Door',
      title: 'Write Your',
      highlight: 'Best Story',
      desc: 'Discover curated stationery from world-class brands. Premium pens, journals, art supplies and more.',
      cta: 'Shop Now',
      link: '/products',
      badge: 'FREE delivery on orders above ₹499',
      gradient: 'from-[#1e1b4b] via-[#312e81] to-[#4338ca]',
      accent: '#6366f1',
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=85',
      imageAlt: 'Premium fountain pen on paper',
    },
    {
      tag: 'New Collection — Journals & Diaries',
      title: 'Capture Every',
      highlight: 'Thought & Idea',
      desc: 'From Moleskine classics to leather-bound planners — premium notebooks for every creative mind.',
      cta: 'Shop Notebooks',
      link: '/products?category=Notebooks',
      badge: 'Up to 30% OFF on Notebooks & Diaries',
      gradient: 'from-[#064e3b] via-[#065f46] to-[#047857]',
      accent: '#10b981',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=85',
      imageAlt: 'Premium notebook and pen',
    },
    {
      tag: 'Art & Craft Essentials',
      title: 'Create Without',
      highlight: 'Limits',
      desc: 'Professional watercolors, brush pens, and art supplies trusted by artists and designers worldwide.',
      cta: 'Explore Art Supplies',
      link: '/products?category=Colors+%26+Paints',
      badge: 'Min. 20% OFF on Art & Craft',
      gradient: 'from-[#4c1d95] via-[#6d28d9] to-[#7c3aed]',
      accent: '#a855f7',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85',
      imageAlt: 'Watercolor paints and brushes',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => setSlide(prev => (prev + 1) % SLIDES.length), 5500);
    return () => clearInterval(timer);
  }, [SLIDES.length]);

  useEffect(() => {
    productService.getFeatured()
      .then(res => setFeaturedProducts(res.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 11; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('Please log in to add to cart'); return; }
    addToCart(product.id);
    toast.success(`${product.title.slice(0, 25)}... added!`);
  };

  const handleToggleWishlist = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('Please log in to save items'); return; }
    toggleWishlist(product.id);
  };

  const pad = n => String(n).padStart(2, '0');

  const QUICK_FILTERS = [
    { title: 'Best Sellers',   desc: 'Most loved picks',      icon: TrendingUp,   color: '#F59E0B', bg: '#FEF3C7', link: '/products?sort=popularity' },
    { title: 'Budget Picks',   desc: 'Under ₹499',            icon: Tag,          color: '#EF4444', bg: '#FEE2E2', link: '/products?maxPrice=499' },
    { title: 'Premium Pens',   desc: 'Luxury writing',        icon: Pen,          color: '#6366F1', bg: '#EDE9FE', link: '/products?category=Writing' },
    { title: 'New Arrivals',   desc: 'Just landed',           icon: Sparkles,     color: '#8B5CF6', bg: '#EDE9FE', link: '/products?sort=created_at_desc' },
    { title: 'Art & Craft',    desc: 'Paint & create',        icon: Palette,      color: '#EC4899', bg: '#FCE7F3', link: '/products?category=Colors+%26+Paints' },
    { title: 'Gift Combos',    desc: 'Perfect presents',      icon: Gift,         color: '#10B981', bg: '#D1FAE5', link: '/products?search=set' },
  ];

  const MAIN_CATEGORIES = [
    { name: 'Writing Instruments', discount: 'Up to 25% Off', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80', link: '/products?category=Writing',            color: '#6366F1', icon: Pen },
    { name: 'Notebooks & Journals', discount: 'Up to 30% Off', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80', link: '/products?category=Notebooks',         color: '#10B981', icon: BookOpen },
    { name: 'Art & Craft',          discount: 'Min. 20% Off',  image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80', link: '/products?category=Colors+%26+Paints', color: '#EC4899', icon: Palette },
    { name: 'Office Supplies',      discount: 'Up to 35% Off', image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&q=80', link: '/products?category=Office+Supplies',   color: '#F59E0B', icon: Briefcase },
    { name: 'School Essentials',    discount: 'Up to 40% Off', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80', link: '/products?category=School+Supplies',   color: '#3B82F6', icon: Package },
    { name: 'Calculators',          discount: 'Min. 15% Off',  image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400&q=80', link: '/products?category=Calculators',       color: '#8B5CF6', icon: Calculator },
  ];

  const TRUST_STATS = [
    { label: 'Happy Customers',   value: 50000, suffix: '+', icon: Users,   color: '#6366F1' },
    { label: 'Products Listed',   value: 5000,  suffix: '+', icon: Package, color: '#8B5CF6' },
    { label: 'Orders Delivered',  value: 25000, suffix: '+', icon: Truck,   color: '#10B981' },
    { label: 'Brand Partners',    value: 80,    suffix: '+', icon: Award,   color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8fc]">

      {/* ── Hero Slider ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1e1b4b]" style={{ minHeight: 420 }}>
        <AnimatePresence mode="wait">
          {SLIDES.map((s, i) =>
            i === slide ? (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`}
              />
            ) : null
          )}
        </AnimatePresence>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="nexcart-container relative z-10 py-10 lg:py-16">
          <AnimatePresence mode="wait">
            {SLIDES.map((s, i) =>
              i === slide ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                  className="grid lg:grid-cols-2 gap-10 items-center"
                >
                  {/* Left: content */}
                  <div>
                    <span className="inline-block text-xs font-black uppercase tracking-widest text-white/60 mb-4 bg-white/10 px-3 py-1 rounded-full">
                      {s.tag}
                    </span>
                    <div className="lg:hidden mb-6 flex justify-center">
                      <div className="relative w-full max-w-[280px] aspect-square rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <img
                          src={s.image}
                          alt={s.imageAlt}
                          className="w-full h-full object-cover"
                          loading={i === 0 ? 'eager' : 'lazy'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                      {s.title}<br />
                      <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, #fff 0%, ${s.accent} 100%)` }}>
                        {s.highlight}
                      </span>
                    </h1>
                    <p className="text-white/60 text-base font-medium mt-4 mb-8 max-w-md leading-relaxed">
                      {s.desc}
                    </p>
                    <div className="flex flex-wrap gap-3 items-center">
                      <Link
                        to={s.link}
                        id={`hero-cta-${i}`}
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-sm text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
                        style={{ backgroundColor: s.accent }}
                      >
                        {s.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-sm text-white border border-white/30 hover:bg-white/10 transition-all duration-200"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-white/50 text-xs font-bold">
                      <Truck className="w-3.5 h-3.5" />{s.badge}
                    </div>
                  </div>

                  {/* Right: hero image */}
                  <div className="hidden lg:flex justify-center items-center">
                    <div className="relative w-80 h-80 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                      <img
                        src={s.image}
                        alt={s.imageAlt}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Slide indicators + arrows */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={() => setSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length)}
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
            <button
              onClick={() => setSlide(prev => (prev + 1) % SLIDES.length)}
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Quick Filters ────────────────────────────────────────────── */}
      <section className="nexcart-container py-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_FILTERS.map((f, i) => (
            <Link
              key={i}
              to={f.link}
              id={`quick-filter-${i}`}
              className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: f.bg }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-gray-800 leading-tight">{f.title}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Main Categories ──────────────────────────────────────────── */}
      <section className="nexcart-container py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-black text-gray-900">Shop by Category</h2>
            <p className="text-gray-400 text-xs font-semibold mt-0.5">Everything stationery, in one place</p>
          </div>
          <Link to="/products" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-black transition-colors">
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MAIN_CATEGORIES.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <Link
                to={cat.link}
                id={`category-${i}`}
                className="group relative block rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-black text-xs leading-tight">{cat.name}</p>
                  <div className="mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${cat.color}40`, color: 'white' }}>
                    {cat.discount}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Flash Sale Banner ────────────────────────────────────────── */}
      <section className="nexcart-container py-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 p-6 lg:p-8 shadow-lg">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BadgePercent className="w-5 h-5 text-white" />
                <span className="text-white/80 text-xs font-black uppercase tracking-widest">Flash Sale</span>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-black text-white">Up to 50% OFF</h2>
              <p className="text-white/70 text-sm font-semibold mt-1">On premium pens, notebooks & art supplies</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Countdown */}
              <div className="flex gap-2">
                {[{ label: 'Hrs', val: countdown.h }, { label: 'Min', val: countdown.m }, { label: 'Sec', val: countdown.s }].map((t, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-black text-white tabular-nums">{pad(t.val)}</span>
                    </div>
                    <span className="text-white/60 text-[9px] font-black uppercase mt-1">{t.label}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/products?sort=popularity"
                id="flash-sale-cta"
                className="ml-2 px-6 py-3 bg-white text-rose-600 font-black text-sm rounded-2xl hover:bg-white/90 hover:-translate-y-0.5 transition-all shadow-lg whitespace-nowrap"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────── */}
      <section className="nexcart-container py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-black text-gray-900">Featured Products</h2>
            <p className="text-gray-400 text-xs font-semibold mt-0.5">Handpicked by our stationery experts</p>
          </div>
          <Link to="/products?featured=true" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-black transition-colors">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
                <div className="h-3 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featuredProducts.slice(0, 10).map((product, idx) => {
              const wishlisted = isWishlisted(product.id);
              const discountPct = product.original_price
                ? Math.round((1 - product.price / product.original_price) * 100)
                : null;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Discount badge */}
                  {discountPct > 0 && (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      -{discountPct}%
                    </div>
                  )}
                  {/* Wishlist */}
                  <button
                    onClick={e => handleToggleWishlist(e, product)}
                    id={`wishlist-${product.id}`}
                    className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-all ${wishlisted ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
                  </button>

                  <Link to={`/products/${product.id}`} className="flex flex-col flex-1 p-4">
                    {/* Image */}
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&q=75'; }}
                      />
                    </div>
                    {/* Brand */}
                    {product.brand && (
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">{product.brand}</p>
                    )}
                    {/* Title */}
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors flex-1">
                      {product.title}
                    </h3>
                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-gray-500 font-bold">{Number(product.rating).toFixed(1)}</span>
                      <span className="text-[10px] text-gray-300 font-semibold">({product.review_count})</span>
                    </div>
                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-sm font-black text-gray-900">{formatPrice(product.price)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-[10px] text-gray-400 line-through font-semibold">{formatPrice(product.original_price)}</span>
                      )}
                    </div>
                  </Link>
                  {/* Add to cart */}
                  <div className="px-4 pb-4">
                    <button
                      id={`add-to-cart-${product.id}`}
                      onClick={e => handleAddToCart(e, product)}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[10px] font-black flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3" /> Add to Cart
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Promotional Banner Strip ──────────────────────────────────── */}
      <section className="nexcart-container py-4">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Student Deals',   sub: 'Exclusive discounts for students',       icon: Pencil,     gradient: 'from-indigo-500 to-violet-600',  link: '/products?category=School+Supplies' },
            { title: 'New Arrivals',    sub: 'Fresh stationery added daily',           icon: Sparkles,   gradient: 'from-emerald-500 to-teal-600',    link: '/products?sort=created_at_desc' },
            { title: 'Gift Stationery', sub: 'Premium gifting sets & curated kits',   icon: Gift,       gradient: 'from-amber-500 to-orange-500',    link: '/products?search=set' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.link}
              id={`promo-${i}`}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r ${item.gradient} p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div>
                <p className="text-white font-black text-base leading-tight">{item.title}</p>
                <p className="text-white/75 text-xs font-semibold mt-1">{item.sub}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-white text-xs font-black border-b border-white/50 pb-0.5 group-hover:border-white transition-colors">
                  Shop Now <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trust Stats ───────────────────────────────────────────────── */}
      <section className="nexcart-container py-8">
        <div className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-[28px] p-8 lg:p-10">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-3 py-1 rounded-full mb-3">Why NexCart?</span>
            <h2 className="font-display text-2xl lg:text-3xl font-black text-white">India's Favourite Stationery Store</h2>
            <p className="text-white/50 text-sm font-medium mt-2">Trusted by students, artists, and professionals across India.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${stat.color}25` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <p className="font-display text-3xl font-black text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-white/50 text-xs font-bold mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Brand marquee */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-white/30 text-xs font-black uppercase tracking-widest mb-4">Our Brand Partners</p>
            <div className="flex gap-4 flex-wrap justify-center">
              {BRANDS.map((brand, i) => (
                <span key={i} className="text-white/40 text-sm font-black tracking-wide hover:text-white/70 transition-colors cursor-default">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ────────────────────────────────────────────── */}
      <section className="nexcart-container py-4 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Truck,    title: 'Free Delivery',     desc: 'On orders above ₹499',           color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { icon: RotateCcw, title: 'Easy Returns',    desc: 'Hassle-free 7-day policy',        color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Shield,   title: 'Secure Payments',  desc: '100% protected transactions',     color: 'text-blue-600',   bg: 'bg-blue-50' },
            { icon: Award,    title: 'Genuine Products',  desc: '100% authentic guarantee',        color: 'text-amber-600',  bg: 'bg-amber-50' },
          ].map((feature, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-sm leading-tight">{feature.title}</h4>
                <p className="text-gray-400 text-[11px] font-semibold mt-0.5">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
