import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Heart, ShoppingCart, Truck, Shield, RotateCcw,
  ChevronLeft, ChevronRight, Minus, Plus, Package,
  CheckCircle, AlertTriangle, ChevronDown, Share2,
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
  const { user }   = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct]       = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [related, setRelated]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [qty, setQty]               = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    setLoading(true); setActiveImg(0); setQty(1);
    productService.getProduct(id)
      .then(res => {
        setProduct(res.data.product);
        setReviews(res.data.reviews || []);
        return productService.getProducts({ category: res.data.product.category, limit: 6 });
      })
      .then(res => setRelated((res.data.products || []).filter(p => p.id !== parseInt(id))))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));

    if (user) productService.trackView(id).catch(() => {});
  }, [id, user, navigate]);

  const images    = product?.images?.length ? product.images : [product?.image_url].filter(Boolean);
  const wishlisted = isWishlisted(product?.id);
  const discount   = discountPercent(product?.original_price, product?.price);
  const rating     = Number(product?.rating) || 0;
  const fullStars  = Math.floor(rating);
  const hasHalf    = rating - fullStars >= 0.5;

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    setAddingCart(true);
    await addToCart(product.id, qty);
    setAddingCart(false);
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
      setShowReviewForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.title,
      text: `Check out ${product?.title} on NexCart — only ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product?.price)}!`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Use a simple toast if available, else alert
        if (typeof window !== 'undefined') {
          const { default: t } = await import('react-hot-toast');
          t.success('Product link copied to clipboard!');
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(window.location.href);
          const { default: t } = await import('react-hot-toast');
          t.success('Product link copied to clipboard!');
        } catch {
          alert('Copy this link: ' + window.location.href);
        }
      }
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return null;

  return (
    <div style={{ backgroundColor: '#0F1111' }} className="min-h-screen pb-12">
      <div className="nexcart-container py-4">

        {/* Breadcrumb */}
        <nav className="amazon-breadcrumb mb-4">
          <a href="/">NexCart</a>
          <span>/</span>
          <a href="/products">Products</a>
          <span>/</span>
          <a href={`/products?category=${product.category}`}>{product.category}</a>
          <span>/</span>
          <span className="text-[#E7E9EA] truncate max-w-xs">{product.title}</span>
        </nav>

        {/* ── Main Product Area ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* ── Left: Image Gallery ─────────────────────────────────── */}
          <div className="lg:col-span-1 hidden lg:flex flex-col gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 transition-all ${
                  i === activeImg ? 'border-[#FF9900]' : 'border-transparent hover:border-[#FEBD69]'
                }`}
                style={{ backgroundColor: '#1B2533' }}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* ── Center: Main Image ──────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div
              className="relative rounded-lg overflow-hidden aspect-square cursor-zoom-in"
              style={{ backgroundColor: '#1B2533' }}
            >
              {discount > 0 && (
                <div className="absolute top-3 left-3 z-10 bg-[#B12704] text-white text-xs font-bold px-2 py-1 rounded">
                  -{discount}%
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={images[activeImg]}
                  alt={product.title}
                  className="w-full h-full object-contain p-4 hover:scale-110 transition-transform duration-300"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600'; }}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setActiveImg(i => Math.min(images.length - 1, i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar lg:hidden">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition-all ${
                      i === activeImg ? 'border-[#FF9900]' : 'border-transparent'
                    }`} style={{ backgroundColor: '#1B2533' }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product Info ─────────────────────────────────── */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Brand */}
            {product.brand && (
              <p className="text-sm text-[#007185] hover:text-[#FF9900] cursor-pointer hover:underline transition-colors">
                Visit the {product.brand} Store
              </p>
            )}

            {/* Title */}
            <h1 className="font-display text-xl lg:text-2xl font-semibold text-[#E7E9EA] leading-tight">
              {product.title}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < fullStars || (i === fullStars && hasHalf) ? 'fill-[#FF9900] text-[#FF9900]' : 'fill-[#374151] text-[#374151]'}`} />
                  ))}
                </div>
                <span className="text-[#007185] text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
              </div>
              <a href="#reviews" className="text-sm text-[#007185] hover:text-[#FF9900] hover:underline transition-colors">
                {product.review_count?.toLocaleString()} ratings
              </a>
              <span className="text-[#6B7280] text-sm">|</span>
              <Link to={`/products?category=${product.category}`} className="text-sm text-[#007185] hover:text-[#FF9900] hover:underline transition-colors">
                {product.category}
              </Link>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-[#E7E9EA]">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#6B7280]">M.R.P.:</span>
                    <span className="text-sm text-[#6B7280] line-through">{formatPrice(product.original_price)}</span>
                    <span className="bg-[#B12704] text-white text-xs font-bold px-2 py-0.5 rounded">
                      ({discount}% off)
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#6B7280] mt-1">Inclusive of all taxes</p>
            </div>

            {/* Offers */}
            <div className="rounded-lg p-3" style={{ backgroundColor: '#1B2533', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-bold text-[#E7E9EA] mb-2">Available Offers</h3>
              <ul className="space-y-1.5">
                {[
                  { icon: '🏦', text: '10% Bank Offer on HDFC Credit Cards' },
                  { icon: '🔖', text: `Use code WELCOME20 for 20% off first order` },
                  { icon: '🚚', text: 'Free Delivery on orders above ₹499' },
                ].map((offer, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#E7E9EA]">
                    <span>{offer.icon}</span>
                    <span>{offer.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">In Stock</span>
                  {product.stock <= 5 && (
                    <span className="text-red-400 text-xs">Only {product.stock} left!</span>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">Currently Unavailable</span>
                </>
              )}
            </div>

            {/* Delivery estimate */}
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-[#007185] mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-[#A0AEC0]">Delivery by </span>
                <span className="text-[#E7E9EA] font-medium">Tomorrow if ordered in next 5 hrs</span>
                <span className="text-green-400 font-medium"> FREE</span>
              </div>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs text-[#A0AEC0] rounded"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Amazon Buy Box ───────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 rounded-lg p-4 space-y-3" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Price */}
              <div>
                <p className="text-2xl font-bold text-[#E7E9EA]">{formatPrice(product.price)}</p>
                <p className="text-xs text-green-400 font-medium mt-0.5">FREE Delivery</p>
                <p className="text-xs text-[#A0AEC0] mt-1">Delivery by Tomorrow</p>
              </div>

              {/* In stock */}
              {product.stock > 0 && (
                <p className="text-green-400 text-sm font-medium">In Stock</p>
              )}

              {/* Quantity */}
              {product.stock > 0 && (
                <div>
                  <label className="text-xs text-[#A0AEC0] font-medium block mb-1.5">Qty:</label>
                  <div className="flex items-center gap-2 rounded-lg overflow-hidden w-fit"
                    style={{ border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#1B2533' }}>
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-white/5 transition-colors text-[#E7E9EA]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-2 font-bold text-[#E7E9EA] text-sm min-w-[2.5rem] text-center">{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      disabled={qty >= product.stock}
                      className="px-3 py-2 hover:bg-white/5 transition-colors text-[#E7E9EA] disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingCart}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to bottom, #f0c14b, #e47911)', border: '1px solid #e47911', color: '#131921' }}
              >
                <ShoppingCart className="w-4 h-4" />
                {addingCart ? 'Adding…' : 'Add to Cart'}
              </motion.button>

              {/* Buy Now */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to bottom, #FF9900, #e47911)', border: '1px solid #c67600', color: '#131921' }}
              >
                <Package className="w-4 h-4" />
                Buy Now
              </motion.button>

              {/* Wishlist */}
              <button
                onClick={() => { if (!user) navigate('/login'); else toggleWishlist(product.id); }}
                className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  wishlisted
                    ? 'text-red-400 border-red-400/30'
                    : 'text-[#A0AEC0] hover:text-red-400'
                }`}
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-400 text-red-400' : ''}`} />
                {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </button>

              {/* Trust badges */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {[
                  { icon: Shield,    text: 'Secure transaction' },
                  { icon: Package,   text: 'Ships from NexCart' },
                  { icon: RotateCcw, text: '30-day easy returns' },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2 text-xs text-[#A0AEC0]">
                    <b.icon className="w-3.5 h-3.5 text-[#6B7280]" />
                    {b.text}
                  </div>
                ))}
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 text-xs text-[#007185] hover:text-[#FF9900] transition-colors py-2 rounded-lg hover:bg-white/5"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share this product
              </button>
            </div>
          </div>
        </div>

        {/* ── Description & Reviews ──────────────────────────────────── */}
        <div className="mt-8 space-y-6">

          {/* Description */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="font-display text-lg font-bold text-[#E7E9EA] mb-4">About this item</h2>
            <p className="text-[#A0AEC0] text-sm leading-relaxed">{product.description}</p>

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs text-[#A0AEC0] rounded"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Specs table */}
            <div className="mt-6">
              <h3 className="font-semibold text-[#E7E9EA] text-sm mb-3">Product Details</h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Category', product.category],
                    ['Brand',    product.brand || 'Generic'],
                    ['In Stock', `${product.stock} units`],
                    ['Rating',   `${Number(product.rating).toFixed(1)} / 5.0`],
                  ].map(([key, val]) => (
                    <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-2 pr-4 text-[#A0AEC0] font-medium w-36">{key}</td>
                      <td className="py-2 text-[#E7E9EA]">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews */}
          <div id="reviews" className="rounded-lg p-6" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-display text-lg font-bold text-[#E7E9EA]">
                Customer Reviews
                <span className="text-[#6B7280] text-base font-normal ml-2">({reviews.length})</span>
              </h2>

              {/* Overall rating summary */}
              <div className="flex items-center gap-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < fullStars ? 'fill-[#FF9900] text-[#FF9900]' : 'fill-[#374151] text-[#374151]'}`} />
                  ))}
                </div>
                <span className="text-xl font-bold text-[#E7E9EA]">{Number(product.rating).toFixed(1)}</span>
                <span className="text-sm text-[#6B7280]">out of 5</span>
              </div>
            </div>

            {/* Review Form Toggle */}
            {user && (
              <div className="mb-6">
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-outline text-sm px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  ✍️ Write a Customer Review
                  <ChevronDown className={`w-4 h-4 transition-transform ${showReviewForm ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showReviewForm && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={submitReview}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 p-4 rounded-lg" style={{ backgroundColor: '#1B2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div>
                          <label className="text-sm text-[#A0AEC0] mb-1.5 block">Overall rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button key={star} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: star }))}>
                                <Star className={`w-6 h-6 transition-colors ${star <= reviewForm.rating ? 'fill-[#FF9900] text-[#FF9900]' : 'fill-[#374151] text-[#374151]'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <input className="input text-sm" placeholder="Review title (optional)"
                          value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} />
                        <textarea className="input resize-none text-sm" rows={3}
                          placeholder="Share your experience with this product…"
                          value={reviewForm.body} onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))} />
                        <div className="flex gap-3">
                          <button type="submit" disabled={submitting} className="btn-amazon-orange text-sm px-5 py-2 rounded-lg">
                            {submitting ? 'Submitting…' : 'Submit Review'}
                          </button>
                          <button type="button" onClick={() => setShowReviewForm(false)} className="btn-ghost text-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-[#374151] mx-auto mb-3" />
                <p className="text-[#6B7280]">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map(r => (
                  <div key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="pb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF9900] flex items-center justify-center text-dark-900 font-bold text-sm flex-shrink-0">
                        {r.user_avatar
                          ? <img src={r.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          : r.user_name?.[0]?.toUpperCase()
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[#E7E9EA]">{r.user_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-[#FF9900] text-[#FF9900]' : 'fill-[#374151] text-[#374151]'}`} />
                            ))}
                          </div>
                          {r.title && <span className="text-sm font-medium text-[#E7E9EA]">{r.title}</span>}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">Reviewed on {formatDate(r.created_at)}</p>
                        {r.body && <p className="text-sm text-[#A0AEC0] mt-2 leading-relaxed">{r.body}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ─────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-8 rounded-lg overflow-hidden" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h2 className="font-display text-lg font-bold text-[#E7E9EA]">Related Products</h2>
              <Link to={`/products?category=${product.category}`} className="text-sm text-[#007185] hover:text-[#FF9900] transition-colors">
                See more →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-4 pb-4">
              {related.slice(0, 6).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div style={{ backgroundColor: '#0F1111' }} className="min-h-screen py-6">
      <div className="nexcart-container">
        <div className="skeleton h-4 w-72 mb-4 rounded" />
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-1 hidden lg:flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton w-12 h-12 rounded" />)}
          </div>
          <div className="lg:col-span-5">
            <div className="skeleton aspect-square rounded-lg" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-7 w-full rounded" />
            <div className="skeleton h-7 w-3/4 rounded" />
            <div className="skeleton h-5 w-32 rounded" />
            <div className="skeleton h-10 w-48 rounded" />
            <div className="skeleton h-24 rounded-lg" />
          </div>
          <div className="lg:col-span-2">
            <div className="skeleton h-80 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
