import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CreditCard, Tag, CheckCircle2, Loader2, ChevronRight, Shield, Truck, Zap, Navigation } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService, couponService } from '../services/productService';
import { formatPrice } from '../utils/formatters';
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
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await resp.json();
          const addr = data.address || {};
          setAddress(a => ({
            ...a,
            address_line: [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || a.address_line,
            city:    addr.city || addr.town || addr.village || addr.county || a.city,
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
    <div style={{ backgroundColor: '#0F1111' }} className="min-h-screen page-enter">
      <div className="nexcart-container py-6 max-w-5xl">

        {/* Logo header */}
        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#FF9900] flex items-center justify-center">
              <span className="text-dark-900 font-bold text-sm">N</span>
            </div>
            <span className="font-display font-bold text-xl text-white">Nex<span className="text-[#FF9900]">Cart</span></span>
          </div>
          <div className="flex items-center gap-1 text-[#6B7280] text-xs">
            <Shield className="w-3.5 h-3.5 text-green-400" />
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
                    backgroundColor: step > i + 1 ? '#067D62' : step === i + 1 ? '#FF9900' : 'rgba(255,255,255,0.08)',
                    color: step > i + 1 || step === i + 1 ? '#131921' : '#6B7280',
                  }}
                >
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? 'text-[#FF9900]' : step > i + 1 ? 'text-green-400' : 'text-[#6B7280]'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-3" style={{ backgroundColor: step > i + 1 ? '#067D62' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Steps ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1 — Address */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: step === 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: step > 1 ? '#067D62' : step === 1 ? '#FF9900' : 'rgba(255,255,255,0.08)', color: step >= 1 ? '#131921' : '#6B7280' }}>
                    {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF9900]" />
                    <h2 className="font-bold text-[#E7E9EA]">Delivery Address</h2>
                  </div>
                </div>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-xs text-[#007185] hover:text-[#FF9900] hover:underline transition-colors">
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
                        {locationLoading ? 'Detecting your location…' : '📍 Use My Current Location'}
                      </motion.button>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                        <span className="text-xs text-[#6B7280]">or fill manually</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { key: 'full_name',    placeholder: 'Full Name *',             span: false },
                          { key: 'phone',        placeholder: 'Mobile Number *',         span: false },
                          { key: 'address_line', placeholder: 'Address (House No, Street, Area) *', span: true },
                          { key: 'city',         placeholder: 'City / District *',       span: false },
                          { key: 'state',        placeholder: 'State *',                 span: false },
                          { key: 'pincode',      placeholder: 'PIN Code *',              span: false },
                          { key: 'country',      placeholder: 'Country',                 span: false },
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
                        className="mt-4 btn-amazon-orange w-full sm:w-auto px-8 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                      >
                        Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step > 1 && (
                <div className="px-5 pb-4">
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <p className="font-semibold text-[#E7E9EA]">{address.full_name} · {address.phone}</p>
                    <p className="text-[#A0AEC0] text-xs mt-0.5">{address.address_line}, {address.city}, {address.state} {address.pincode}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 — Payment */}
            {step >= 2 && (
              <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: step === 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: step > 2 ? '#067D62' : step === 2 ? '#FF9900' : 'rgba(255,255,255,0.08)', color: step >= 2 ? '#131921' : '#6B7280' }}>
                      {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#FF9900]" />
                      <h2 className="font-bold text-[#E7E9EA]">Payment Method</h2>
                    </div>
                  </div>
                  {step > 2 && (
                    <button onClick={() => setStep(2)} className="text-xs text-[#007185] hover:text-[#FF9900] hover:underline transition-colors">
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
                            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border ${
                              paymentMethod === pm.id
                                ? 'border-[#FF9900]'
                                : 'border-transparent hover:border-white/15'
                            }`}
                            style={{ backgroundColor: paymentMethod === pm.id ? 'rgba(255,153,0,0.08)' : 'rgba(255,255,255,0.03)' }}
                          >
                            <input
                              type="radio" name="payment" value={pm.id}
                              checked={paymentMethod === pm.id}
                              onChange={e => setPaymentMethod(e.target.value)}
                              className="accent-[#FF9900]"
                            />
                            <span className="text-xl">{pm.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-[#E7E9EA]">{pm.label}</p>
                                {pm.online && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: 'rgba(39,174,96,0.15)', color: '#27ae60', border: '1px solid rgba(39,174,96,0.3)' }}>
                                    <Zap className="w-2.5 h-2.5" />
                                    Faster
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B7280]">{pm.desc}</p>
                            </div>
                          </label>
                        ))}
                        <button
                          onClick={() => setStep(3)}
                          className="mt-2 btn-amazon-orange w-full sm:w-auto px-8 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                        >
                          Continue <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step > 2 && (
                  <div className="px-5 pb-4">
                    <div className="p-3 rounded-lg text-sm flex items-center gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-lg">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.icon}</span>
                      <span className="font-semibold text-[#E7E9EA]">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}</span>
                      {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.online && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
                          style={{ backgroundColor: 'rgba(39,174,96,0.15)', color: '#27ae60', border: '1px solid rgba(39,174,96,0.3)' }}>
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
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FF9900] flex items-center justify-center text-xs font-bold text-dark-900">3</div>
                    <h2 className="font-bold text-[#E7E9EA]">Review Your Order</h2>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: '#1B2533' }}>
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=56'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#E7E9EA] truncate">{item.title}</p>
                        <p className="text-xs text-[#6B7280]">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-[#E7E9EA] flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 p-3 rounded-lg text-xs text-[#A0AEC0]" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <Truck className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Expected delivery: <strong className="text-[#E7E9EA]">2-5 business days</strong> · FREE</span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={placeOrder}
                    disabled={placing}
                    className="w-full py-3.5 rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                    style={{ background: 'linear-gradient(to bottom, #f0c14b, #e47911)', border: '1px solid #c67600', color: '#131921' }}
                  >
                    {placing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order…</>
                    ) : (
                      <>🎉 Place Your Order</>
                    )}
                  </motion.button>

                  <p className="text-[10px] text-center text-[#6B7280]">
                    By placing your order, you agree to NexCart's{' '}
                    <span className="text-[#007185] underline cursor-pointer">Terms & Conditions</span>.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Order Summary Sidebar ────────────────────────────────── */}
          <div>
            <div className="rounded-lg p-4 sticky top-28 space-y-4" style={{ backgroundColor: '#131921', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Place order button at top for final step */}
              {step === 3 && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(to bottom, #f0c14b, #e47911)', color: '#131921' }}
                >
                  {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : ''}
                  {placing ? 'Placing…' : 'Place Order'}
                </motion.button>
              )}

              <h3 className="font-bold text-[#E7E9EA]">Order Summary</h3>

              {/* Items preview */}
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: '#1B2533' }}>
                      <img src={item.image_url} alt="" className="w-full h-full object-cover"
                        onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#A0AEC0] truncate">{item.title}</p>
                      <p className="text-xs text-[#6B7280]">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#E7E9EA]">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#A0AEC0]">
                  <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span><span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#A0AEC0]">
                  <span>Delivery</span><span className="text-green-400">FREE</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

              <div className="flex justify-between font-bold text-[#E7E9EA]">
                <span>Order Total</span>
                <span>{formatPrice(final)}</span>
              </div>

              {/* Coupon */}
              {!couponResult ? (
                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
                      <input
                        className="input pl-9 text-xs py-2"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="btn-outline text-xs px-3 py-2 rounded-lg whitespace-nowrap"
                    >
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#6B7280] mt-1.5">Try: NEXCART10 · WELCOME20 · SALE30</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)' }}>
                  <div className="text-sm">
                    <p className="font-bold text-green-400">{couponResult.code} applied!</p>
                    <p className="text-xs text-green-300">{couponResult.discount_percent}% off → saves {formatPrice(discount)}</p>
                  </div>
                  <button onClick={() => { setCouponResult(null); setCouponCode(''); }} className="text-xs text-red-400 hover:underline">
                    Remove
                  </button>
                </div>
              )}

              {/* Trust */}
              <div className="flex items-center gap-2 text-xs text-[#6B7280] justify-center">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span>Secure SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
