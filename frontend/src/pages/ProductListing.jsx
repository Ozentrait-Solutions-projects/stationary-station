import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import { productService } from '../services/productService';

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'popularity',      label: 'Most Popular' },
  { value: 'price_asc',       label: 'Price: Low to High' },
  { value: 'price_desc',      label: 'Price: High to Low' },
  { value: 'rating_desc',     label: 'Highest Rated' },
];

const CATEGORIES = ['Electronics','Fashion','Home & Kitchen','Books','Sports','Beauty','Gaming','Furniture'];
const RATINGS    = [4, 3, 2];
const PRICE_RANGES = [
  { label: 'Under ₹1,000',   min: 0,      max: 1000 },
  { label: '₹1,000 – ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 – ₹20,000',min: 5000, max: 20000 },
  { label: 'Above ₹20,000',  min: 20000,  max: 999999 },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState(null);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const loaderRef = useRef(null);

  // Derive filters from URL params
  const category  = searchParams.get('category') || '';
  const search    = searchParams.get('search')   || '';
  const sort      = searchParams.get('sort')     || 'created_at_desc';
  const minPrice  = searchParams.get('minPrice') || '';
  const maxPrice  = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating')|| '';
  const featured  = searchParams.get('featured') || '';

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 12, sort };
      if (category)  params.category  = category;
      if (search)    params.search    = search;
      if (minPrice)  params.minPrice  = minPrice;
      if (maxPrice)  params.maxPrice  = maxPrice;
      if (minRating) params.minRating = minRating;
      if (featured)  params.featured  = featured;

      const res = await productService.getProducts(params);
      const { products: newProducts, pagination: pag } = res.data;

      setProducts(prev => append ? [...prev, ...newProducts] : newProducts);
      setPagination(pag);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, minPrice, maxPrice, minRating, featured]);

  // Reset & fetch when filters change
  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || !pagination || page >= pagination.pages) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage, true);
      }
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef, pagination, page, loading, fetchProducts]);

  const setFilter = (key, value) => {
    const params = Object.fromEntries(searchParams.entries());
    if (value) params[key] = value;
    else delete params[key];
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = category || minPrice || maxPrice || minRating || featured;

  return (
    <div className="nexcart-container py-8">
      <div className="flex gap-8">

        {/* ── Sidebar Filters — Desktop ────────────────────── */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-6 sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-dark-900 dark:text-white">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  Clear all
                </button>
              )}
            </div>

            {/* Category */}
            <FilterSection title="Category">
              {CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio" name="category" value={cat}
                    checked={category === cat}
                    onChange={() => setFilter('category', category === cat ? '' : cat)}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-dark-600 dark:text-dark-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {cat}
                  </span>
                </label>
              ))}
            </FilterSection>

            {/* Price Range */}
            <FilterSection title="Price Range">
              {PRICE_RANGES.map(range => (
                <label key={range.label} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio" name="price"
                    checked={minPrice === String(range.min) && maxPrice === String(range.max)}
                    onChange={() => {
                      if (minPrice === String(range.min) && maxPrice === String(range.max)) {
                        setFilter('minPrice', ''); setFilter('maxPrice', '');
                      } else {
                        const p = Object.fromEntries(searchParams.entries());
                        p.minPrice = range.min; p.maxPrice = range.max;
                        setSearchParams(p);
                      }
                    }}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-dark-600 dark:text-dark-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {range.label}
                  </span>
                </label>
              ))}
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Minimum Rating">
              {RATINGS.map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio" name="rating"
                    checked={minRating === String(r)}
                    onChange={() => setFilter('minRating', minRating === String(r) ? '' : r)}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-dark-600 dark:text-dark-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex items-center gap-1 transition-colors">
                    {'★'.repeat(r)}{'☆'.repeat(5-r)} & above
                  </span>
                </label>
              ))}
            </FilterSection>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-dark-900 dark:text-white">
                {category || search ? (category || `"${search}"`) : 'All Products'}
              </h1>
              {pagination && (
                <p className="text-sm text-dark-400 mt-1">{pagination.total.toLocaleString()} products found</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden btn-ghost border border-dark-200 dark:border-dark-600 gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {hasFilters && <span className="badge badge-primary text-[10px]">On</span>}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setFilter('sort', e.target.value)}
                  className="input text-sm pr-8 appearance-none bg-white dark:bg-dark-800 cursor-pointer min-w-[160px]"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filters Pills */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {category  && <FilterPill label={`Category: ${category}`} onRemove={() => setFilter('category', '')} />}
              {(minPrice || maxPrice) && <FilterPill label={`Price: ₹${minPrice}–₹${maxPrice}`} onRemove={() => { setFilter('minPrice',''); setFilter('maxPrice',''); }} />}
              {minRating && <FilterPill label={`Rating: ${minRating}★+`} onRemove={() => setFilter('minRating', '')} />}
              {featured  && <FilterPill label="Featured only" onRemove={() => setFilter('featured', '')} />}
            </div>
          )}

          {/* Products Grid */}
          {!loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search className="w-16 h-16 text-dark-300 dark:text-dark-600 mb-4" />
              <h3 className="font-display text-xl font-semibold text-dark-700 dark:text-dark-300">No products found</h3>
              <p className="text-dark-400 mt-2">Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="btn-primary mt-6">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              {loading && Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`sk-${i}`} />)}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={loaderRef} className="h-10 mt-4" />
          {pagination && page >= pagination.pages && products.length > 0 && (
            <p className="text-center text-dark-400 text-sm py-4">All products loaded</p>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Drawer ─────────────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-dark-900 z-50 overflow-y-auto p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-dark-900 dark:text-white">Filters</h3>
                <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterSection title="Category">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="m-category" value={cat} checked={category === cat}
                      onChange={() => { setFilter('category', cat); setFiltersOpen(false); }} className="accent-primary-600" />
                    <span className="text-sm text-dark-600 dark:text-dark-300">{cat}</span>
                  </label>
                ))}
              </FilterSection>
              <FilterSection title="Price Range">
                {PRICE_RANGES.map(range => (
                  <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="m-price"
                      checked={minPrice === String(range.min) && maxPrice === String(range.max)}
                      onChange={() => { const p = Object.fromEntries(searchParams.entries()); p.minPrice=range.min; p.maxPrice=range.max; setSearchParams(p); setFiltersOpen(false); }}
                      className="accent-primary-600" />
                    <span className="text-sm text-dark-600 dark:text-dark-300">{range.label}</span>
                  </label>
                ))}
              </FilterSection>
              {hasFilters && (
                <button onClick={() => { clearFilters(); setFiltersOpen(false); }} className="w-full btn-outline text-sm">
                  Clear All Filters
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3">
        <span className="font-semibold text-sm text-dark-700 dark:text-dark-200">{title}</span>
        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden space-y-2.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
    </span>
  );
}
