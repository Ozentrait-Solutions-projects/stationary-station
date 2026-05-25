import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/productService';
import { couponService } from '../services/productService';
import { formatPrice } from '../utils/formatters';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'mock',   label: 'Pay Online (Demo)',     desc: 'Instant confirmation' },
  { id: 'cod',    label: 'Cash on Delivery',      desc: 'Pay when you receive' },
  { id: 'wallet', label: 'NexCart Wallet',        desc: 'Balance: ₹500' },
];

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=Address, 2=Payment, 3=Review
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode]   = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mock');

  const [address, setAddress] = useState({
    full_name: '', phone: '', address_line: '',
    city: '', state: '', pincode: '', country: 'India',
  });

  const discount = couponResult?.discount_amount || 0;
  const final    = Math.max(0, cartTotal - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await couponService.validate(couponCode, cartTotal);
      setCouponResult(res.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCouponResult(null);
    }
  };

  const placeOrder = async () => {
    if (!address.full_name || !address.phone || !address.address_line || !address.city || !address.pincode) {
      return toast.error('Please fill all address fields');
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
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const STEPS = ['Address', 'Payment', 'Review'];

  return (
    <div className="nexcart-container py-8 page-enter max-w-5xl">
      <h1 className="font-display text-3xl font-bold text-dark-900 dark:text-white mb-8">Checkout</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${step > i+1 ? 'bg-green-500 text-white' : step === i+1 ? 'bg-primary-600 text-white shadow-glow-sm' : 'bg-dark-200 dark:bg-dark-700 text-dark-400'}`}>
              {step > i+1 ? <CheckCircle2 className="w-4 h-4" /> : i+1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${step === i+1 ? 'text-primary-600 dark:text-primary-400' : 'text-dark-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 w-8 sm:w-16 ${step > i+1 ? 'bg-green-500' : 'bg-dark-200 dark:bg-dark-700'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1 — Address */}
          {step >= 1 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h2 className="font-display font-bold text-dark-900 dark:text-white">Delivery Address</h2>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="ml-auto text-xs text-primary-600 dark:text-primary-400 hover:underline">Edit</button>
                )}
              </div>

              {step === 1 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <input className="input" placeholder="Full Name *" value={address.full_name} onChange={e => setAddress(a => ({...a, full_name: e.target.value}))} />
                  <input className="input" placeholder="Phone Number *" value={address.phone} onChange={e => setAddress(a => ({...a, phone: e.target.value}))} />
                  <input className="input sm:col-span-2" placeholder="Address Line (House No, Street) *" value={address.address_line} onChange={e => setAddress(a => ({...a, address_line: e.target.value}))} />
                  <input className="input" placeholder="City *" value={address.city} onChange={e => setAddress(a => ({...a, city: e.target.value}))} />
                  <input className="input" placeholder="State *" value={address.state} onChange={e => setAddress(a => ({...a, state: e.target.value}))} />
                  <input className="input" placeholder="PIN Code *" value={address.pincode} onChange={e => setAddress(a => ({...a, pincode: e.target.value}))} />
                  <input className="input" placeholder="Country" value={address.country} onChange={e => setAddress(a => ({...a, country: e.target.value}))} />
                  <div className="sm:col-span-2">
                    <button onClick={() => setStep(2)} className="btn-primary w-full justify-center py-3.5">Continue to Payment</button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-dark-600 dark:text-dark-300 bg-dark-50 dark:bg-dark-800 rounded-xl p-4">
                  <p className="font-semibold text-dark-800 dark:text-dark-100">{address.full_name} · {address.phone}</p>
                  <p>{address.address_line}, {address.city}, {address.state} {address.pincode}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Payment */}
          {step >= 2 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <h2 className="font-display font-bold text-dark-900 dark:text-white">Payment Method</h2>
                {step > 2 && <button onClick={() => setStep(2)} className="ml-auto text-xs text-primary-600 dark:text-primary-400 hover:underline">Edit</button>}
              </div>

              {step === 2 ? (
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(pm => (
                    <label key={pm.id} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200
                      ${paymentMethod === pm.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-dark-200 dark:border-dark-700 hover:border-primary-300'}`}>
                      <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={e => setPaymentMethod(e.target.value)} className="accent-primary-600" />
                      <div>
                        <p className="font-semibold text-sm text-dark-800 dark:text-dark-100">{pm.label}</p>
                        <p className="text-xs text-dark-400">{pm.desc}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => setStep(3)} className="btn-primary w-full justify-center py-3.5 mt-2">Review Order</button>
                </div>
              ) : (
                <div className="text-sm text-dark-600 dark:text-dark-300 bg-dark-50 dark:bg-dark-800 rounded-xl p-4">
                  <p className="font-semibold text-dark-800 dark:text-dark-100">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-dark-900 dark:text-white mb-4">Order Review</h2>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate">{item.title}</p>
                      <p className="text-xs text-dark-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-dark-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={placeOrder}
                disabled={placing}
                className="w-full btn-primary justify-center py-4 text-base gap-2"
              >
                {placing ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order...</> : '🎉 Place Order'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="card p-5 sticky top-24 space-y-4">
            <h3 className="font-display font-bold text-dark-900 dark:text-white">Price Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-dark-600 dark:text-dark-300">
                <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span><span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-dark-600 dark:text-dark-300">
                <span>Delivery</span><span className="text-green-600">FREE</span>
              </div>
            </div>
            <div className="divider" />
            <div className="flex justify-between font-bold text-dark-900 dark:text-white text-lg">
              <span>Total</span><span>{formatPrice(final)}</span>
            </div>

            {/* Coupon */}
            {!couponResult ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    className="input pl-9 text-sm"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  />
                </div>
                <button onClick={applyCoupon} className="btn-outline text-sm px-3">Apply</button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                <div className="text-sm">
                  <p className="font-semibold text-green-700 dark:text-green-300">{couponResult.code} applied!</p>
                  <p className="text-green-600 dark:text-green-400 text-xs">{couponResult.discount_percent}% off</p>
                </div>
                <button onClick={() => { setCouponResult(null); setCouponCode(''); }} className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            )}

            <p className="text-[10px] text-dark-400 text-center">Try: NEXCART10 · WELCOME20 · SALE30</p>
          </div>
        </div>
      </div>
    </div>
  );
}
