import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice, discountPercent } from '../../utils/formatters';

export default function ProductCard({ product, index = 0, compact = false }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const navigate  = useNavigate();

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
      className="group relative product-card"
    >
      <Link to={`/products/${product.id}`} className="block">

        {/* ── Image ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-[#1B2533] aspect-square">
          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-[#B12704] text-white text-xs font-bold px-2 py-0.5 rounded">
              -{discount}%
            </div>
          )}

          {/* Featured badge */}
          {product.is_featured && (
            <div className="absolute top-2 right-8 z-10">
              <span className="bg-[#FF9900] text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded">
                #1 Deal
              </span>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200
              ${wishlisted
                ? 'bg-red-500 opacity-100'
                : 'bg-black/40 opacity-0 group-hover:opacity-100'
              }`}
          >
            <Heart className={`w-3.5 h-3.5 text-white ${wishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Product Image */}
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'; }}
          />

          {/* Out of stock */}
          {Number(product.stock) === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-sm font-semibold px-3 py-1.5 rounded bg-black/50">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Product Info ─────────────────────────────────────────── */}
        <div className={`p-3 ${compact ? '' : 'p-4'}`}>
          {/* Brand */}
          {product.brand && (
            <p className="text-[10px] text-[#007185] font-medium uppercase tracking-wider mb-0.5">
              {product.brand}
            </p>
          )}

          {/* Title */}
          <h3 className={`font-medium text-[#E7E9EA] leading-snug line-clamp-2 group-hover:text-[#FF9900] transition-colors duration-150 ${compact ? 'text-xs' : 'text-sm'}`}>
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
                    className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${filled || half ? 'fill-[#FF9900] text-[#FF9900]' : 'text-[#374151] fill-[#374151]'}`}
                  />
                );
              })}
            </div>
            <span className={`text-[#007185] hover:text-[#FF9900] transition-colors ${compact ? 'text-[10px]' : 'text-xs'}`}>
              ({product.review_count?.toLocaleString() || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
            <span className={`font-bold text-[#E7E9EA] ${compact ? 'text-base' : 'text-lg'}`}>
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className={`text-[#6B7280] line-through ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {/* Delivery badge */}
          {!compact && Number(product.stock) > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Truck className="w-3 h-3 text-[#27ae60]" />
              <span className="text-[10px] text-[#27ae60] font-medium">Free delivery</span>
            </div>
          )}

          {/* Add to Cart button */}
          {!compact && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={Number(product.stock) === 0}
              className="w-full mt-3 py-1.5 rounded text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: Number(product.stock) === 0
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(to bottom, #f0c14b, #e47911)',
                border: '1px solid rgba(255,153,0,0.5)',
                color: Number(product.stock) === 0 ? '#6B7280' : '#131921',
              }}
            >
              <ShoppingCart className="w-3 h-3" />
              {Number(product.stock) === 0 ? 'Out of Stock' : 'Add to Cart'}
            </motion.button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
