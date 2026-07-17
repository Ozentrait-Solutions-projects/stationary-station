import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { user } = useAuth();

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFD]">
      <div className="text-center px-4 py-16">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-white border border-gray-100 shadow-sm">
          <Heart className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="font-display text-2xl font-black text-gray-900 mb-2">Sign in to view your wishlist</h2>
        <p className="text-gray-400 mb-8 font-semibold">Save products you love to buy later.</p>
        <Link to="/login" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-8 py-3.5 rounded-full inline-flex items-center gap-2 font-bold shadow-md shadow-indigo-100">
          Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFD] page-enter">
      <div className="nexcart-container py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-gray-900 flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Your Wishlist
              <span className="text-gray-400 text-base font-normal">({wishlist.length})</span>
            </h1>
            <p className="text-sm text-gray-400 mt-0.5 font-bold">Saved items for later purchase</p>
          </div>
          <Link to="/products" className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs text-sm flex items-center gap-2">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-2xl py-20 text-center bg-white border border-gray-100 shadow-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            </motion.div>
            <h3 className="font-display text-xl font-black text-gray-950 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-400 mb-8 font-semibold">Tap the ♥ on any product to save it here.</p>
            <Link to="/products" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-8 py-3.5 rounded-full inline-flex items-center gap-2 font-bold shadow-md shadow-indigo-100">
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {wishlist.map((item, i) => (
              <ProductCard
                key={item.product_id}
                product={{
                  id: item.product_id, title: item.title, price: item.price,
                  original_price: item.original_price, image_url: item.image_url,
                  rating: item.rating, review_count: item.review_count,
                  category: item.category, brand: item.brand, stock: item.stock,
                }}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
