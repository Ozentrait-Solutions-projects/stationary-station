import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice, discountPercent } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { normalizeStock } from '../../utils/stock';

export default function ProductCard({ product, index = 0, compact = false }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate  = useNavigate();

  const stock = normalizeStock(product.stock, 1);
  const wishlisted = isWishlisted(product.id);
  const discount   = discountPercent(product.original_price, product.price);
  const rating     = Number(product.rating) || 0;
  const fullStars  = Math.floor(rating);
  const hasHalf    = rating - fullStars >= 0.5;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    addToCart(product.id);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    toggleWishlist(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group relative product-card bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-300"
    >
      <Link to={`/products/${product.id}`} className="block">

        {/* ── Image ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-white aspect-square flex items-center justify-center">
          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-pink-100 text-pink-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              -{discount}%
            </div>
          )}

          {/* Featured badge */}
          {product.is_featured && (
            <div className="absolute top-2 right-8 z-10">
              <span className="bg-indigo-100 text-indigo-650 text-[10px] font-bold px-2 py-0.5 rounded-full">
                #1 Deal
              </span>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200
              ${wishlisted
                ? 'bg-red-500 opacity-100 text-white'
                : 'bg-white text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100'
              }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Product Image */}
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain p-2.5 transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'; }}
          />

          {/* Out of stock */}
          {stock === 0 && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                {t('outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* ── Product Info ─────────────────────────────────────────── */}
        <div className={`p-3.5 ${compact ? '' : 'p-4'}`}>
          {/* Brand */}
          {product.brand && (
            <p className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider mb-0.5">
              {product.brand}
            </p>
          )}

          {/* Title */}
          <h3 className={`font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors duration-150 ${compact ? 'text-xs' : 'text-sm'}`}>
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < fullStars;
                const half   = !filled && i === fullStars && hasHalf;
                return (
                  <Star
                    key={i}
                    className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${filled || half ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-200 fill-gray-200'}`}
                  />
                );
              })}
            </div>
            <span className={`text-indigo-600 hover:text-indigo-850 font-bold transition-colors ${compact ? 'text-[10px]' : 'text-xs'}`}>
              ({product.review_count?.toLocaleString() || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
            <span className={`font-black text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className={`text-gray-400 line-through ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {/* Delivery badge */}
          {!compact && stock > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Truck className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-emerald-600 font-bold">{t('freeDelivery')}</span>
            </div>
          )}

          {/* Add to Cart button */}
          {!compact && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={stock === 0}
              className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                stock === 0
                  ? 'bg-gray-100 text-gray-400 border border-gray-200'
                  : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-xs'
              }`}
            >
              <ShoppingCart className="w-3 h-3" />
              {stock === 0 ? t('outOfStock') : t('addToCart')}
            </motion.button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
