import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Zap, Shield, Truck, RotateCcw, Star,
  Smartphone, Shirt, Home as HomeIcon, Book, Dumbbell, Sparkles, Gamepad2,
} from 'lucide-react';

import { productService } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';

const CATEGORIES = [
  { name: 'Electronics',   icon: Smartphone,  color: 'from-blue-500 to-cyan-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'Fashion',       icon: Shirt,        color: 'from-pink-500 to-rose-500',   bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { name: 'Home & Kitchen',icon: HomeIcon,     color: 'from-amber-500 to-orange-500',bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { name: 'Books',         icon: Book,         color: 'from-green-500 to-emerald-500',bg: 'bg-green-50 dark:bg-green-900/20' },
  { name: 'Sports',        icon: Dumbbell,     color: 'from-red-500 to-orange-500',  bg: 'bg-red-50 dark:bg-red-900/20' },
  { name: 'Beauty',        icon: Sparkles,     color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: 'Gaming',        icon: Gamepad2,     color: 'from-indigo-500 to-purple-500',bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { name: 'Furniture',     icon: HomeIcon,     color: 'from-teal-500 to-cyan-500',   bg: 'bg-teal-50 dark:bg-teal-900/20' },
];

const HERO_SLIDES = [
  {
    title: 'The Future of',
    highlight: 'Shopping',
    subtitle: 'Discover premium products with next-generation shopping experience.',
    cta: 'Explore Now',
    ctaLink: '/products',
    gradient: 'from-primary-900 via-dark-900 to-accent-900',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
    badge: '🔥 New Arrivals',
  },
  {
    title: 'Premium Tech',
    highlight: 'Deals Today',
    subtitle: 'Up to 50% off on the latest electronics from top brands.',
    cta: 'Shop Electronics',
    ctaLink: '/products?category=Electronics',
    gradient: 'from-blue-900 via-dark-900 to-primary-900',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    badge: '⚡ Flash Sale',
  },
  {
    title: 'Fashion That',
    highlight: 'Defines You',
    subtitle: 'Curated collections from global brands delivered to your door.',
    cta: 'Shop Fashion',
    ctaLink: '/products?category=Fashion',
    gradient: 'from-pink-900 via-dark-900 to-primary-900',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    badge: '✨ Trending',
  },
];

const FEATURES = [
  { icon: Truck,    title: 'Free Shipping',    desc: 'On orders above ₹999', color: 'text-green-500' },
  { icon: Shield,   title: 'Secure Payment',   desc: '100% safe transactions', color: 'text-blue-500' },
  { icon: RotateCcw,title: 'Easy Returns',     desc: '30-day return policy', color: 'text-amber-500' },
  { icon: Zap,      title: 'Fast Delivery',    desc: 'Same-day in select cities', color: 'text-primary-500' },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    productService.getFeatured()
      .then(res => setFeaturedProducts(res.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Hero auto-slide
  useEffect(() => {
    const timer = setInterval(() => setActiveSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[activeSlide];

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${slide.gradient} min-h-[85vh] flex items-center`}>
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-glow-primary"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-glow-accent"
          />
        </div>

        <div className="nexcart-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-16">
            {/* Left — Text */}
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold mb-6"
              >
                <span>{slide.badge}</span>
              </motion.div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white">
                {slide.title}<br />
                <span className="gradient-text">{slide.highlight}</span>
              </h1>

              <p className="mt-6 text-lg text-dark-300 leading-relaxed max-w-md">
                {slide.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link to={slide.ctaLink} className="btn-primary text-base px-8 py-4">
                    {slide.cta} <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/products" className="btn-secondary text-base px-8 py-4">
                    Browse All
                  </Link>
                </motion.div>
              </div>

              {/* Slide indicators */}
              <div className="flex gap-2 mt-10">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? 'w-8 bg-primary-400' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right — Image */}
            <motion.div
              key={`img-${activeSlide}`}
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7 }}
              className="relative hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="relative w-[420px] h-[420px] mx-auto">
                  <div className="absolute inset-0 rounded-4xl bg-gradient-to-br from-primary-500/30 to-accent-500/20 backdrop-blur-sm border border-white/20 shadow-2xl" />
                  <img
                    src={slide.image}
                    alt="Hero product"
                    className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover rounded-3xl"
                  />
                  {/* Floating badge */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute -top-4 -right-4 card px-4 py-3 shadow-glow"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-sm text-dark-900 dark:text-white">4.9</span>
                      <span className="text-xs text-dark-400">Rating</span>
                    </div>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="absolute -bottom-4 -left-4 card px-4 py-3 shadow-glow"
                  >
                    <p className="text-xs text-dark-400">Today's Deal</p>
                    <p className="font-display font-bold text-primary-600">Up to 50% OFF</p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ─────────────────────────────────────── */}
      <section className="bg-dark-50 dark:bg-dark-900 border-y border-dark-100 dark:border-dark-800">
        <div className="nexcart-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center shadow-sm ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-dark-800 dark:text-dark-100">{f.title}</p>
                  <p className="text-xs text-dark-400">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────── */}
      <section className="nexcart-container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="section-title">Shop by <span className="gradient-text">Category</span></h2>
          <p className="section-subtitle">Find exactly what you're looking for</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${cat.bg} border border-transparent hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-300 group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-md group-hover:shadow-glow-sm transition-shadow duration-300`}>
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-dark-700 dark:text-dark-300 text-center leading-tight">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────── */}
      <section className="nexcart-container py-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="section-title">⭐ Featured <span className="gradient-text">Products</span></h2>
            <p className="section-subtitle">Handpicked deals just for you</p>
          </div>
          <Link
            to="/products?featured=true"
            className="hidden sm:flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:gap-3 font-semibold transition-all duration-200 text-sm"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))
          }
        </div>

        <div className="text-center mt-10 sm:hidden">
          <Link to="/products" className="btn-outline">View All Products <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      {/* ── Promo Banner ───────────────────────────────────────── */}
      <section className="nexcart-container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 p-8 md:p-12 text-white"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-2 border-white/10"
            />
            <motion.div
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full border-2 border-white/10"
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="badge bg-white/20 text-white mb-3">🎟️ Limited Time Offer</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Get 20% off your first order!</h2>
              <p className="text-white/80 text-lg">Use code <span className="font-mono font-bold bg-white/20 px-2 py-1 rounded-lg">WELCOME20</span> at checkout</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link to="/products" className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-700 font-bold hover:shadow-xl transition-all duration-300">
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
