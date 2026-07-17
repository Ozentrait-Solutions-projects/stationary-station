import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CreditCard, Tag, CheckCircle2, Loader2, ChevronRight, Shield, Truck, Zap, Navigation } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { orderService, couponService } from '../services/productService';
import { formatPrice } from '../utils/formatters';
import { reverseGeocodeLocation, formatDetectedLocation } from '../utils/location';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'mock',   label: 'Credit / Debit Card',  desc: 'Visa, Mastercard, Amex', icon: '💳', online: true },
  { id: 'upi',    label: 'UPI Payment',           desc: 'Google Pay, PhonePe, Paytm', icon: '📱', online: true },
  { id: 'cod',    label: 'Cash on Delivery',      desc: 'Pay when you receive it', icon: '💵', online: false },
  { id: 'wallet', label: 'NexCart Wallet',        desc: 'Wallet Balance: ₹500', icon: '👛', online: true },
];

const STEPS = ['Address', 'Payment', 'Review'];

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep]                     = useState(1);
  const [placing, setPlacing]               = useState(false);
  const [couponCode, setCouponCode]         = useState('');
  const [couponResult, setCouponResult]     = useState(null);
  const [paymentMethod, setPaymentMethod]   = useState('mock');
  const [couponLoading, setCouponLoading]   = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [address, setAddress] = useState({
    full_name: '', phone: '', address_line: '',
    city: '', state: '', pincode: '', country: 'India',
  });

  const discount = couponResult?.discount_amount || 0;
  const final    = Math.max(0, cartTotal - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponService.validate(couponCode, cartTotal);
      setCouponResult(res.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setCouponResult(null);
    } finally { setCouponLoading(false); }
  };

  // ── Use Current Location ──────────────────────────────────────────
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await reverseGeocodeLocation(latitude, longitude, 'en');
          const addr = data.address || {};
          setAddress(a => ({
            ...a,
            address_line: [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || a.address_line,
            city:    formatDetectedLocation(addr, data.display_name) || a.city,
            state:   addr.state || a.state,
            pincode: addr.postcode || a.pincode,
            country: addr.country || 'India',
          }));
          toast.success('Location detected! Please verify your address.');
        } catch {
          toast.error('Could not fetch address details. Please fill manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) {
          toast.error('Location access denied. Please allow location in browser settings.');
        } else {
          toast.error('Unable to detect location. Please fill address manually.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const placeOrder = async () => {
    if (!address.full_name || !address.phone || !address.address_line || !address.city || !address.pincode) {
      return toast.error('Please fill in all required address fields');
    }
    setPlacing(true);
    try {
      const res = await orderService.createOrder({
        shipping_address: address,
        coupon_code: couponCode || null,
        payment_method: paymentMethod,
      });
      navigate(`/order-success/${res.data.order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally { setPlacing(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] page-enter">
      <div className="nexcart-container py-6 max-w-5xl">

        {/* Logo header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-150">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6H13.5L22.5 30H15L6 6Z" fill="url(#nexLogoG1)" />
              <path d="M22.5 30H30V6H22.5V30Z" fill="url(#nexLogoG2)" />
              <path d="M6 6V18L13.5 30L22.5 30L6 6Z" fill="url(#nexLogoG3)" />
            </svg>
            <span className="font-display font-bold text-xl text-gray-900">Nex<span className="text-[#6366F1]">Cart</span></span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Checkout</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 flex-shrink-0"
                  style={{
                    backgroundColor: step > i + 1 ? '#10B981' : step === i + 1 ? '#6366F1' : '#F3F4F6',
                    color: step > i + 1 || step === i + 1 ? '#FFFFFF' : '#9CA3AF',
                  }}
                >
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4 text-white" /> : i + 1}
                </div>
                <span className={`text-sm font-bold hidden sm:block ${step === i + 1 ? 'text-[#6366F1]' : step > i + 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-3" style={{ backgroundColor: step > i + 1 ? '#10B981' : '#E5E7EB' }} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Steps ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1 — Address */}
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: step > 1 ? '#10B981' : step === 1 ? '#6366F1' : '#F3F4F6' }}>
                    {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#6366F1]" />
                    <h2 className="font-bold text-gray-900">{t('deliveryAddress')}</h2>
                  </div>
                </div>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-xs text-indigo-600 font-bold hover:text-indigo-850 hover:underline transition-colors">
                    Change
                  </button>
                )}
              </div>

              <AnimatePresence>
                {step === 1 && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5">
                      {/* Use Current Location Button */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={useCurrentLocation}
                        disabled={locationLoading}
                        className="w-full mb-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all border disabled:opacity-60"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,113,133,0.15), rgba(0,113,133,0.08))',
                          border: '1px solid rgba(0,113,133,0.5)',
                          color: '#007185',
                        }}
                      >
                        {locationLoading
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Navigation className="w-4 h-4" />
                        }
                        {locationLoading ? t('detecting') : `📍 ${t('useCurrentLocation')}`}
                      </motion.button>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                        <span className="text-xs text-[#6B7280]">or fill manually</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { key: 'full_name',    placeholder: `${t('fullName')} *`,             span: false },
                          { key: 'phone',        placeholder: `${t('phone')} *`,                 span: false },
                          { key: 'address_line', placeholder: `${t('address')} (House No, Street, Area) *`, span: true },
                          { key: 'city',         placeholder: `${t('cityDistrict')} *`,         span: false },
                          { key: 'state',        placeholder: `${t('state')} *`,                span: false },
                          { key: 'pincode',      placeholder: `${t('pinCode')} *`,              span: false },
                          { key: 'country',      placeholder: `${t('country')}`,                 span: false },
                        ].map(field => (
                          <input
                            key={field.key}
                            className={`input text-sm ${field.span ? 'sm:col-span-2' : ''}`}
                            placeholder={field.placeholder}
                            value={address[field.key]}
                            onChange={e => setAddress(a => ({ ...a, [field.key]: e.target.value }))}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="mt-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                      >
                        {t('continue', 'Continue')} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step > 1 && (
                <div className="px-5 pb-4">
                  <div className="p-4 rounded-xl text-sm bg-gray-50 border border-gray-100">
                    <p className="font-bold text-gray-800">{address.full_name} · {address.phone}</p>
                    <p className="text-gray-500 text-xs mt-1 font-semibold">{address.address_line}, {address.city}, {address.state} {address.pincode}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 — Payment */}
            {step >= 2 && (
              <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: step > 2 ? '#10B981' : step === 2 ? '#6366F1' : '#F3F4F6' }}>
                      {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#6366F1]" />
                      <h2 className="font-bold text-gray-900">{t('paymentMethod', 'Payment Method')}</h2>
                    </div>
                  </div>
                  {step > 2 && (
                    <button onClick={() => setStep(2)} className="text-xs text-indigo-650 font-bold hover:text-indigo-850 hover:underline transition-colors">
                      Change
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {step === 2 && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-5 space-y-2">

                        {/* Pay Now Banner */}
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg mb-3"
                          style={{
                            background: 'linear-gradient(135deg, rgba(39,174,96,0.12), rgba(6,125,98,0.12))',
                            border: '1px solid rgba(39,174,96,0.3)',
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-400">⚡ Pay Now for Faster Delivery!</p>
                            <p className="text-xs text-green-300/80 mt-0.5">Online payments get priority processing — delivered up to 1 day faster.</p>
                          </div>
                        </motion.div>

                        {PAYMENT_METHODS.map(pm => (
                          <label
                            key={pm.id}
                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                              paymentMethod === pm.id
                                ? 'border-[#6366F1] bg-indigo-50/20'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <input
                              type="radio" name="payment" value={pm.id}
                              checked={paymentMethod === pm.id}
                              onChange={e => setPaymentMethod(e.target.value)}
                              className="accent-[#6366F1]"
                            />
                            <span className="text-xl">{pm.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-gray-800">{pm.label}</p>
                                {pm.online && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                    <Zap className="w-2.5 h-2.5" />
                                    Faster
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 font-semibold mt-0.5">{pm.desc}</p>
                            </div>
                          </label>
                        ))}
                        <button
                          onClick={() => setStep(3)}
                          className="mt-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                        >
                          Continue <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step > 2 && (
                  <div className="px-5 pb-4">
                    <div className="p-4 rounded-xl text-sm flex items-center gap-3 bg-gray-50 border border-gray-100">
                      <span className="text-lg">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.icon}</span>
                      <span className="font-bold text-gray-800">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}</span>
                      {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.online && (
                        <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-auto bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                          <Zap className="w-2.5 h-2.5" /> Faster Delivery
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm"
              >
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center text-xs font-bold text-white">3</div>
                    <h2 className="font-bold text-gray-900">{t('reviewOrder', 'Review Your Order')}</h2>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-50">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=56'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-850 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-gray-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}

                  <div className="flex items-center gap-2.5 p-3 rounded-xl text-xs text-gray-550 bg-gray-50 border border-gray-100 font-semibold">
                    <Truck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Expected delivery: <strong className="text-gray-900 font-extrabold">2-5 business days</strong> · FREE</span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={placeOrder}
                    disabled={placing}
                    className="w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100 disabled:opacity-70"
                  >
                    {placing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order…</>
                    ) : (
                      <>🎉 Place Your Order</>
                    )}
                  </motion.button>

                  <p className="text-[10px] text-center text-gray-400 font-bold">
                    By placing your order, you agree to NexCart's{' '}
                    <span className="text-indigo-650 underline cursor-pointer">Terms & Conditions</span>.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Order Summary Sidebar ────────────────────────────────── */}
          <div>
            <div className="rounded-2xl p-5 sticky top-28 space-y-4 bg-white border border-gray-100 shadow-sm">
              {/* Place order button at top for final step */}
              {step === 3 && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-md shadow-indigo-100"
                >
                  {placing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : ''}
                  {placing ? 'Placing…' : 'Place Order'}
                </motion.button>
              )}

              <h3 className="font-bold text-gray-905">Order Summary</h3>

              {/* Items preview */}
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-b-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50">
                      <img src={item.image_url} alt="" className="w-full h-full object-cover"
                        onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 font-bold">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100" />

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount</span><span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Delivery</span><span className="text-emerald-600 font-bold">FREE</span>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="flex justify-between font-black text-gray-900 text-base">
                <span>Order Total</span>
                <span>{formatPrice(final)}</span>
              </div>

              {/* Coupon */}
              {!couponResult ? (
                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-450" />
                      <input
                        className="input pl-9 text-xs py-2 bg-gray-50 border border-gray-200"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs px-4 rounded-xl whitespace-nowrap transition-colors"
                    >
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-1.5">Try: NEXCART10 · WELCOME20 · SALE30</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-sm">
                    <p className="font-bold text-emerald-700">{couponResult.code} applied!</p>
                    <p className="text-xs text-emerald-600 font-semibold">{couponResult.discount_percent}% off → saves {formatPrice(discount)}</p>
                  </div>
                  <button onClick={() => { setCouponResult(null); setCouponCode(''); }} className="text-xs text-red-500 font-bold hover:underline">
                    Remove
                  </button>
                </div>
              )}

              {/* Trust */}
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold justify-center">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
