import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Heart, ShoppingCart, Truck, Shield, RotateCcw,
  ChevronLeft, ChevronRight, Minus, Plus, Package,
  CheckCircle, AlertTriangle, ChevronDown, Share2, MapPin
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice, discountPercent, formatDate } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';
import { normalizeStock } from '../utils/stock';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user }   = useAuth();
  const { t } = useLanguage();
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
  const [userLocation, setUserLocation] = useState('Detecting location...');

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.city && data.country_name) {
          setUserLocation(`${data.city}, ${data.country_name}`);
        } else {
          setUserLocation('India');
        }
      })
      .catch(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setUserLocation(`Location (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
            },
            () => {
              setUserLocation('India');
            }
          );
        } else {
          setUserLocation('India');
        }
      });
  }, []);

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
  const stock     = normalizeStock(product?.stock, 1);
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
    <div className="min-h-screen bg-[#FAFBFD] pb-12">
      <div className="nexcart-container py-4">

        {/* Breadcrumb */}
        <nav className="amazon-breadcrumb mb-4">
          <a href="/">NexCart</a>
          <span>/</span>
          <a href="/products">Products</a>
          <span>/</span>
          <a href={`/products?category=${product.category}`}>{product.category}</a>
          <span>/</span>
          <span className="text-gray-800 font-bold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* ── Main Product Area ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* ── Left: Image Gallery ─────────────────────────────────── */}
          <div className="lg:col-span-1 hidden lg:flex flex-col gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-12 h-12 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all bg-white ${
                  i === activeImg ? 'border-[#6366F1]' : 'border-gray-100 hover:border-indigo-300'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* ── Center: Main Image ──────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div
              className="relative rounded-2xl overflow-hidden aspect-square cursor-zoom-in bg-white border border-gray-100 shadow-sm"
            >
              {discount > 0 && (
                <div className="absolute top-3 left-3 z-10 bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded-full">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-white border border-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setActiveImg(i => Math.min(images.length - 1, i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-white border border-gray-100"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar lg:hidden">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-xl border-2 overflow-hidden transition-all bg-white ${
                      i === activeImg ? 'border-[#6366F1]' : 'border-gray-100'
                    }`}>
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
              <p className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline transition-colors font-bold">
                Visit the {product.brand} Store
              </p>
            )}

            {/* Title */}
            <h1 className="font-display text-xl lg:text-2xl font-extrabold text-gray-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < fullStars || (i === fullStars && hasHalf) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-[#E5E7EB] text-[#E5E7EB]'}`} />
                  ))}
                </div>
                <span className="text-gray-700 text-sm font-bold">{Number(product.rating).toFixed(1)}</span>
              </div>
              <a href="#reviews" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-bold">
                {product.review_count?.toLocaleString()} ratings
              </a>
              <span className="text-gray-300 text-sm">|</span>
              <Link to={`/products?category=${product.category}`} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-bold">
                {product.category}
              </Link>
            </div>

            <div className="border-t border-gray-200" />

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-black text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 font-medium">M.R.P.:</span>
                    <span className="text-sm text-gray-400 line-through font-medium">{formatPrice(product.original_price)}</span>
                    <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      ({discount}% off)
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-450 mt-1 font-medium">Inclusive of all taxes</p>
            </div>

            {/* Offers */}
            <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm">
              <h3 className="text-sm font-black text-gray-800 mb-2">{t('availableOffers')}</h3>
              <ul className="space-y-1.5">
                {[
                  { icon: '🏦', text: '10% Bank Offer on HDFC Credit Cards' },
                  { icon: '🔖', text: `Use code WELCOME20 for 20% off first order` },
                  { icon: '🚚', text: 'Free Delivery on orders above ₹499' },
                ].map((offer, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 font-medium">
                    <span>{offer.icon}</span>
                    <span>{offer.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {stock > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 text-sm font-bold">{t('inStock')}</span>
                  {stock <= 5 && (
                    <span className="text-red-500 text-xs font-bold">Only {stock} left!</span>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 text-sm font-bold">{t('currentlyUnavailable')}</span>
                </>
              )}
            </div>

            {/* Delivery estimate */}
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-500 font-medium">
                <span>Delivery by </span>
                <span className="text-gray-800 font-bold">Tomorrow if ordered in next 5 hrs</span>
                <span className="text-emerald-600 font-bold"> FREE</span>
              </div>
            </div>

            {/* Deliver to widget */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 shadow-xs">
              <MapPin className="w-4 h-4 text-indigo-605 flex-shrink-0" />
              <div className="text-xs font-semibold text-gray-700">
                <span>Deliver to </span>
                <span className="text-gray-950 font-bold">{user ? user.name : 'Guest'}</span>
                <span> - </span>
                <span className="text-indigo-650 font-bold">{userLocation}</span>
              </div>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Amazon Buy Box ───────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 rounded-2xl p-4 space-y-4 bg-white border border-gray-100 shadow-sm">
              {/* Price */}
              <div>
                <p className="text-2xl font-black text-gray-900">{formatPrice(product.price)}</p>
                <p className="text-xs text-emerald-600 font-bold mt-0.5">FREE Delivery</p>
                <p className="text-xs text-gray-400 font-bold mt-1">Delivery by Tomorrow</p>
              </div>

              {/* Buy Box Deliver to widget */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-150 text-[11px] font-semibold text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-indigo-605 flex-shrink-0" />
                <div className="truncate">
                  <span>Deliver to: </span>
                  <span className="text-gray-900 font-bold">{user ? user.name : 'Guest'}</span>
                  <br />
                  <span className="text-indigo-600 font-bold truncate block">{userLocation}</span>
                </div>
              </div>

              {/* In stock */}
              {stock > 0 && (
                <p className="text-emerald-600 text-sm font-bold">{t('inStock')}</p>
              )}

              {/* Quantity */}
              {stock > 0 && (
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1.5">Qty:</label>
                  <div className="flex items-center gap-2 rounded-lg overflow-hidden w-fit border border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors text-gray-600"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-2 font-bold text-gray-800 text-sm min-w-[2.5rem] text-center bg-white border-x border-gray-200">{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(stock, q + 1))}
                      disabled={qty >= stock}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-40"
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
                disabled={stock === 0 || addingCart}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100"
              >
                <ShoppingCart className="w-4 h-4" />
                {addingCart ? 'Adding…' : t('addToCart')}
              </motion.button>

              {/* Buy Now */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBuyNow}
                disabled={stock === 0}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-purple-100"
              >
                <Package className="w-4 h-4" />
                {t('buyNow')}
              </motion.button>

              {/* Wishlist */}
              <button
                onClick={() => { if (!user) navigate('/login'); else toggleWishlist(product.id); }}
                className={`w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
                  wishlisted
                    ? 'text-red-500 border-red-200 bg-red-50'
                    : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </button>

              {/* Trust badges */}
              <div className="space-y-2 pt-2 border-t border-gray-150">
                {[
                  { icon: Shield,    text: 'Secure transaction' },
                  { icon: Package,   text: 'Ships from NexCart' },
                  { icon: RotateCcw, text: '30-day easy returns' },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                    <b.icon className="w-3.5 h-3.5 text-gray-400" />
                    {b.text}
                  </div>
                ))}
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 text-xs text-indigo-600 hover:text-indigo-850 font-bold transition-colors"
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
          <div className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
            <h2 className="font-display text-lg font-black text-gray-950 mb-4">About this item</h2>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">{product.description}</p>

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Specs table */}
            <div className="mt-6">
              <h3 className="font-black text-gray-800 text-sm mb-3">Product Details</h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Category', product.category],
                    ['Brand',    product.brand || 'Generic'],
                    ['In Stock', `${product.stock} units`],
                    ['Rating',   `${Number(product.rating).toFixed(1)} / 5.0`],
                  ].map(([key, val]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2.5 pr-4 text-gray-400 font-bold w-36">{key}</td>
                      <td className="py-2.5 text-gray-700 font-medium">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews */}
          <div id="reviews" className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-display text-lg font-black text-gray-950">
                Customer Reviews
                <span className="text-gray-400 text-base font-normal ml-2">({reviews.length})</span>
              </h2>

              {/* Overall rating summary */}
              <div className="flex items-center gap-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < fullStars ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-[#E5E7EB] text-[#E5E7EB]'}`} />
                  ))}
                </div>
                <span className="text-xl font-black text-gray-900">{Number(product.rating).toFixed(1)}</span>
                <span className="text-sm text-gray-400 font-bold">out of 5</span>
              </div>
            </div>

            {/* Review Form Toggle */}
            {user && (
              <div className="mb-6">
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-xs"
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
                      <div className="mt-4 space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                          <label className="text-sm text-gray-500 font-bold mb-1.5 block">Overall rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button key={star} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: star }))}>
                                <Star className={`w-6 h-6 transition-colors ${star <= reviewForm.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-[#E5E7EB] text-[#E5E7EB]'}`} />
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
                          <button type="submit" disabled={submitting} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
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
                <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map(r => (
                  <div key={r.id} className="pb-6 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm flex-shrink-0 border border-indigo-100">
                        {r.user_avatar
                          ? <img src={r.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          : r.user_name?.[0]?.toUpperCase()
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">{r.user_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-[#E5E7EB] text-[#E5E7EB]'}`} />
                            ))}
                          </div>
                          {r.title && <span className="text-sm font-bold text-gray-800">{r.title}</span>}
                        </div>
                        <p className="text-xs text-gray-400 font-bold mt-1">Reviewed on {formatDate(r.created_at)}</p>
                        {r.body && <p className="text-sm text-gray-650 mt-2 leading-relaxed font-medium">{r.body}</p>}
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
          <div className="mt-8 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h2 className="font-display text-lg font-black text-gray-900">Related Products</h2>
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
    <div className="min-h-screen bg-[#FAFBFD] py-6">
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
