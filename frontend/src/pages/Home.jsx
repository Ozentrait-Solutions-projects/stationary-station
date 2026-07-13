import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Truck, Shield, RotateCcw, Zap, ChevronLeft, ChevronRight,
  Smartphone, Shirt, Home as HomeIcon, Book, Dumbbell, Sparkles, Gamepad2,
  Timer, Tag, TrendingUp, Flame, Award, Package,
} from 'lucide-react';
import { productService } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import { useLanguage } from '../context/LanguageContext';

/* ─── Static Data ─────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    title:    'Shop Smart,',
    highlight:'Save More',
    subtitle: 'Millions of products at unbeatable prices. Free delivery on eligible orders.',
    cta:      'Shop Now',
    ctaLink:  '/products',
    cta2:     "Today's Deals",
    cta2Link: '/products?featured=true',
    badge:    '🔥 Hot Deals',
    bg:       'linear-gradient(135deg, #131921 0%, #1B2533 40%, #0F1111 100%)',
    accentColor: '#FF9900',
    image:    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=700&q=80',
  },
  {
    title:    'Premium Tech',
    highlight:'at Best Prices',
    subtitle: 'Up to 60% off on the latest electronics, gadgets, and accessories.',
    cta:      'Explore Electronics',
    ctaLink:  '/products?category=Electronics',
    cta2:     'View All Deals',
    cta2Link: '/products',
    badge:    '⚡ Flash Sale',
    bg:       'linear-gradient(135deg, #0d1b2a 0%, #1B2533 50%, #131921 100%)',
    accentColor: '#FEBD69',
    image:    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700&q=80',
  },
  {
    title:    'Fashion That',
    highlight:'Defines You',
    subtitle: 'Curated collections from global brands delivered right to your door.',
    cta:      'Shop Fashion',
    ctaLink:  '/products?category=Fashion',
    cta2:     'New Arrivals',
    cta2Link: '/products',
    badge:    '✨ New Season',
    bg:       'linear-gradient(135deg, #1a0f2e 0%, #1B2533 50%, #0F1111 100%)',
    accentColor: '#7C3AED',
    image:    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&q=80',
  },
];

const CATEGORIES = [
  { name: 'Electronics',    icon: Smartphone, color: '#007185', bg: 'rgba(0,113,133,0.15)' },
  { name: 'Fashion',        icon: Shirt,       color: '#c0392b', bg: 'rgba(192,57,43,0.15)' },
  { name: 'Home & Kitchen', icon: HomeIcon,    color: '#e67e22', bg: 'rgba(230,126,34,0.15)' },
  { name: 'Books',          icon: Book,        color: '#27ae60', bg: 'rgba(39,174,96,0.15)' },
  { name: 'Sports',         icon: Dumbbell,    color: '#e74c3c', bg: 'rgba(231,76,60,0.15)' },
  { name: 'Beauty',         icon: Sparkles,    color: '#9b59b6', bg: 'rgba(155,89,182,0.15)' },
  { name: 'Gaming',         icon: Gamepad2,    color: '#3498db', bg: 'rgba(52,152,219,0.15)' },
  { name: 'Furniture',      icon: Package,     color: '#16a085', bg: 'rgba(22,160,133,0.15)' },
];

const FEATURES = [
  { icon: Truck,    title: 'Free Delivery',   desc: 'On orders above ₹499', color: '#27ae60' },
  { icon: Shield,   title: 'Secure Payment',  desc: '100% safe & encrypted', color: '#3498db' },
  { icon: RotateCcw,title: 'Easy Returns',    desc: '30-day return window', color: '#e67e22' },
  { icon: Zap,      title: 'Fast Delivery',   desc: 'Same-day available', color: '#FF9900' },
];

/* ─── Helper Components ───────────────────────────────────────────── */
function SectionHeader({ title, subtitle, viewAllTo, icon: Icon, accent = '#FF9900' }) {
  return (
    <div className="flex items-end justify-between mb-4 px-4 pt-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
        <div>
          <h2 className="font-display text-lg font-bold text-[#E7E9EA]">{title}</h2>
          {subtitle && <p className="text-xs text-[#A0AEC0] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="text-sm font-medium flex items-center gap-1 transition-colors"
          style={{ color: '#007185' }}
          onMouseEnter={e => e.currentTarget.style.color = '#FF9900'}
          onMouseLeave={e => e.currentTarget.style.color = '#007185'}
        >
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function ProductSlider({ products, loading, skeletonCount = 5 }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  return (
    <div className="relative group px-4 pb-4">
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-16 rounded-r-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        style={{ backgroundColor: 'rgba(19,25,33,0.95)' }}
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 rounded-lg overflow-hidden" style={{ backgroundColor: '#1B2533' }}>
                <div className="skeleton w-full h-44" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-3/4" />
                  <div className="skeleton h-5 w-1/2" />
                </div>
              </div>
            ))
          : products.map((product, i) => (
              <div key={product.id} className="flex-shrink-0 w-44">
                <ProductCard product={product} index={i} compact />
              </div>
            ))
        }
      </div>

      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-16 rounded-l-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        style={{ backgroundColor: 'rgba(19,25,33,0.95)' }}
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

/* ─── Main Home Component ─────────────────────────────────────────── */
export default function Home() {
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [activeSlide, setActiveSlide]           = useState(0);
  const [recentlyViewed, setRecentlyViewed]     = useState([]);
  const [countdown, setCountdown]               = useState({ h: 5, m: 23, s: 41 });
  const slideTimer = useRef(null);

  /* Data Fetch */
  useEffect(() => {
    productService.getFeatured()
      .then(res => setFeaturedProducts(res.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    productService.getRecentlyViewed()
      .then(res => setRecentlyViewed(res.data.products || []))
      .catch(() => {});
  }, []);

  /* Hero auto-slide */
  useEffect(() => {
    slideTimer.current = setInterval(() => setActiveSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(slideTimer.current);
  }, []);

  /* Flash sale countdown */
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 5; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[activeSlide];

  const goSlide = (dir) => {
    clearInterval(slideTimer.current);
    setActiveSlide(s => (s + dir + HERO_SLIDES.length) % HERO_SLIDES.length);
    slideTimer.current = setInterval(() => setActiveSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
  };

  // Split featured into sections
  const todaysDeals     = featuredProducts.slice(0, 8);
  const trendingProducts= featuredProducts.slice(0, 6);
  const flashSaleItems  = featuredProducts.slice(2, 8);
  const electronics     = featuredProducts.slice(0, 5);
  const fashion         = featuredProducts.slice(1, 6);
  const bestSellers     = featuredProducts.slice(3, 9);

  const pad = n => String(n).padStart(2, '0');

  return (
    <div style={{ backgroundColor: '#0F1111' }} className="min-h-screen">

      {/* ── Hero Carousel ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: slide.bg, minHeight: '420px' }}>
        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="nexcart-container"
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center py-12 lg:py-16">
              {/* Text */}
              <div className="order-2 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#FEBD69' }}
                >
                  {slide.badge}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white"
                >
                  {slide.title}<br />
                  <span style={{ color: slide.accentColor }}>{slide.highlight}</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 text-base text-[#A0AEC0] leading-relaxed max-w-md"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-wrap gap-3 mt-8"
                >
                  <Link to={slide.ctaLink} className="btn-amazon-orange px-8 py-3 text-base rounded-lg font-bold">
                    {slide.cta} <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link to={slide.cta2Link} className="btn-amazon-secondary px-8 py-3 text-base rounded-lg">
                    {slide.cta2}
                  </Link>
                </motion.div>

                {/* Slide indicators */}
                <div className="flex gap-2 mt-8">
                  {HERO_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { clearInterval(slideTimer.current); setActiveSlide(i); }}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: i === activeSlide ? '2rem' : '0.5rem', backgroundColor: i === activeSlide ? '#FF9900' : 'rgba(255,255,255,0.25)' }}
                    />
                  ))}
                </div>
              </div>

              {/* Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="order-1 lg:order-2 relative"
              >
                <div className="relative w-full max-w-md mx-auto">
                  <div className="absolute inset-0 rounded-2xl blur-2xl opacity-30" style={{ background: `radial-gradient(circle, ${slide.accentColor}, transparent)` }} />
                  <img
                    src={slide.image}
                    alt="Hero product"
                    className="relative z-10 w-full h-64 lg:h-80 object-cover rounded-2xl shadow-2xl"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600'; }}
                  />
                  {/* Floating deal badge */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-3 -right-3 z-20 px-3 py-2 rounded-xl text-dark-900 font-bold text-sm shadow-lg"
                    style={{ backgroundColor: '#FF9900' }}
                  >
                    Up to 50% OFF
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev/Next arrows */}
        <button
          onClick={() => goSlide(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={() => goSlide(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </section>

      {/* ── Features Strip ─────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#131921', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="nexcart-container py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 py-2"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}18` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#E7E9EA]">{f.title}</p>
                  <p className="text-xs text-[#6B7280]">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="nexcart-container py-6 space-y-4">

        {/* ── Shop by Category ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SectionHeader title={t('shopByCategory')} subtitle={t('exploreSelection', 'Explore our wide selection')} viewAllTo="/products" />
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 px-4 pb-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 group"
                  style={{ backgroundColor: cat.bg }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = cat.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: cat.color }}
                  >
                    <cat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-[#E7E9EA] text-center leading-tight">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Today's Deals ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SectionHeader
            title={t('todaysDeals')}
            subtitle={t('dealsOfTheDay', 'Deals of the day')}
            viewAllTo="/products?featured=true"
            icon={Tag}
            accent="#FF9900"
          />
          <ProductSlider products={todaysDeals} loading={loading} />
        </motion.section>

        {/* ── 4-Column Category Cards (Amazon Home Grid) ──────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Upgrade your setup', link: '/products?category=Electronics', color: '#007185', icon: Smartphone, items: ['Laptops', 'Phones', 'Cameras', 'Audio'] },
            { title: 'Fashion essentials', link: '/products?category=Fashion',     color: '#c0392b', icon: Shirt,       items: ['Men\'s', 'Women\'s', 'Kids\'', 'Accessories'] },
            { title: 'Home & Living',      link: '/products?category=Home+%26+Kitchen', color: '#e67e22', icon: HomeIcon, items: ['Kitchen', 'Décor', 'Furniture', 'Bedding'] },
            { title: 'Game & Play',        link: '/products?category=Gaming',       color: '#3498db', icon: Gamepad2,   items: ['Consoles', 'Games', 'Controllers', 'VR'] },
          ].map((panel, i) => (
            <motion.div
              key={panel.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg overflow-hidden p-4 cursor-pointer group"
              style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: panel.color }}>
                  <panel.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-sm text-[#E7E9EA]">{panel.title}</h3>
              </div>
              <ul className="space-y-1.5 mb-3">
                {panel.items.map(item => (
                  <li key={item}>
                    <Link
                      to={panel.link}
                      className="text-sm text-[#A0AEC0] hover:text-[#E7E9EA] hover:underline transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={panel.link} className="text-sm font-medium transition-colors" style={{ color: '#007185' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FF9900'}
                onMouseLeave={e => e.currentTarget.style.color = '#007185'}
              >
                See more →
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Flash Sale ────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-end justify-between mb-4 px-4 pt-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="font-display text-lg font-bold text-[#E7E9EA]">{t('flashSale', 'Flash Sale')}</h2>
                <p className="text-xs text-[#A0AEC0]">{t('limitedTimeOffer', 'Hurry, limited time offer!')}</p>
              </div>
            </div>
            {/* Countdown */}
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-red-400" />
              <span className="text-[#A0AEC0] text-sm">{t('endsIn', 'Ends in:')}</span>
              <div className="flex gap-1">
                {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((val, i) => (
                  <span key={i} className="flex items-center">
                    <span className="px-2 py-1 rounded text-sm font-mono font-bold text-white" style={{ backgroundColor: '#B12704' }}>{val}</span>
                    {i < 2 && <span className="text-[#A0AEC0] mx-0.5 font-bold">:</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <ProductSlider products={flashSaleItems} loading={loading} />
        </motion.section>

        {/* ── Trending Now ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SectionHeader title={t('trendingNow', 'Trending Now')} subtitle={t('popularWithCustomers', 'Popular with our customers')} viewAllTo="/products" icon={TrendingUp} accent="#FEBD69" />
          <ProductSlider products={trendingProducts} loading={loading} />
        </motion.section>

        {/* ── Electronics Section ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-end justify-between px-4 pt-4 mb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#E7E9EA]">{t('electronics', 'Electronics')}</h2>
              <p className="text-xs text-[#A0AEC0] mt-0.5">{t('topRatedTechDeals', 'Top-rated tech deals')}</p>
            </div>
            <Link to="/products?category=Electronics" className="text-sm font-medium text-[#007185] hover:text-[#FF9900] transition-colors flex items-center gap-1">
              {t('seeAll', 'See all')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-4 pb-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : electronics.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </motion.section>

        {/* ── Banner + Fashion ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Promo Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 rounded-lg overflow-hidden p-5 flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, #4a1080 0%, #7C3AED 100%)', minHeight: '200px' }}
          >
            <div>
              <span className="text-xs font-bold text-purple-200 bg-white/10 px-2 py-1 rounded-full">🎟️ Limited Offer</span>
              <h3 className="font-display text-2xl font-extrabold text-white mt-3 leading-tight">
                Get 20% off<br />your first order!
              </h3>
              <p className="text-purple-200 text-sm mt-2">
                Use code <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">WELCOME20</span>
              </p>
            </div>
            <Link to="/products" className="mt-4 self-start btn-amazon-orange text-sm py-2 px-5 rounded-lg font-bold">
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Fashion Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 rounded-lg overflow-hidden"
            style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <SectionHeader title="Fashion" subtitle="Latest styles" viewAllTo="/products?category=Fashion" icon={Shirt} accent="#c0392b" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : fashion.slice(0, 3).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              }
            </div>
          </motion.section>
        </div>

        {/* ── Best Sellers ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SectionHeader title="Best Sellers" subtitle="Most loved by our customers" viewAllTo="/products" icon={Award} accent="#FEBD69" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-4 pb-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : bestSellers.slice(0, 6).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </motion.section>

        {/* ── Recently Viewed ───────────────────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <SectionHeader title="Keep Shopping For" subtitle="Continue where you left off" viewAllTo="/products" />
            <ProductSlider products={recentlyViewed} loading={false} skeletonCount={4} />
          </motion.section>
        )}

        {/* ── Newsletter ────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #131921 0%, #1B2533 100%)', border: '1px solid rgba(255,153,0,0.2)' }}
        >
          <div className="max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#FF9900] flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-dark-900" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#E7E9EA] mb-2">Stay in the Loop</h2>
            <p className="text-[#A0AEC0] text-sm mb-6">Get exclusive deals, new arrivals, and offers delivered straight to your inbox.</p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-lg text-sm text-dark-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              />
              <button className="btn-amazon-orange px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-[#6B7280] mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </motion.section>

      </div>

      {/* Bottom spacer for mobile nav */}
      <div className="h-6" />
    </div>
  );
}
