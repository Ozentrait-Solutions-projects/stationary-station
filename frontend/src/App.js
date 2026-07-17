import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartSidebar from './components/cart/CartSidebar';

// Lazy-load pages for code splitting
const Home           = lazy(() => import('./pages/Home'));
const ProductListing = lazy(() => import('./pages/ProductListing'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail'));
const Cart           = lazy(() => import('./pages/Cart'));
const Checkout       = lazy(() => import('./pages/Checkout'));
const OrderSuccess   = lazy(() => import('./pages/OrderSuccess'));
const Login          = lazy(() => import('./pages/Login'));
const Signup         = lazy(() => import('./pages/Signup'));
const Profile        = lazy(() => import('./pages/Profile'));
const Wishlist       = lazy(() => import('./pages/Wishlist'));
const Orders         = lazy(() => import('./pages/Orders'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Page loader — NexCart light theme
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#F9FAFB]">
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-[#6366F1] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-[#6B7280] text-sm">Loading…</p>
    </div>
  </div>
);

// Protected route
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

// Admin route
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                    element={<Home />} />
            <Route path="/products"            element={<ProductListing />} />
            <Route path="/products/:id"        element={<ProductDetail />} />
            <Route path="/login"               element={<Login />} />
            <Route path="/signup"              element={<Signup />} />

            <Route path="/cart"            element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/wishlist"        element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/checkout"        element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route path="/orders"          element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id"      element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

function NotFound() {
  return (
    <div className="nexcart-container py-24 text-center">
      <p className="font-display text-8xl font-extrabold gradient-text mb-4">404</p>
      <h2 className="font-display text-2xl font-bold text-[#E7E9EA] mb-2">Page not found</h2>
      <p className="text-[#6B7280] mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="btn-amazon-orange text-sm px-8 py-3 rounded-lg inline-flex items-center gap-2">
        ← Go to Homepage
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppLayout />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    background: '#232F3E',
                    color: '#E7E9EA',
                    border: '1px solid rgba(255,255,255,0.1)',
                  },
                  success: {
                    style: {
                      background: '#1a2e1a',
                      color: '#86efac',
                      border: '1px solid rgba(134,239,172,0.2)',
                    },
                    iconTheme: { primary: '#4ade80', secondary: '#1a2e1a' },
                  },
                  error: {
                    style: {
                      background: '#2d1a1a',
                      color: '#fca5a5',
                      border: '1px solid rgba(252,165,165,0.2)',
                    },
                    iconTheme: { primary: '#f87171', secondary: '#2d1a1a' },
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
