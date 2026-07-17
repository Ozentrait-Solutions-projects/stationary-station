import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#FAFBFD] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="nexLogoG1" x1="6" y1="6" x2="22.5" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" />
              <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="nexLogoG2" x1="22.5" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="nexLogoG3" x1="6" y1="6" x2="22.5" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EC4899" />
              <stop offset="1" stopColor="#D946EF" />
            </linearGradient>
          </defs>
          <path d="M6 6H13.5L22.5 30H15L6 6Z" fill="url(#nexLogoG1)" />
          <path d="M22.5 30H30V6H22.5V30Z" fill="url(#nexLogoG2)" />
          <path d="M6 6V18L13.5 30L22.5 30L6 6Z" fill="url(#nexLogoG3)" />
        </svg>
        <span className="font-display font-bold text-2xl text-gray-900">
          Nex<span className="text-[#6366F1]">Cart</span>
        </span>
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
          <h1 className="font-display text-xl font-black text-gray-950 mb-5">Sign in</h1>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl text-sm text-red-650 bg-red-50 border border-red-150"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Email or mobile phone number
              </label>
              <input
                type="email"
                className="input text-sm py-2.5"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-gray-700">Password</label>
                <Link to="#" className="text-xs text-indigo-650 font-bold hover:text-indigo-850 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input text-sm py-2.5 pr-10"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100 disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin text-white" /> Signing in…</> : 'Sign in'}
            </motion.button>
          </form>

          <p className="text-[10px] text-gray-400 font-bold mt-4 leading-relaxed">
            By continuing, you agree to NexCart's{' '}
            <Link to="#" className="text-indigo-605 hover:underline">Conditions of Use</Link>
            {' '}and{' '}
            <Link to="#" className="text-indigo-605 hover:underline">Privacy Notice</Link>.
          </p>
        </div>


        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-150" />
          <span className="text-xs text-gray-400 font-bold">New to NexCart?</span>
          <div className="flex-1 h-px bg-gray-150" />
        </div>

        {/* Create account */}
        <Link
          to="/signup"
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <span>Create your NexCart account</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400 font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure SSL Encrypted Connection</span>
        </div>
      </motion.div>
    </div>
  );
}
