import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShoppingCart, Shield, ChevronRight } from 'lucide-react';
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
    <div style={{ backgroundColor: '#0F1111' }} className="min-h-screen flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <div className="w-9 h-9 rounded bg-[#FF9900] flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-dark-900" />
        </div>
        <span className="font-display font-bold text-2xl text-white">
          Nex<span className="text-[#FF9900]">Cart</span>
        </span>
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-lg p-6" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.12)' }}>
          <h1 className="font-display text-xl font-bold text-[#E7E9EA] mb-5">Sign in</h1>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg text-sm text-[#E7E9EA]"
              style={{ backgroundColor: 'rgba(178,23,2,0.15)', border: '1px solid rgba(178,23,2,0.4)' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#E7E9EA] mb-1.5">
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
                <label className="text-sm font-medium text-[#E7E9EA]">Password</label>
                <Link to="#" className="text-xs text-[#007185] hover:text-[#FF9900] hover:underline transition-colors">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#A0AEC0]"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(to bottom, #f0c14b, #e47911)', border: '1px solid #e47911', color: '#131921' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
            </motion.button>
          </form>

          <p className="text-[10px] text-[#6B7280] mt-4 leading-relaxed">
            By continuing, you agree to NexCart's{' '}
            <Link to="#" className="text-[#007185] hover:underline">Conditions of Use</Link>
            {' '}and{' '}
            <Link to="#" className="text-[#007185] hover:underline">Privacy Notice</Link>.
          </p>
        </div>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <span className="text-xs text-[#6B7280]">New to NexCart?</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Create account */}
        <Link
          to="/signup"
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-[#E7E9EA] transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <span>Create your NexCart account</span>
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </Link>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[#6B7280]">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>Secure SSL Encrypted Connection</span>
        </div>
      </motion.div>
    </div>
  );
}
