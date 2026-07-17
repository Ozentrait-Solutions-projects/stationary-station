import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Check, Shield, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  
  // Step verification state
  const [step, setStep]                       = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode]               = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    
    // Generate a 6-digit mock OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setVerificationCode('');
    setStep(2);
    
    toast.success(`Verification code sent to email! (Mock OTP: ${code})`, { duration: 10000 });
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (verificationCode !== sentCode) {
      return setError('Invalid verification code. Please check the code and try again.');
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Registration successful! Welcome to NexCart.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setVerificationCode('');
    toast.success(`New verification code sent! (Mock OTP: ${code})`, { duration: 10000 });
  };

  const strength = form.password.length >= 8 ? 'strong' : form.password.length >= 6 ? 'medium' : 'weak';

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {step === 1 ? (
          <div className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
            <h1 className="font-display text-xl font-black text-gray-950 mb-1">Create account</h1>
            <p className="text-sm text-gray-400 font-semibold mb-5">Join millions of happy NexCart shoppers!</p>

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
              {[
                { key: 'name',    label: 'Your name',    type: 'text',     placeholder: 'First and last name' },
                { key: 'email',   label: 'Email',         type: 'email',    placeholder: 'you@example.com' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{field.label}</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
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
                {form.password && (
                  <div className="flex gap-1 mt-1.5">
                    {['weak', 'medium', 'strong'].map((s, i) => (
                      <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            strength === 'strong' ? '#10B981' :
                            strength === 'medium' && i < 2 ? '#F59E0B' :
                            strength === 'weak'   && i === 0 ? '#EF4444' :
                            '#E5E7EB'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Re-enter password</label>
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
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 font-bold" />
                  )}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              >
                Continue
              </motion.button>
            </form>

            <p className="text-[10px] text-gray-450 font-bold mt-4 leading-relaxed">
              By creating an account, you agree to NexCart's{' '}
              <Link to="#" className="text-indigo-605 hover:underline">Conditions of Use</Link>{' '}
              and{' '}
              <Link to="#" className="text-indigo-605 hover:underline">Privacy Notice</Link>.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
            <h1 className="font-display text-xl font-black text-gray-950 mb-1">Verify email</h1>
            <p className="text-sm text-gray-400 font-semibold mb-5">
              Enter the verification code shown in the website popup
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl text-sm text-red-650 bg-red-50 border border-red-150"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  className="input text-center text-xl tracking-[0.4em] py-2.5 font-black placeholder:tracking-normal placeholder:text-gray-300"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
                <p className="text-center text-xs text-gray-450 font-bold mt-2.5 bg-gray-50 border border-gray-100 rounded-xl py-2">
                  Temporary verification code: <span className="text-indigo-650 font-black">{sentCode}</span>
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin text-white" /> Verifying…</> : 'Verify & Register'}
              </motion.button>

              <div className="flex items-center justify-between text-xs font-bold mt-4">
                <button
                  type="button"
                  onClick={resendVerificationCode}
                  className="text-indigo-650 hover:underline"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-gray-450 hover:underline"
                >
                  Edit details
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sign in link */}
        <div className="mt-5 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-150" />
            <span className="text-xs text-gray-400 font-bold">Already a customer?</span>
            <div className="flex-1 h-px bg-gray-150" />
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Sign in to your account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400 font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Your data is encrypted and secured</span>
        </div>
      </motion.div>
    </div>
  );
}
