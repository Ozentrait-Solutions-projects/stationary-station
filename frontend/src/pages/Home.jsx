import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Truck, Shield, RotateCcw,
  Star, Tag, Gift, Sparkles, Lightbulb, Clock, Heart, ShoppingBag
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatters';
import toast from 'react-hot-toast';

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
      tag: "Better Choices, Happier Life",
      title: "Everything You Need, Thoughtfully Chosen",
      desc: "Premium quality products, great prices and a seamless shopping experience.",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&q=80"
    },
    {
      tag: "Upgrade Your Life",
      title: "Exclusive Tech & Smart Innovations",
      desc: "Discover premium gear, gadgets, and tech accessories curated for you.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80"
    },
    {
      tag: "Step Up Your Style",
      title: "Vibrant Summer Fashion Trends",
      desc: "Elevate your look with new fashion items and everyday accessories.",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&q=80"
    }
  ];

  // Auto slide effect
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setSlide(prev => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [SLIDES.length]);

  // Load products
  useEffect(() => {
    productService.getFeatured()
      .then(res => setFeaturedProducts(res.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 12; m = 45; s = 30; } // loop back
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Please log in to add to cart"); return; }
    addToCart(product.id);
    toast.success(`${product.title.slice(0, 20)}... added to cart!`);
  };

  const handleToggleWishlist = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Please log in to update wishlist"); return; }
    toggleWishlist(product.id);
  };

  const pad = n => String(n).padStart(2, '0');

  // Quick categories metadata
  const QUICK_FILTERS = [
    { title: "Top Rated", desc: "Best of the best", icon: Star, iconColor: "#F59E0B", bgColor: "#FEF3C7" },
    { title: "Budget Finds", desc: "Under ₹299", icon: Tag, iconColor: "#EF4444", bgColor: "#FEE2E2" },
    { title: "Combo Offers", desc: "More savings", icon: Gift, iconColor: "#EC4899", bgColor: "#FCE7F3" },
    { title: "New Arrivals", desc: "Fresh & trendy", icon: Sparkles, iconColor: "#8B5CF6", bgColor: "#EDE9FE" },
    { title: "Smart Picks", desc: "AI recommended", icon: Lightbulb, iconColor: "#3B82F6", bgColor: "#DBEAFE" },
    { title: "Gift Store", desc: "For every occasion", icon: Gift, iconColor: "#10B981", bgColor: "#D1FAE5" },
  ];

  // Category Grid images & paths
  const MAIN_CATEGORIES = [
    { name: "Electronics", discount: "Up to 40% Off", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", link: "/products?category=Electronics" },
    { name: "Fashion", discount: "Min. 30% Off", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80", link: "/products?category=Fashion" },
    { name: "Home & Living", discount: "Min. 40% Off", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80", link: "/products?category=Home+%26+Kitchen" },
    { name: "Beauty", discount: "Up to 35% Off", image: "https://images.unsplash.com/photo-1608248597481-496100c80836?w=500&q=80", link: "/products?category=Beauty" },
    { name: "Sports", discount: "Up to 40% Off", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=80", link: "/products?category=Sports" },
    { name: "Daily Needs", discount: "Up to 25% Off", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80", link: "/products?category=Daily+Needs" },
  ];

  return (
    <div className="bg-[#FAFBFD] min-h-screen pb-16">
      
      {/* ── Hero section ─────────────────────────────────────────── */}
      <section className="nexcart-container py-6">
        <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#EEF2FF] via-[#FDF2F8] to-[#FFFBEB] p-8 lg:p-14 border border-indigo-100/70 shadow-md min-h-[460px] flex items-center">
          
          {/* Background pastel decorative circles */}
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-200/20 blur-3xl pointer-events-none" />
          <div className="absolute top-12 right-1/4 w-[280px] h-[280px] rounded-full bg-pink-200/25 blur-3xl pointer-events-none" />
          


          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center w-full relative z-10"
            >
              
              {/* Left Content Column */}
              <div className="space-y-6">
                <span className="inline-block text-[#6366F1] font-bold text-sm tracking-wider uppercase bg-white/60 px-4 py-1.5 rounded-full backdrop-blur-sm border border-indigo-100/50">
                  {SLIDES[slide].tag}
                </span>
                
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                  {SLIDES[slide].title.split(',')[0]},<br />
                  <span className="text-[#6366F1] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    {SLIDES[slide].title.split(',')[1] || "Thoughtfully Chosen"}
                  </span>
                </h1>
                
                <p className="text-gray-500 text-base max-w-xl font-medium leading-relaxed">
                  {SLIDES[slide].desc}
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link to="/products" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-indigo-200 transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5">
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Badges icons strip */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-indigo-100/40 max-w-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-indigo-600 border border-indigo-50/55 flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-none">Free Delivery</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">Above ₹499</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-indigo-600 border border-indigo-50/55 flex-shrink-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-none">Easy Returns</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">Within 7 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-indigo-600 border border-indigo-50/55 flex-shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-none">Secure Payments</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">100% protected</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Product Collage Column */}
              <div className="relative flex justify-center lg:justify-end items-center">
                <div className="relative w-full max-w-[400px] h-[360px] flex items-center justify-center">
                  <img
                    src={SLIDES[slide].image}
                    alt="NexCart Collection"
                    className="rounded-3xl w-full h-[320px] object-cover shadow-lg border border-white"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600"; }}
                  />
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator at bottom */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-5 bg-indigo-600' : 'w-1.5 bg-indigo-200'}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* ── Quick badged categories strip ────────────────────────── */}
      <section className="nexcart-container py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {QUICK_FILTERS.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 bg-white border border-gray-200 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bgColor }}>
                  <IconComp className="w-5 h-5" style={{ color: item.iconColor }} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-800 leading-tight">{item.title}</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Categories Grid ──────────────────────────────────────── */}
      <section className="nexcart-container py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          
          {/* Main Category Cards */}
          {MAIN_CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              className="group bg-white rounded-3xl p-4 border border-gray-200 flex flex-col justify-between items-center text-center shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden"
            >
              <div className="w-full">
                <h3 className="text-xs font-black text-gray-800 leading-tight">{cat.name}</h3>
                <p className="text-[10px] text-indigo-500 font-extrabold mt-1">{cat.discount}</p>
              </div>
              
              <div className="w-full aspect-square mt-4 overflow-hidden rounded-2xl bg-gray-50 flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200"; }}
                />
              </div>
            </Link>
          ))}

          {/* View All Categories Card */}
          <Link
            to="/products"
            className="bg-indigo-50/60 border border-indigo-150 rounded-3xl p-6 flex flex-col justify-between text-indigo-950 shadow-xs hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
          >
            <div>
              <h3 className="text-base font-black leading-tight text-indigo-900">View All</h3>
              <h3 className="text-base font-black leading-none mt-1 text-indigo-900">Categories</h3>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-[#6366F1] flex items-center justify-center self-end shadow-sm mt-6 text-white">
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>

        </div>
      </section>

      {/* ── Deals Section + Live Green Banner ─────────────────────── */}
      <section className="nexcart-container py-6">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.4fr_0.6fr] gap-6 items-stretch">
          
          {/* Deals Grid Column */}
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-200 shadow-md flex flex-col justify-between">
            
            {/* Header: Title + Countdown Timer */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-black text-gray-900 leading-tight">Deals You'll Love</h2>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Top deals at unbeatable prices</p>
                </div>
              </div>
              
              {/* Countdown indicators */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ends in</span>
                <div className="flex gap-1.5 font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800">{pad(countdown.h)}</span>
                  <span className="text-gray-400 font-bold">:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800">{pad(countdown.m)}</span>
                  <span className="text-gray-400 font-bold">:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800">{pad(countdown.s)}</span>
                </div>
              </div>
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-3 h-64 animate-pulse space-y-3">
                    <div className="w-full h-36 bg-gray-200 rounded-xl" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                ))
              ) : (
                featuredProducts.slice(0, 6).map((product, idx) => {
                  const wishlisted = isWishlisted(product.id);
                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl p-3 border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 relative flex flex-col justify-between"
                    >
                      {/* Top badges */}
                      <div className="absolute top-4 left-4 z-10 bg-pink-100 text-pink-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        -35%
                      </div>
                      
                      <button
                        onClick={(e) => handleToggleWishlist(e, product)}
                        className={`absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-sm border border-gray-100 bg-white hover:bg-gray-50 transition-all duration-200 ${wishlisted ? 'text-red-500' : 'text-gray-400'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
                      </button>

                      {/* Product Image */}
                      <Link to={`/products/${product.id}`} className="block">
                        <div className="w-full aspect-square overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200"; }}
                          />
                        </div>

                        {/* Title / Details */}
                        <div className="mt-3">
                          <h4 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {product.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-black text-gray-900">{formatPrice(product.price)}</span>
                            {product.original_price && (
                              <span className="text-[10px] text-gray-400 line-through font-bold">{formatPrice(product.original_price)}</span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Add to cart quick button */}
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="mt-3 w-full py-1.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Add to Cart
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Eco Banner Column */}
          <div className="bg-[#EBF7F2] rounded-[32px] p-8 border border-emerald-100 flex flex-col justify-between overflow-hidden relative min-h-[400px]">
            
            {/* Background elements */}
            <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-emerald-200/20 blur-2xl pointer-events-none" />
            
            {/* Top Text content */}
            <div className="space-y-4 relative z-10">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white/70 px-3 py-1 rounded-full border border-emerald-100/50">
                Eco-Friendly Picks
              </span>
              <h2 className="font-display text-2xl font-black text-[#1F4D3D] leading-tight">
                Live Green,<br />
                Shop Green
              </h2>
              <p className="text-xs text-emerald-700/80 font-bold max-w-[220px] leading-relaxed">
                Eco-friendly picks for a better tomorrow.
              </p>
              
              <Link to="/products?search=eco" className="inline-flex items-center gap-2 bg-[#1F4D3D] hover:bg-[#15342a] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md shadow-emerald-200 transition-colors">
                Explore Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Middle Feature list to fill vertical space */}
            <div className="space-y-3 my-6 relative z-10 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-emerald-50">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">✓</span>
                <div>
                  <h4 className="text-xs font-black text-[#1F4D3D]">100% Organic</h4>
                  <p className="text-[10px] text-emerald-800/70 font-bold">Made from natural plant fibers</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-emerald-50">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">♺</span>
                <div>
                  <h4 className="text-xs font-black text-[#1F4D3D]">Recycled Materials</h4>
                  <p className="text-[10px] text-emerald-800/70 font-bold">Post-consumer recycled content</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-emerald-50">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">☀</span>
                <div>
                  <h4 className="text-xs font-black text-[#1F4D3D]">Sustainable Sourcing</h4>
                  <p className="text-[10px] text-emerald-800/70 font-bold">Ethically made and packaged</p>
                </div>
              </div>
            </div>
            
            {/* Bottom collage plant image */}
            <div className="relative z-10 mt-auto rounded-2xl overflow-hidden border border-emerald-150 shadow-xs bg-white p-1">
              <img
                src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&q=80"
                alt="Green Plant pot"
                className="w-full h-28 object-cover rounded-xl"
              />
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
