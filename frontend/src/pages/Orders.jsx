import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ChevronRight, Truck, Clock, XCircle, Loader2, AlertTriangle,
  RotateCcw, Upload, X, CheckCircle, Camera, Video,
  RefreshCw, ShoppingBag,
} from 'lucide-react';
import { orderService, returnService } from '../services/productService';
import { formatPrice, formatDate, ORDER_STATUS } from '../utils/formatters';
import { resolveMediaUrl } from '../utils/mediaUtils';
import toast from 'react-hot-toast';

const STATUS_PROGRESS = {
  pending:    1,
  confirmed:  2,
  processing: 3,
  shipped:    4,
  delivered:  5,
};

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

// ── Return/Exchange Modal ─────────────────────────────────────────────────────
function ReturnModal({ order, item, onClose, onSuccess }) {
  const [type, setType] = useState('return');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [step, setStep] = useState(1); // 1: details, 2: evidence
  const [requestId, setRequestId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoSelect = (e) => {
    const rawFiles = Array.from(e.target.files);
    if (!rawFiles.length) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = [];

    for (const f of rawFiles) {
      if (!allowed.includes(f.type)) {
        toast.error(`"${f.name}" is not a supported image format (JPG, PNG, WEBP allowed).`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds maximum image size limit of 10MB.`);
        continue;
      }
      validFiles.push(f);
    }

    if (!validFiles.length) return;

    const filesToUse = validFiles.slice(0, 3 - photos.length);
    setPhotos(prev => [...prev, ...filesToUse].slice(0, 3));
    filesToUse.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreviews(prev => [...prev, reader.result].slice(0, 3));
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];
    if (!allowed.includes(file.type)) {
      return toast.error('Video format is not supported. Please upload MP4, MOV, or WEBM video.');
    }
    if (file.size > 50 * 1024 * 1024) {
      return toast.error('Video file size is too large. Maximum allowed size is 50MB.');
    }

    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmitDetails = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return toast.error('Please describe the issue');
    setSubmitting(true);
    try {
      const res = await returnService.createRequest({
        order_id: order.id,
        order_item_id: item.id,
        product_id: item.product_id,
        type,
        reason,
      });
      setRequestId(res.data.request.id);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadEvidence = async () => {
    if (photos.length === 0) return toast.error('Please upload at least one photo as evidence');
    setUploading(true);
    try {
      const formData = new FormData();
      photos.forEach(p => formData.append('photos', p));
      if (video) formData.append('video', video);
      await returnService.uploadEvidence(requestId, formData);
      toast.success('Return request submitted with evidence! Our team will review it shortly.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-display font-black text-lg text-gray-950">Return / Exchange Request</h3>
            <p className="text-xs text-gray-400 font-bold mt-0.5">Order #{order.id} · {item.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmitDetails} className="space-y-5 pt-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Request Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('return')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${type === 'return' ? 'bg-indigo-50 border-indigo-200 text-[#6366F1]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  ↩ Return for Refund
                </button>
                <button
                  type="button"
                  onClick={() => setType('exchange')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${type === 'exchange' ? 'bg-indigo-50 border-indigo-200 text-[#6366F1]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  🔄 Exchange Product
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Reason for Request *</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Please describe in detail why you want to return/exchange this item..."
                rows={4}
                required
                className="w-full text-xs font-medium p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6366F1] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next: Upload Evidence →'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 pt-4">
            <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 font-semibold space-y-1">
              <p className="font-bold">📸 Upload Evidence (Photos / Video)</p>
              <p className="text-[11px] text-indigo-700 font-normal">Upload photos (max 3 photos, 10MB each) or a short unboxing video (max 50MB) showing the condition/issue.</p>
            </div>

            {/* Photos Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Photos ({photos.length}/3) *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-indigo-600 bg-gray-50/50">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Add Photo</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                  </label>
                )}
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Video (Optional)</label>
              {videoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
                  <video src={videoPreview} controls className="w-full max-h-36" />
                  <button
                    type="button"
                    onClick={() => { setVideo(null); setVideoPreview(null); }}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 flex items-center justify-center gap-2 cursor-pointer transition-colors text-gray-400 hover:text-indigo-600 bg-gray-50/50">
                  <Video className="w-5 h-5" />
                  <span className="text-sm text-gray-500 font-medium">Upload video (MP4, MOV) — max 50MB</span>
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                ← Back
              </button>
              <button
                type="button"
                onClick={handleUploadEvidence}
                disabled={uploading || photos.length === 0}
                className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Submit Request</>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main Orders Page ──────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [returnModal, setReturnModal] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    setHasError(false);
    orderService.getMyOrders()
      .then(res => {
        setOrders(res.data.orders || []);
      })
      .catch(err => {
        console.error(err);
        setHasError(true);
        toast.error('Unable to load your orders. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.success('Order cancelled successfully. Stock has been restored.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] page-enter py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10 pb-6 border-b border-gray-200/60">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Your Orders</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Track, return, or manage your recent purchases ({orders.length} order{orders.length !== 1 ? 's' : ''} placed)
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs text-xs sm:text-sm active:scale-98"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span>Refresh</span>
            </button>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 text-xs sm:text-sm active:scale-98"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* ── Loading Skeleton State ───────────────────────────────────── */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse bg-white border border-gray-200/80 shadow-xs">
                <div className="p-6 bg-gray-50/80 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2"><div className="skeleton h-3 w-20 rounded" /><div className="skeleton h-4 w-28 rounded" /></div>
                  <div className="space-y-2"><div className="skeleton h-3 w-16 rounded" /><div className="skeleton h-4 w-24 rounded" /></div>
                  <div className="space-y-2"><div className="skeleton h-3 w-16 rounded" /><div className="skeleton h-4 w-24 rounded" /></div>
                  <div className="space-y-2"><div className="skeleton h-3 w-16 rounded" /><div className="skeleton h-4 w-20 rounded" /></div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center"><div className="skeleton h-6 w-32 rounded-full" /><div className="skeleton h-4 w-28 rounded" /></div>
                  <div className="skeleton h-2 w-full rounded-full" />
                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <div className="skeleton w-20 h-20 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/3 rounded" />
                      <div className="flex gap-2 pt-2"><div className="skeleton h-7 w-24 rounded-xl" /><div className="skeleton h-7 w-24 rounded-xl" /></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* ── Error State ────────────────────────────────────────────── */
          <div className="rounded-3xl p-10 bg-white border border-rose-100 shadow-xs text-center space-y-4 max-w-lg mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="font-display font-black text-gray-900 text-lg">Unable to Load Orders</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              We encountered a network issue while retrieving your order history. Please click below to try again.
            </p>
            <button
              onClick={fetchOrders}
              className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-100"
            >
              Retry Loading Orders
            </button>
          </div>
        ) : orders.length === 0 ? (
          /* ── Empty Orders State ─────────────────────────────────────── */
          <div className="rounded-3xl py-16 px-6 text-center bg-white border border-gray-200/80 shadow-xs max-w-md mx-auto">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center mx-auto mb-5 text-indigo-600">
                <Package className="w-10 h-10" />
              </div>
            </motion.div>
            <h3 className="font-display text-xl font-black text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
              You haven't placed any orders yet. Explore our curated stationery collection and place your first order!
            </p>
            <Link
              to="/products"
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs sm:text-sm px-7 py-3 rounded-xl inline-flex items-center gap-2 font-bold shadow-md shadow-indigo-100 transition-all active:scale-98"
            >
              <span>Start Shopping</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* ── Orders List ────────────────────────────────────────────── */
          <div className="space-y-6 sm:space-y-8">
            {orders.map((order, i) => {
              const st = ORDER_STATUS[order.status];
              const progress = STATUS_PROGRESS[order.status] || 1;
              const canCancel = CANCELLABLE_STATUSES.includes(order.status);
              const isDelivered = order.status === 'delivered';
              const isCancelled = order.status === 'cancelled';
              const isCancelling = cancellingId === order.id;
              const isConfirming = confirmCancelId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl sm:rounded-3xl bg-white border border-gray-200/80 shadow-xs hover:shadow-sm transition-all overflow-hidden"
                >
                  {/* 1. ORDER HEADER (4 COLUMNS) */}
                  <div className="bg-gray-50/80 border-b border-gray-200/70 p-4 sm:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Order Placed</p>
                        <p className="font-bold text-xs sm:text-sm text-gray-900 mt-1">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total</p>
                        <p className="font-black text-xs sm:text-sm text-gray-900 mt-1">{formatPrice(order.final_price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Payment</p>
                        <p className="font-bold text-xs sm:text-sm text-gray-800 mt-1 capitalize">{order.payment_method || 'Card'}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="text-[11px] font-extrabold text-[#6366F1] bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 inline-block">
                          Order #{order.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. ORDER STATUS SECTION & TIMELINE */}
                  <div className="p-4 sm:p-6 border-b border-gray-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{st?.icon}</span>
                        <span className={`font-bold text-xs sm:text-sm px-3 py-1 rounded-full border capitalize ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {st?.label || order.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {!isCancelled && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>Est. delivery: <strong className="text-gray-700">2–5 days</strong></span>
                          </div>
                        )}

                        {/* Cancel Order Action Button */}
                        {canCancel && !isConfirming && (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={isCancelling}
                            className="flex items-center gap-1 text-xs text-rose-600 font-bold hover:bg-rose-50 transition-colors px-3 py-1.5 rounded-xl border border-rose-200 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cancel Confirmation Dialog */}
                    <AnimatePresence>
                      {isConfirming && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-black text-rose-900">Cancel Order #{order.id}?</p>
                              <p className="text-[11px] text-rose-700 mt-0.5 font-medium">This action cannot be undone. Product stock will be restored immediately.</p>
                            </div>
                            <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-bold"
                              >
                                Keep Order
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={isCancelling}
                                className="text-xs px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1 disabled:opacity-60 font-bold shadow-xs"
                              >
                                {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {isCancelling ? 'Cancelling…' : 'Confirm Cancel'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Progress Tracker (Not shown if cancelled) */}
                    {!isCancelled ? (
                      <div className="pt-2">
                        <div className="relative mb-2">
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isDelivered ? 'bg-emerald-500' : 'bg-[#6366F1]'}`}
                              style={{ width: `${(progress / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-gray-400">
                          {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label, idx) => {
                            const isPassed = idx + 1 <= progress;
                            return (
                              <span
                                key={label}
                                className={`${
                                  isPassed
                                    ? isDelivered
                                      ? 'text-emerald-600 font-extrabold'
                                      : 'text-[#6366F1] font-extrabold'
                                    : 'text-gray-300 font-semibold'
                                }`}
                              >
                                {isPassed ? '✓ ' : ''}{label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Cancelled Order Info Banner */
                      <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-100 text-xs text-rose-700 font-medium flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span>This order was cancelled. Stock has been restored and any payment will be refunded.</span>
                      </div>
                    )}
                  </div>

                  {/* 3. PRODUCT ITEMS SECTION */}
                  <div className="p-4 sm:p-6 space-y-6 divide-y divide-gray-100">
                    {order.items?.map((item, idx) => {
                      const isApproved = item.return_status === 'approved' || item.return_status === 'RETURN_APPROVED';
                      const isRejected = item.return_status === 'rejected' || item.return_status === 'RETURN_REJECTED';
                      const isPending = item.return_status === 'pending' || item.return_status === 'evidence_submitted' || item.return_status === 'RETURN_REQUESTED' || item.return_status === 'RETURN_PROCESSING';

                      return (
                        <div key={item.id} className={idx === 0 ? '' : 'pt-6'}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200/80 bg-gray-50 flex-shrink-0 shadow-2xs">
                              <img
                                src={resolveMediaUrl(item.image_url)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120'; }}
                              />
                            </div>

                            {/* Product Info & Actions */}
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/products/${item.product_id}`}
                                className="text-sm sm:text-base font-bold text-gray-900 hover:text-[#6366F1] transition-colors leading-snug line-clamp-2"
                              >
                                {item.title}
                              </Link>
                              <p className="text-xs text-gray-500 font-medium mt-1">
                                Qty: <strong className="text-gray-800">{item.quantity}</strong> · {formatPrice(item.price_at_purchase)} each
                              </p>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <Link
                                  to={`/products/${item.product_id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] font-bold text-xs transition-colors"
                                >
                                  Buy it again
                                </Link>

                                <Link
                                  to={`/products/${item.product_id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
                                >
                                  View item
                                </Link>

                                {/* Return / Exchange button for delivered orders */}
                                {isDelivered && !item.return_status && (
                                  <button
                                    onClick={() => setReturnModal({ order, item })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Return / Exchange
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Product Price */}
                            <div className="text-left sm:text-right flex-shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto">
                              <p className="text-xs text-gray-400 font-medium sm:hidden mb-0.5">Item Total</p>
                              <p className="font-black text-base sm:text-lg text-gray-900">
                                {formatPrice(item.price_at_purchase * item.quantity)}
                              </p>
                            </div>
                          </div>

                          {/* 4. DEDICATED RETURN STATUS CARDS */}
                          {isApproved && (
                            <div className="mt-4 p-4 sm:p-5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs sm:text-sm">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  <span>Return Approved</span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                  Updated: {formatDate(item.return_approved_at || item.return_updated_at)}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
                                Your return request for <strong className="font-bold">{item.title}</strong> has been approved. Our logistics partner will pick up the item shortly.
                              </p>
                              <div className="pt-2.5 border-t border-emerald-200/70 flex items-center justify-between text-[10px] sm:text-xs font-bold text-emerald-800 flex-wrap gap-1">
                                <span>✓ Return Requested ({formatDate(item.return_created_at)})</span>
                                <span className="hidden sm:inline text-emerald-400">→</span>
                                <span>✓ Under Review</span>
                                <span className="hidden sm:inline text-emerald-400">→</span>
                                <span className="font-extrabold text-emerald-950">✓ Return Approved</span>
                              </div>
                            </div>
                          )}

                          {isRejected && (
                            <div className="mt-4 p-4 sm:p-5 bg-rose-50/90 border border-rose-200/80 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 text-rose-800 font-black text-xs sm:text-sm">
                                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                  <span>Return Rejected</span>
                                </div>
                                <span className="text-[11px] font-bold text-rose-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                                  Updated: {formatDate(item.return_rejected_at || item.return_updated_at)}
                                </span>
                              </div>
                              <p className="text-xs text-rose-950 font-medium">Your return request was reviewed and rejected by the admin.</p>
                              <div className="p-3.5 bg-white rounded-xl border border-rose-200/80 text-xs shadow-2xs">
                                <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 mb-1">Reason for Rejection:</p>
                                <p className="font-bold text-gray-900 leading-relaxed">{item.rejection_reason || 'Product did not meet return policy criteria.'}</p>
                              </div>
                              <div className="pt-2.5 border-t border-rose-200/70 flex items-center justify-between text-[10px] sm:text-xs font-bold flex-wrap gap-1 text-gray-500">
                                <span>✓ Return Requested ({formatDate(item.return_created_at)})</span>
                                <span className="hidden sm:inline text-gray-300">→</span>
                                <span>✓ Under Review</span>
                                <span className="hidden sm:inline text-gray-300">→</span>
                                <span className="text-rose-700 font-black">✕ Return Rejected</span>
                              </div>
                            </div>
                          )}

                          {isPending && (
                            <div className="mt-4 p-4 sm:p-5 bg-amber-50/90 border border-amber-200/80 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
                                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                  <span>Return Under Review</span>
                                </div>
                                <span className="text-[11px] font-bold text-amber-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                                  Requested: {formatDate(item.return_created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                                Your return request has been submitted and is currently being reviewed by our customer support team.
                              </p>
                              <div className="pt-2.5 border-t border-amber-200/70 flex items-center justify-between text-[10px] sm:text-xs font-bold text-amber-800 flex-wrap gap-1">
                                <span className="font-bold">✓ Return Requested</span>
                                <span className="hidden sm:inline text-amber-400">→</span>
                                <span className="font-extrabold text-amber-950">⏳ Under Review</span>
                                <span className="hidden sm:inline text-amber-300">→</span>
                                <span className="text-gray-400 font-medium">Decision Pending</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 5. DELIVERY ADDRESS SECTION */}
                  {order.shipping_address && (
                    <div className="p-4 sm:p-6 bg-gray-50/60 border-t border-gray-100 rounded-b-2xl sm:rounded-b-3xl">
                      <div className="flex items-start gap-2.5">
                        <Truck className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed">
                          <p className="font-bold uppercase tracking-wider text-[10px] text-gray-400 mb-0.5">Delivery Address</p>
                          <p className="font-bold text-gray-900">{order.shipping_address.full_name}</p>
                          <p className="text-gray-500 font-medium mt-0.5">
                            {order.shipping_address.address_line}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                          </p>
                          <p className="text-gray-400 text-[11px] font-medium mt-0.5">Phone: {order.shipping_address.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return/Exchange Modal */}
      <AnimatePresence>
        {returnModal && (
          <ReturnModal
            order={returnModal.order}
            item={returnModal.item}
            onClose={() => setReturnModal(null)}
            onSuccess={() => {
              setReturnModal(null);
              fetchOrders();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
