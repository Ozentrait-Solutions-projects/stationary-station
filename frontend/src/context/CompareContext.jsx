import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const CompareContext = createContext(null);

export const CompareProvider = ({ children }) => {
  const [comparedProducts, setComparedProducts] = useState([]);

  // Load initial compare items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexcart_compare');
      if (stored) {
        setComparedProducts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load comparison data', e);
    }
  }, []);

  // Update localStorage when comparedProducts changes
  const saveCompare = (items) => {
    setComparedProducts(items);
    try {
      localStorage.setItem('nexcart_compare', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save comparison data', e);
    }
  };

  const addToCompare = useCallback((product) => {
    if (!product || !product.id) return;
    
    setComparedProducts((prev) => {
      // Check if already in compare
      if (prev.some((p) => p.id === product.id)) {
        toast.error('Product already added to comparison');
        return prev;
      }
      
      if (prev.length >= 2) {
        toast.error('You can only compare up to 2 products');
        return prev;
      }

      const next = [...prev, product];
      toast.success(`${product.title.slice(0, 20)}... added to compare`);
      try {
        localStorage.setItem('nexcart_compare', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save comparison data', e);
      }
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setComparedProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      toast.success('Product removed from comparison');
      try {
        localStorage.setItem('nexcart_compare', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save comparison data', e);
      }
      return next;
    });
  }, []);

  const isInCompare = useCallback((productId) => {
    return comparedProducts.some((p) => p.id === productId);
  }, [comparedProducts]);

  const clearCompare = useCallback(() => {
    saveCompare([]);
    toast.success('Comparison cleared');
  }, []);

  return (
    <CompareContext.Provider
      value={{
        comparedProducts,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
