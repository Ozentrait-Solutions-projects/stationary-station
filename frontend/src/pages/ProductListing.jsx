import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Search, Star } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import { productService } from '../services/productService';

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'popularity',      label: 'Best Sellers' },
  { value: 'price_asc',       label: 'Price: Low to High' },
  { value: 'price_desc',      label: 'Price: High to Low' },
  { value: 'rating_desc',     label: 'Avg. Customer Review' },
];

const CATEGORIES = ['Electronics','Fashion','Home & Kitchen','Books','Sports','Beauty','Gaming','Furniture'];
const RATINGS    = [4, 3, 2, 1];
const PRICE_RANGES = [
  { label: 'Under ₹1,000',     min: 0,     max: 1000   },
  { label: '₹1,000 – ₹5,000',  min: 1000,  max: 5000   },
  { label: '₹5,000 – ₹20,000', min: 5000,  max: 20000  },
  { label: '₹20,000 – ₹50,000',min: 20000, max: 50000  },
  { label: 'Above ₹50,000',    min: 50000, max: 999999 },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState(null);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const loaderRef = useRef(null);

  const category  = searchParams.get('category')  || '';
  const search    = searchParams.get('search')    || '';
  const sort      = searchParams.get('sort')      || 'created_at_desc';
  const minPrice  = searchParams.get('minPrice')  || '';
  const maxPrice  = searchParams.get('maxPrice')  || '';
  const minRating = searchParams.get('minRating') || '';
  const featured  = searchParams.get('featured')  || '';

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 16, sort };
      if (category)  params.category  = category;
      if (search)    params.search    = search;
      if (minPrice)  params.minPrice  = minPrice;
      if (maxPrice)  params.maxPrice  = maxPrice;
      if (minRating) params.minRating = minRating;
      if (featured)  params.featured  = featured;
      const res = await productService.getProducts(params);
      const { products: newP, pagination: pag } = res.data;
      setProducts(prev => append ? [...prev, ...newP] : newP);
      setPagination(pag);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [category, search, sort, minPrice, maxPrice, minRating, featured]);

  useEffect(() => { setPage(1); setProducts([]); fetchProducts(1, false); }, [fetchProducts]);

  useEffect(() => {
    if (!loaderRef.current || !pagination || page >= pagination.pages) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) {
        const next = page + 1; setPage(next); fetchProducts(next, true);
      }
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef, pagination, page, loading, fetchProducts]);

  const setFilter = (key, value) => {
    const params = Object.fromEntries(searchParams.entries());
    if (value) params[key] = value; else delete params[key];
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});
  const hasFilters   = category || minPrice || maxPrice || minRating || featured;

  const pageTitle = featured ? "Today's Deals" : category || (search ? `Results for "${search}"` : 'All Products');

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      <div className="nexcart-container py-4">

        {/* Breadcrumb */}
        <nav className="amazon-breadcrumb mb-3">
          <a href="/">NexCart</a>
          <span>/</span>
          {category ? (
            <><span className="text-gray-800 font-bold">{category}</span></>
          ) : search ? (
            <><span className="text-gray-800 font-bold">Search: "{search}"</span></>
          ) : (
            <><span className="text-gray-800 font-bold">All Products</span></>
          )}
        </nav>

        <div className="flex gap-4">

          {/* ── Sidebar Filters — Desktop ─────────────────────────── */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-28 bg-white border border-gray-200 shadow-xs rounded-2xl p-4 space-y-4">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-650 font-bold hover:text-indigo-850 hover:underline transition-colors flex items-center gap-1"
                >
                  ← Clear all filters
                </button>
              )}

              {/* Department */}
              <FilterSection title="Department">
                <ul className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <li key={cat}>
                      <button
                        onClick={() => setFilter('category', category === cat ? '' : cat)}
                        className={`w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                          category === cat
                            ? 'text-indigo-600 font-bold'
                            : 'text-gray-650 hover:text-indigo-600 hover:font-bold'
                        }`}
                      >
                        {category === cat && '▸ '}{cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <div className="border-t border-gray-200" />

              {/* Price */}
              <FilterSection title="Price">
                <ul className="space-y-1">
                  {PRICE_RANGES.map(range => {
                    const active = minPrice === String(range.min) && maxPrice === String(range.max);
                    return (
                      <li key={range.label}>
                        <button
                          onClick={() => {
                            if (active) { setFilter('minPrice', ''); setFilter('maxPrice', ''); }
                            else {
                              const p = Object.fromEntries(searchParams.entries());
                              p.minPrice = range.min; p.maxPrice = range.max;
                              setSearchParams(p);
                            }
                          }}
                          className={`w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                            active ? 'text-indigo-600 font-bold' : 'text-gray-650 hover:text-indigo-600'
                          }`}
                        >
                          {active && '▸ '}{range.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </FilterSection>

              <div className="border-t border-gray-200" />

              {/* Rating */}
              <FilterSection title="Avg. Customer Review">
                <ul className="space-y-1">
                  {RATINGS.map(r => (
                    <li key={r}>
                      <button
                        onClick={() => setFilter('minRating', minRating === String(r) ? '' : r)}
                        className={`w-full text-left flex items-center gap-2 py-1 px-2 rounded transition-colors ${
                          minRating === String(r) ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                        }`}
                      >
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < r ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-[#E5E7EB] text-[#E5E7EB]'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold">& Up</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </FilterSection>
            </div>
          </aside>

          {/* ── Main Content ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div
              className="flex items-center justify-between gap-4 mb-4 px-4 py-3 rounded-2xl flex-wrap bg-white border border-gray-200 shadow-sm"
            >
              <div>
                <h1 className="font-display text-lg font-black text-gray-900">{pageTitle}</h1>
                {pagination && (
                  <p className="text-xs text-gray-400 font-bold mt-0.5">
                    {pagination.total.toLocaleString()} results
                    {(minPrice || maxPrice) && ` · ₹${minPrice}–₹${maxPrice}`}
                    {minRating && ` · ${minRating}★ & up`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter button */}
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasFilters && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">On</span>
                  )}
                </button>

                {/* Sort */}
                <div className="flex items-center gap-2 text-sm text-gray-400 font-bold">
                  <span className="hidden sm:block">Sort by:</span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={e => setFilter('sort', e.target.value)}
                      className="appearance-none text-sm font-bold text-gray-700 pr-8 pl-4 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white border border-gray-200"
                    >
                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filter Pills */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {category && <FilterPill label={`Department: ${category}`} onRemove={() => setFilter('category', '')} />}
                {(minPrice || maxPrice) && <FilterPill label={`Price: ₹${minPrice}–₹${maxPrice}`} onRemove={() => { setFilter('minPrice',''); setFilter('maxPrice',''); }} />}
                {minRating && <FilterPill label={`${minRating}★ & Up`} onRemove={() => setFilter('minRating', '')} />}
                {featured  && <FilterPill label="Featured Only" onRemove={() => setFilter('featured', '')} />}
              </div>
            )}

            {/* Empty state */}
            {!loading && products.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-24 text-center rounded-3xl bg-white border border-gray-200 shadow-sm"
              >
                <Search className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-black text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-400 text-sm mb-6 font-medium">
                  {search
                    ? `No products match "${search}". Try different keywords.`
                    : 'No products match your current filters.'
                  }
                </p>
                <button onClick={clearFilters} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              {loading && Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={`sk-${i}`} />)}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={loaderRef} className="h-10 mt-4" />
            {pagination && page >= pagination.pages && products.length > 0 && (
              <p className="text-center text-gray-400 font-bold text-sm py-6">
                — End of results —
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 overflow-y-auto bg-white border-r border-gray-100 shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <h3 className="font-black text-gray-900">Filters</h3>
                <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl hover:bg-gray-50 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <FilterSection title="Department">
                  <ul className="space-y-1">
                    {CATEGORIES.map(cat => (
                      <li key={cat}>
                        <button
                          onClick={() => { setFilter('category', cat); setFiltersOpen(false); }}
                          className={`w-full text-left text-sm py-2 px-2 rounded transition-colors ${category === cat ? 'text-indigo-650 font-bold bg-indigo-50' : 'text-gray-650 hover:text-indigo-600'}`}
                        >
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                </FilterSection>

                <div className="border-t border-gray-100" />

                <FilterSection title="Price Range">
                  <ul className="space-y-1">
                    {PRICE_RANGES.map(range => {
                      const active = minPrice === String(range.min) && maxPrice === String(range.max);
                      return (
                        <li key={range.label}>
                          <button
                            onClick={() => { const p = Object.fromEntries(searchParams.entries()); p.minPrice=range.min; p.maxPrice=range.max; setSearchParams(p); setFiltersOpen(false); }}
                            className={`w-full text-left text-sm py-2 px-2 rounded transition-colors ${active ? 'text-indigo-650 font-bold bg-indigo-50' : 'text-gray-650 hover:text-indigo-600'}`}
                          >
                            {range.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </FilterSection>

                {hasFilters && (
                  <button
                    onClick={() => { clearFilters(); setFiltersOpen(false); }}
                    className="w-full border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
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
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-2 group">
        <span className="text-xs font-black text-gray-800 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100">
      {label}
      <button onClick={onRemove} className="text-indigo-400 hover:text-red-500 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
