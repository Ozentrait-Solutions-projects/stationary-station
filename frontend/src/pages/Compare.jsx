import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Trash2, ShoppingCart, Heart, Star, X, Search } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, discountPercent } from '../utils/formatters';
import { productService } from '../services/productService';
import { useDebounce } from '../hooks/useDebounce';

export default function Compare() {
  const navigate = useNavigate();
  const { comparedProducts, removeFromCompare, clearCompare, addToCompare } = useCompare();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();

  // Search/Swap states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSearchIndex, setShowSearchIndex] = useState(null); // 0 or 1 slot to swap/add
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([]);
      return;
    }
    productService.searchSuggestions(debouncedSearch)
      .then((res) => setSuggestions(res.data.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [debouncedSearch]);

  const handleSelectProduct = (product) => {
    if (showSearchIndex !== null) {
      // Remove current product at that index if present
      const current = comparedProducts[showSearchIndex];
      if (current) {
        removeFromCompare(current.id);
      }
      addToCompare(product);
      setSearchQuery('');
      setSuggestions([]);
      setShowSearchIndex(null);
    }
  };

  const handleAddToCart = (e, productId) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    addToCart(productId);
  };

  const renderStars = (rating) => {
    const num = Number(rating) || 0;
    const fullStars = Math.floor(num);
    const hasHalf = num - fullStars >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < fullStars || (i === fullStars && hasHalf)
                ? 'fill-[#F59E0B] text-[#F59E0B]'
                : 'text-gray-205 fill-gray-200 text-gray-200'
            }`}
          />
        ))}
        <span className="text-xs text-gray-500 font-bold ml-1">({num.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] pb-16 pt-8">
      <div className="nexcart-container">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-gray-950 flex items-center gap-3">
              <ArrowLeftRight className="w-7 h-7 text-indigo-600" />
              Compare Products
            </h1>
            <p className="text-sm text-gray-550 mt-1 font-semibold">Compare details, specifications, and prices to find the best match.</p>
          </div>
          {comparedProducts.length > 0 && (
            <button
              onClick={clearCompare}
              className="w-fit border border-red-200 bg-red-50/50 hover:bg-red-55 hover:bg-red-100 text-red-650 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              Clear Comparison
            </button>
          )}
        </div>

        {comparedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-150 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <ArrowLeftRight className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-1">No products to compare</h3>
            <p className="text-sm text-gray-550 font-semibold mb-6">Select products from our shop to perform a side-by-side comparison.</p>
            <Link to="/products" className="btn-amazon-orange px-6 py-2.5 rounded-xl text-sm font-bold shadow-md">
              Go to Store
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            
            {/* Compare Columns */}
            {[0, 1].map((index) => {
              const product = comparedProducts[index];

              if (!product) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="border-2 border-dashed border-gray-200 bg-gray-50/30 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[500px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                      +
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-4">Add a product to compare</p>
                    
                    {showSearchIndex === index ? (
                      <div className="w-full max-w-sm relative">
                        <div className="flex items-center h-10 bg-white rounded-xl border border-gray-200 px-3 py-1 shadow-sm">
                          <Search className="w-4 h-4 text-gray-400 mr-2" />
                          <input
                            type="text"
                            placeholder="Search product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 h-full bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
                            autoFocus
                          />
                          <button onClick={() => setShowSearchIndex(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-150 z-10 max-h-60 overflow-y-auto">
                            {suggestions.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => handleSelectProduct(s)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                              >
                                <img src={s.image_url} alt="" className="w-8 h-8 object-contain bg-white rounded p-0.5 border border-gray-100" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">{s.title}</p>
                                  <p className="text-[10px] text-indigo-650 font-black">{formatPrice(s.price)}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowSearchIndex(index);
                          setSearchQuery('');
                          setSuggestions([]);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        Search & Add
                      </button>
                    )}
                  </div>
                );
              }

              const discount = discountPercent(product.original_price, product.price);
              const isSaved = isWishlisted(product.id);

              return (
                <div key={product.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm relative group">
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute top-4 right-4 w-7 h-7 bg-gray-50 hover:bg-red-50 border border-gray-150 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition-colors shadow-xs z-10"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Header/Swap Button */}
                  <button
                    onClick={() => {
                      setShowSearchIndex(index);
                      setSearchQuery('');
                      setSuggestions([]);
                    }}
                    className="mb-4 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    🔄 Swap Product
                  </button>

                  {showSearchIndex === index && (
                    <div className="absolute top-12 left-6 right-6 bg-white rounded-xl shadow-lg border border-gray-205 border-gray-200 p-3 z-20 space-y-2">
                      <div className="flex items-center h-10 bg-gray-50 rounded-xl border border-gray-200 px-3 py-1">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                          type="text"
                          placeholder="Search replacement..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 h-full bg-transparent text-sm focus:outline-none text-gray-800"
                          autoFocus
                        />
                        <button onClick={() => setShowSearchIndex(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {suggestions.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {suggestions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleSelectProduct(s)}
                              className="w-full flex items-center gap-2.5 p-2 hover:bg-gray-50 rounded-lg text-left"
                            >
                              <img src={s.image_url} alt="" className="w-7 h-7 object-contain bg-white border border-gray-100 rounded" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-850 truncate">{s.title}</p>
                                <p className="text-[10px] text-indigo-600 font-black">{formatPrice(s.price)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product Visual */}
                  <div className="relative aspect-square max-h-56 bg-white rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center p-4 mx-auto mb-6">
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    )}
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300'; }}
                    />
                  </div>

                  {/* Information Matrix */}
                  <div className="space-y-4">
                    <div>
                      {product.brand && (
                        <p className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider mb-1">
                          {product.brand}
                        </p>
                      )}
                      <Link
                        to={`/products/${product.id}`}
                        className="font-display font-extrabold text-gray-900 hover:text-indigo-600 text-base leading-snug line-clamp-2 transition-colors"
                      >
                        {product.title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 py-1">
                      {renderStars(product.rating)}
                      <span className="text-xs text-gray-400 font-bold">({product.review_count || 0} reviews)</span>
                    </div>

                    {/* Pricing comparison */}
                    <div className="border-y border-gray-100 py-3.5 flex items-baseline gap-2.5">
                      <span className="text-2xl font-black text-gray-950">{formatPrice(product.price)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <>
                          <span className="text-sm text-gray-450 line-through">{formatPrice(product.original_price)}</span>
                          <span className="text-xs text-emerald-600 font-bold">({discount}% off)</span>
                        </>
                      )}
                    </div>

                    {/* Specs Table */}
                    <div className="space-y-3 pt-1 text-sm">
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-400 font-bold">Category</span>
                        <span className="text-gray-700 font-semibold">{product.category}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-400 font-bold">Brand</span>
                        <span className="text-gray-700 font-semibold">{product.brand || 'Generic'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-400 font-bold">Availability</span>
                        <span className={`font-bold ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                        </span>
                      </div>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold">Key Features</span>
                          <div className="flex flex-wrap gap-1">
                            {product.tags.map((tag) => (
                              <span key={tag} className="text-[10px] font-extrabold text-[#6366F1] bg-[#6366F1]/5 border border-[#6366F1]/10 px-2.5 py-1 rounded-full capitalize">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-1 pb-1">
                        <span className="text-gray-400 font-bold">Description</span>
                        <p className="text-xs text-gray-650 font-medium leading-relaxed line-clamp-4">{product.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-2.5">
                      <button
                        onClick={(e) => handleAddToCart(e, product.id)}
                        disabled={product.stock === 0}
                        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>

                      <button
                        onClick={() => {
                          if (!user) navigate('/login');
                          else toggleWishlist(product.id);
                        }}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
                          isSaved
                            ? 'text-red-500 border-red-200 bg-red-50'
                            : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        {isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}
