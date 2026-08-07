import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Truck, Shield, RotateCcw,
  Star, Tag, Gift, Sparkles, Lightbulb,
  Heart, ShoppingBag, ChevronLeft, ChevronRight,
  Zap, Award, Package, Users, BadgePercent, TrendingUp,
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

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ h: 12, m: 45, s: 30 });
  const [slide, setSlide] = useState(0);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();

  const SLIDES = [
    {
      tag: "Premium Quality • Best Prices",
      title: "Everything You Need,",
      highlight: "Thoughtfully Curated",
      desc: "Discover thousands of premium products delivered to your doorstep. Quality guaranteed, prices unmatched.",
      cta: "Shop Now",
      badge: "FREE delivery on orders over ₹499",
      gradient: "from-[#312e81] via-[#4338ca] to-[#6366f1]",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=85",
    },
    {
      tag: "New Season Drop",
      title: "Exclusive Tech &",
      highlight: "Smart Innovations",
      desc: "Premium gadgets, cutting-edge tech, and smart accessories curated for the modern lifestyle.",
      cta: "Explore Tech",
      badge: "Up to 40% OFF on Electronics",
      gradient: "from-[#0c4a6e] via-[#0369a1] to-[#0ea5e9]",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=85",
    },
    {
      tag: "Vibrant Summer Collection",
      title: "Fashion That",
      highlight: "Defines You",
      desc: "Step into style with our handpicked fashion collection from global brands at unbeatable prices.",
      cta: "View Collection",
      badge: "Min. 30% OFF on Fashion",
      gradient: "from-[#581c87] via-[#7c3aed] to-[#a855f7]",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=85",
    },
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => setSlide(prev => (prev + 1) % SLIDES.length), 5500);
    return () => clearInterval(slideTimer);
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
        if (h < 0) { h = 12; m = 45; s = 30; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error("Please log in to add to cart"); return; }
    addToCart(product.id);
    toast.success(`${product.title.slice(0, 20)}... added to cart!`);
  };

  const handleToggleWishlist = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error("Please log in to update wishlist"); return; }
    toggleWishlist(product.id);
  };

  const pad = n => String(n).padStart(2, '0');

  const QUICK_FILTERS = [
    { title: "Top Rated", desc: "Best of the best", icon: Star, color: "#F59E0B", bg: "#FEF3C7", link: "/products?minRating=4" },
    { title: "Budget Finds", desc: "Under ₹299", icon: Tag, color: "#EF4444", bg: "#FEE2E2", link: "/products?maxPrice=299" },
    { title: "Combo Offers", desc: "More savings", icon: Gift, color: "#EC4899", bg: "#FCE7F3", link: "/products?search=set" },
    { title: "New Arrivals", desc: "Fresh & trendy", icon: Sparkles, color: "#8B5CF6", bg: "#EDE9FE", link: "/products?sort=created_at_desc" },
    { title: "Smart Picks", desc: "AI recommended", icon: Lightbulb, color: "#3B82F6", bg: "#DBEAFE", link: "/products?featured=true" },
    { title: "Gift Store", desc: "For every occasion", icon: Gift, color: "#10B981", bg: "#D1FAE5", link: "/products?category=Home+%26+Kitchen" },
  ];

  const MAIN_CATEGORIES = [
    { name: "Electronics", discount: "Up to 40% Off", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80", link: "/products?category=Electronics", color: "#3B82F6" },
    { name: "Fashion", discount: "Min. 30% Off", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80", link: "/products?category=Fashion", color: "#EC4899" },
    { name: "Home & Living", discount: "Min. 40% Off", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80", link: "/products?category=Home+%26+Kitchen", color: "#10B981" },
    { name: "Beauty", discount: "Up to 35% Off", image: "https://images.unsplash.com/photo-1608248597481-496100c80836?w=400&q=80", link: "/products?category=Beauty", color: "#F59E0B" },
    { name: "Sports", discount: "Up to 40% Off", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80", link: "/products?category=Sports", color: "#6366F1" },
    { name: "Books", discount: "Up to 25% Off", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80", link: "/products?category=Books", color: "#8B5CF6" },
  ];

  const TRUST_STATS = [
    { label: "Happy Customers", value: 50000, suffix: "+", icon: Users, color: "#6366F1" },
    { label: "Products Listed", value: 10000, suffix: "+", icon: Package, color: "#8B5CF6" },
    { label: "Orders Delivered", value: 25000, suffix: "+", icon: Truck, color: "#10B981" },
    { label: "Brand Partners", value: 500, suffix: "+", icon: Award, color: "#F59E0B" },
  ];

  const BRANDS = ["Sony", "Apple", "Samsung", "Nike", "Dyson", "Razer", "Fitbit", "IKEA", "Ray-Ban", "Charlotte Tilbury"];

  return (
    <div className="bg-[#F8F9FF] min-h-screen pb-16">

      {/* ── Hero Banner ──────────────────────────────────────────── */}
      <section className="nexcart-container py-5">
        <div className="relative rounded-[28px] overflow-hidden min-h-[500px] flex items-center shadow-xl">

          {/* Animated gradient background */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={`absolute inset-0 bg-gradient-to-br ${SLIDES[slide].gradient}`}
            />
          </AnimatePresence>

          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />

          {/* Glowing orbs */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid lg:grid-cols-2 gap-8 items-center w-full px-8 lg:px-14 py-10 relative z-10"
            >
              {/* Left text */}
              <div className="space-y-5 text-white">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full">
                  <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  <span className="text-xs font-bold tracking-wide text-white/90">{SLIDES[slide].tag}</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.1]">
                  {SLIDES[slide].title}<br />
                  <span className="text-white drop-shadow-lg">{SLIDES[slide].highlight}</span>
                </h1>

                <p className="text-white/75 text-base font-medium max-w-md leading-relaxed">
                  {SLIDES[slide].desc}
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm"
                  >
                    {SLIDES[slide].cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-bold px-4 py-3 rounded-full">
                    <BadgePercent className="w-3.5 h-3.5 text-yellow-300" />
                    {SLIDES[slide].badge}
                  </div>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-6 pt-3 border-t border-white/20">
                  {[
                    { icon: Truck, label: "Free Delivery", sub: "Above ₹499" },
                    { icon: RotateCcw, label: "Easy Returns", sub: "Within 7 days" },
                    { icon: Shield, label: "Secure Pay", sub: "100% protected" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-[10px] sm:text-[11px] font-bold leading-none">{item.label}</p>
                        <p className="text-white/60 text-[9px] sm:text-[10px] font-semibold mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right image */}
              <div className="hidden lg:flex justify-end">
                <div className="relative w-full max-w-[380px]">
                  <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl" />
                  <img
                    src={SLIDES[slide].image}
                    alt="Featured Collection"
                    className="relative rounded-3xl w-full h-[340px] object-cover shadow-2xl border border-white/20"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600"; }}
                  />
                  {/* Floating card */}
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold leading-none">Trending Now</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">10,000+ Products</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>

          {/* Prev/Next arrows */}
          <button
            onClick={() => setSlide(p => (p - 1 + SLIDES.length) % SLIDES.length)}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSlide(p => (p + 1) % SLIDES.length)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Quick Filter Pills ────────────────────────────────────── */}
      <section className="nexcart-container py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {QUICK_FILTERS.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <Link
                key={idx}
                to={item.link}
                className="group flex items-center gap-2.5 sm:gap-3 bg-white border border-gray-100 p-2.5 sm:p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                  <IconComp className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors truncate">{item.title}</h4>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold mt-0.5 truncate">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Shop by Category ──────────────────────────────────────── */}
      <section className="nexcart-container py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-black text-gray-900">Shop by Category</h2>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold mt-0.5">Find exactly what you're looking for</p>
          </div>
          <Link to="/products" className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
            All Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {MAIN_CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={e => { e.target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200"; }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <h3 className="text-white text-xs font-black leading-tight">{cat.name}</h3>
                <p className="text-white/80 text-[9px] font-bold mt-0.5">{cat.discount}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Flash Deals ───────────────────────────────────────────── */}
      <section className="nexcart-container py-6">
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-md overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Zap className="w-4.5 h-4.5 text-white fill-white" />
              </div>
              <div>
                <h2 className="font-display text-base font-black text-gray-900">Flash Deals</h2>
                <p className="text-[10px] text-gray-400 font-bold">Top products at unbeatable prices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Ends in</span>
              <div className="flex gap-1 font-mono">
                {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((val, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-black tabular-nums">{val}</span>
                    {i < 2 && <span className="text-gray-400 font-black text-xs">:</span>}
                  </span>
                ))}
              </div>
              <Link to="/products" className="ml-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hidden sm:flex items-center gap-0.5 transition-colors">
                See All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="p-4 animate-pulse space-y-3">
                    <div className="w-full aspect-square bg-gray-100 rounded-xl" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))
              : featuredProducts.slice(0, 6).map((product) => {
                  const wishlisted = isWishlisted(product.id);
                  const salePrice = product.sale_price ? Number(product.sale_price) : null;
                  const displayPrice = salePrice || product.price;
                  const discountPct = salePrice
                    ? Math.round((1 - salePrice / product.price) * 100)
                    : product.original_price
                    ? Math.round((1 - product.price / product.original_price) * 100)
                    : null;

                  return (
                    <div key={product.id} className="group relative p-4 hover:bg-indigo-50/40 transition-colors duration-150 flex flex-col">
                      {/* Badges */}
                      {discountPct > 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          -{discountPct}%
                        </div>
                      )}
                      <button
                        onClick={e => handleToggleWishlist(e, product)}
                        className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-xs hover:shadow-sm transition-all ${wishlisted ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                      >
                        <Heart className={`w-3 h-3 ${wishlisted ? 'fill-current' : ''}`} />
                      </button>

                      <Link to={`/products/${product.id}`} className="flex flex-col flex-1">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200"; }}
                          />
                        </div>
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors flex-1">
                          {product.title}
                        </h4>
                        <div className="mt-1.5 space-y-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-gray-900">{formatPrice(displayPrice)}</span>
                            {salePrice && <span className="text-[10px] text-gray-400 line-through font-semibold">{formatPrice(product.price)}</span>}
                          </div>
                          {/* Star rating mini */}
                          <div className="flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] text-gray-500 font-semibold">{Number(product.rating).toFixed(1)}</span>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={e => handleAddToCart(e, product)}
                        className="mt-3 w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" /> Add to Cart
                      </button>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </section>

      {/* ── Promotional Banner Strip ─────────────────────────────── */}
      <section className="nexcart-container py-4">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: "Clearance Sale", sub: "Up to 70% off selected items", icon: BadgePercent, gradient: "from-rose-500 to-pink-600", link: "/products?maxPrice=2999" },
            { title: "New Arrivals", sub: "Fresh products added daily", icon: Sparkles, gradient: "from-violet-500 to-purple-600", link: "/products?sort=created_at_desc" },
            { title: "Bundle Deals", sub: "Buy more, save more", icon: Gift, gradient: "from-amber-500 to-orange-500", link: "/products?search=set" },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.link}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r ${item.gradient} p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div>
                <p className="text-white font-black text-base leading-tight">{item.title}</p>
                <p className="text-white/75 text-xs font-semibold mt-1">{item.sub}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-white text-xs font-bold border-b border-white/50 pb-0.5 group-hover:border-white transition-colors">
                  Shop Now <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trust Stats ───────────────────────────────────────────── */}
      <section className="nexcart-container py-8">
        <div className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-[28px] p-8 lg:p-10">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-3 py-1 rounded-full mb-3">Why NexCart?</span>
            <h2 className="font-display text-2xl lg:text-3xl font-black text-white">India's Trusted Shopping Destination</h2>
            <p className="text-white/50 text-sm font-medium mt-2">Millions of happy customers. Thousands of products. One platform.</p>
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
            <p className="text-center text-white/30 text-xs font-bold uppercase tracking-widest mb-4">Trusted Brands</p>
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

      {/* ── Features Strip ────────────────────────────────────────── */}
      <section className="nexcart-container py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: "Free Delivery", desc: "On orders above ₹499", color: "text-indigo-600", bg: "bg-indigo-50" },
            { icon: RotateCcw, title: "Easy Returns", desc: "Hassle-free 7-day policy", color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: Shield, title: "Secure Payments", desc: "100% protected transactions", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Award, title: "Genuine Products", desc: "100% authentic guarantee", color: "text-amber-600", bg: "bg-amber-50" },
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
