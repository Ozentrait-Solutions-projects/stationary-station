import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, Trash2 } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { formatPrice } from '../../utils/formatters';

export default function CompareBar() {
  const { comparedProducts, removeFromCompare, clearCompare } = useCompare();

  if (comparedProducts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-white/90 backdrop-blur-md border border-indigo-100 shadow-2xl rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-55 bg-indigo-50 rounded-xl text-indigo-600">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-gray-800">Compare Products</h4>
            <p className="text-xs text-gray-500 font-semibold">
              {comparedProducts.length === 1
                ? 'Select 1 more product to compare'
                : 'Ready to compare side-by-side'}
            </p>
          </div>
        </div>

        {/* Selected Products Preview */}
        <div className="flex items-center gap-3 my-2 md:my-0">
          {comparedProducts.map((product) => (
            <div
              key={product.id}
              className="relative flex items-center gap-2 p-1.5 pr-3 bg-gray-50 border border-gray-100 rounded-xl"
            >
              <img
                src={product.image_url}
                alt={product.title}
                className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 border border-gray-100"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100';
                }}
              />
              <div className="max-w-[100px] md:max-w-[120px]">
                <p className="text-xs font-bold text-gray-850 truncate">{product.title}</p>
                <p className="text-[10px] font-black text-indigo-600">{formatPrice(product.price)}</p>
              </div>
              <button
                onClick={() => removeFromCompare(product.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center shadow-xs transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {comparedProducts.length < 2 && (
            <Link
              to="/products"
              className="flex items-center justify-center w-[120px] md:w-[150px] h-11 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl bg-gray-50/50 text-[10px] text-gray-400 font-bold transition-all text-center"
            >
              + Add another product
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={clearCompare}
            className="p-2.5 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-xl"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <Link
            to={comparedProducts.length === 2 ? '/compare' : '#'}
            onClick={(e) => {
              if (comparedProducts.length < 2) {
                e.preventDefault();
              }
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md text-center flex items-center justify-center gap-1.5 ${
              comparedProducts.length === 2
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
            }`}
          >
            Compare Now
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
