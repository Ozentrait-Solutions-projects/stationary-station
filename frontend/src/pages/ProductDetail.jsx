import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Heart, ShoppingCart, Truck, Shield, RotateCcw,
  ChevronLeft, ChevronRight, Minus, Plus, Package,
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, discountPercent, formatDate } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct]       = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [related, setRelated]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [qty, setQty]               = useState(1);
  const [tab, setTab]               = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [imgZoomed, setImgZoomed]   = useState(false);

  useEffect(() => {
    setLoading(true); setActiveImg(0); setQty(1);
    productService.getProduct(id)
      .then(res => {
        setProduct(res.data.product);
        setReviews(res.data.reviews || []);
        // Fetch related
        return productService.getProducts({ category: res.data.product.category, limit: 4 });
      })
      .then(res => setRelated((res.data.products || []).filter(p => p.id !== parseInt(id))))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));

    // Track view
    if (user) productService.trackView(id).catch(() => {});
  }, [id, user, navigate]);

  const images = product?.images?.length ? product.images : [product?.image_url].filter(Boolean);
  const wishlisted = isWishlisted(product?.id);
  const discount   = discountPercent(product?.original_price, product?.price);

  const handleAddToCart = () => {
    if (!user) return navigate('/login');
    addToCart(product.id, qty);
  };

  const handleBuyNow = () => {
    if (!user) return navigate('/login');
    addToCart(product.id, qty);
    navigate('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitting(true);
    try {
      const res = await productService.addReview(id, reviewForm);
      setReviews(prev => [res.data.review, ...prev.filter(r => r.user_id !== user.id)]);
      setReviewForm({ rating: 5, title: '', body: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return null;

  return (
    <div className="nexcart-container py-8 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-dark-400 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600 transition-colors">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary-600 transition-colors">{product.category}</Link>
        <span>/</span>
        <span className="text-dark-600 dark:text-dark-300 truncate max-w-xs">{product.title}</span>
      </nav>

      {/* ── Product Detail Card ───────────────────────────── */}
      <div className="card p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <div
              className="relative aspect-square rounded-2xl overflow-hidden bg-dark-100 dark:bg-dark-700 cursor-zoom-in mb-3"
              onClick={() => setImgZoomed(!imgZoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: imgZoomed ? 1.4 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={images[activeImg]}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-300"
                />
              </AnimatePresence>
              {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}

              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => Math.max(0, i-1)); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-dark-800/80 shadow-md hover:bg-white dark:hover:bg-dark-700 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => Math.min(images.length-1, i+1)); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-dark-800/80 shadow-md hover:bg-white dark:hover:bg-dark-700 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200
                      ${i === activeImg ? 'border-primary-500 shadow-glow-sm' : 'border-transparent hover:border-dark-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4">
            <div>
              {product.brand && <p className="text-sm text-dark-400 uppercase tracking-wider">{product.brand}</p>}
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-dark-900 dark:text-white mt-1 leading-tight">
                {product.title}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-sm text-yellow-700 dark:text-yellow-300">{Number(product.rating).toFixed(1)}</span>
              </div>
              <span className="text-sm text-dark-400">{product.review_count?.toLocaleString()} reviews</span>
              <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `✓ In Stock (${product.stock})` : '✗ Out of Stock'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold text-dark-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-lg text-dark-400 line-through">{formatPrice(product.original_price)}</span>
                  <span className="badge badge-danger font-bold">{discount}% off</span>
                </>
              )}
            </div>

            {/* Category */}
            <div>
              <Link to={`/products?category=${product.category}`} className="badge badge-info hover:opacity-80 transition-opacity">
                {product.category}
              </Link>
            </div>

            <div className="divider" />

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-dark-600 dark:text-dark-300">Quantity:</span>
              <div className="flex items-center gap-2 border border-dark-200 dark:border-dark-600 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q-1))}
                  className="px-3 py-2 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                  <Minus className="w-4 h-4 text-dark-600 dark:text-dark-300" />
                </button>
                <span className="px-4 py-2 font-semibold text-dark-900 dark:text-white min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q+1))}
                  disabled={qty >= product.stock}
                  className="px-3 py-2 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-40">
                  <Plus className="w-4 h-4 text-dark-600 dark:text-dark-300" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn-outline gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 btn-primary gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package className="w-5 h-5" /> Buy Now
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleWishlist(product.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${wishlisted ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500' : 'border-dark-200 dark:border-dark-600 text-dark-400 hover:border-red-400 hover:text-red-500'}`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck,     label: 'Free Delivery',  sub: 'On orders ₹999+' },
                { icon: Shield,    label: 'Secure',         sub: 'Encrypted payment' },
                { icon: RotateCcw, label: 'Easy Returns',   sub: '30-day policy' },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-dark-50 dark:bg-dark-800">
                  <b.icon className="w-5 h-5 text-primary-500" />
                  <span className="text-xs font-semibold text-dark-700 dark:text-dark-200">{b.label}</span>
                  <span className="text-[10px] text-dark-400">{b.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex gap-1 border-b border-dark-100 dark:border-dark-700">
            {['description','reviews'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 font-semibold text-sm capitalize transition-all duration-200 border-b-2 -mb-px
                  ${tab === t ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-dark-400 hover:text-dark-600 dark:hover:text-dark-200'}`}>
                {t} {t === 'reviews' && `(${reviews.length})`}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'description' ? (
                <div className="py-6 prose prose-dark dark:prose-invert max-w-none">
                  <p className="text-dark-600 dark:text-dark-300 leading-relaxed text-base">{product.description}</p>
                  {product.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {product.tags.map(tag => (
                        <span key={tag} className="badge badge-primary">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 space-y-6">
                  {/* Review Form */}
                  {user && (
                    <form onSubmit={submitReview} className="card p-5 space-y-4 border-primary-200 dark:border-primary-700/50 border">
                      <h4 className="font-semibold text-dark-800 dark:text-dark-100">Write a Review</h4>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: star }))}>
                            <Star className={`w-6 h-6 transition-colors ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-dark-300'}`} />
                          </button>
                        ))}
                      </div>
                      <input
                        className="input"
                        placeholder="Review title..."
                        value={reviewForm.title}
                        onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      />
                      <textarea
                        className="input resize-none"
                        rows={3}
                        placeholder="Share your experience..."
                        value={reviewForm.body}
                        onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                      />
                      <button type="submit" disabled={submitting} className="btn-primary text-sm">
                        {submitting ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </form>
                  )}

                  {reviews.length === 0 ? (
                    <p className="text-dark-400 text-center py-8">No reviews yet. Be the first to review!</p>
                  ) : (
                    reviews.map(r => (
                      <div key={r.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {r.user_avatar ? <img src={r.user_avatar} alt="" className="w-full h-full rounded-full object-cover" /> : r.user_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-dark-800 dark:text-dark-100">{r.user_name}</span>
                            <div className="flex">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-dark-300'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-dark-400">{formatDate(r.created_at)}</span>
                          </div>
                          {r.title && <p className="font-medium text-sm text-dark-800 dark:text-dark-200 mt-1">{r.title}</p>}
                          {r.body  && <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">{r.body}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Related Products ─────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-dark-900 dark:text-white mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="nexcart-container py-8">
      <div className="card p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-full rounded" />
            <div className="skeleton h-6 w-32 rounded" />
            <div className="skeleton h-10 w-40 rounded" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
