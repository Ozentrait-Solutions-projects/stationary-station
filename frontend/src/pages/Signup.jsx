import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShoppingCart, Loader2, Check, Shield, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const strength = form.password.length >= 8 ? 'strong' : form.password.length >= 6 ? 'medium' : 'weak';

  return (
    <div style={{ backgroundColor: '#0F1111' }} className="min-h-screen flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded bg-[#FF9900] flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-dark-900" />
        </div>
        <span className="font-display font-bold text-2xl text-white">
          Nex<span className="text-[#FF9900]">Cart</span>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-lg p-6" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.12)' }}>
          <h1 className="font-display text-xl font-bold text-[#E7E9EA] mb-1">Create account</h1>
          <p className="text-sm text-[#6B7280] mb-5">Join millions of happy NexCart shoppers!</p>

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
            {[
              { key: 'name',    label: 'Your name',    type: 'text',     placeholder: 'First and last name' },
              { key: 'email',   label: 'Email',         type: 'email',    placeholder: 'you@example.com' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[#E7E9EA] mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  className="input text-sm py-2.5"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  required
                  autoFocus={field.key === 'name'}
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#E7E9EA] mb-1.5">Password</label>
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
              {form.password && (
                <div className="flex gap-1 mt-1.5">
                  {['weak', 'medium', 'strong'].map((s, i) => (
                    <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          strength === 'strong' ? '#27ae60' :
                          strength === 'medium' && i < 2 ? '#f39c12' :
                          strength === 'weak'   && i === 0 ? '#e74c3c' :
                          'rgba(255,255,255,0.1)'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#E7E9EA] mb-1.5">Re-enter password</label>
              <div className="relative">
                <input
                  type="password"
                  className="input text-sm py-2.5 pr-10"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                />
                {form.confirm && form.confirm === form.password && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                )}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(to bottom, #f0c14b, #e47911)', border: '1px solid #e47911', color: '#131921' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Continue'}
            </motion.button>
          </form>

          <p className="text-[10px] text-[#6B7280] mt-4 leading-relaxed">
            By creating an account, you agree to NexCart's{' '}
            <Link to="#" className="text-[#007185] hover:underline">Conditions of Use</Link>{' '}
            and{' '}
            <Link to="#" className="text-[#007185] hover:underline">Privacy Notice</Link>.
          </p>
        </div>

        {/* Sign in link */}
        <div className="mt-5 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs text-[#6B7280]">Already a customer?</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-[#E7E9EA] transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Sign in to your account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[#6B7280]">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>Your data is encrypted and secured</span>
        </div>
      </motion.div>
    </div>
  );
}
