import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Check, Shield, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail]             = useState('');
  const [step, setStep]               = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Verification code sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: verificationCode,
        newPassword
      });
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('New verification code sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const strength = newPassword.length >= 8 ? 'strong' : newPassword.length >= 6 ? 'medium' : 'weak';

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
            <h1 className="font-display text-xl font-black text-gray-950 mb-1">Reset Password</h1>
            <p className="text-sm text-gray-400 font-semibold mb-5">Enter your email address to receive a verification code.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm text-red-650 bg-red-50 border border-red-150">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  className="input text-sm py-2.5"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin text-white" /> Sending Code…</> : 'Send Reset Code'}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm">
            <h1 className="font-display text-xl font-black text-gray-950 mb-1">Verify & Reset</h1>
            <p className="text-sm text-gray-400 font-semibold mb-5">
              Enter the 6-digit verification code and your new password.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm text-red-650 bg-red-50 border border-red-150">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
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
                  Code sent to <span className="text-indigo-650 font-black">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input text-sm py-2.5 pr-10"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
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
                {newPassword && (
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Re-enter Password</label>
                <div className="relative">
                  <input
                    type="password"
                    className="input text-sm py-2.5 pr-10"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && confirmPassword === newPassword && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 font-bold" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin text-white" /> Resetting…</> : 'Reset Password'}
              </button>

              <div className="flex items-center justify-between text-xs font-bold mt-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={resendCode}
                  className="text-indigo-650 hover:underline disabled:opacity-50"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-gray-450 hover:underline"
                >
                  Change Email
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-450 font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Your data is encrypted and secured</span>
        </div>
      </motion.div>
    </div>
  );
}
