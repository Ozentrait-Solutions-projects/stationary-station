import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ChevronRight, Truck, Clock, XCircle, Loader2, AlertTriangle,
  RotateCcw, ArrowLeftRight, Upload, X, CheckCircle, Camera, Video,
} from 'lucide-react';
import { orderService, returnService } from '../services/productService';
import { formatPrice, formatDate, ORDER_STATUS } from '../utils/formatters';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div>
            <h3 className="font-display font-black text-gray-900 text-lg">
              {type === 'return' ? 'Request Return' : 'Request Exchange'}
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Product info */}
        <div className="flex items-center gap-3 p-4 mx-4 mt-4 bg-gray-50 rounded-2xl border border-gray-100">
          <img src={item.image_url} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-gray-100" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48'; }} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
            <p className="text-xs text-gray-400 font-semibold">{formatPrice(item.price_at_purchase)} × {item.quantity}</p>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmitDetails} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Type */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Request Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'return', icon: RotateCcw, label: 'Return', desc: 'Get a refund' },
                  { val: 'exchange', icon: ArrowLeftRight, label: 'Exchange', desc: 'Get a replacement' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setType(opt.val)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${type === opt.val ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <opt.icon className={`w-5 h-5 mb-1.5 ${type === opt.val ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-black ${type === opt.val ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Reason *</label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe the issue with your product in detail…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none transition-all"
                required
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-60">
                {submitting ? 'Creating…' : 'Next →'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <Camera className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Evidence Required</p>
                <p className="text-xs text-amber-700 font-medium mt-0.5">Upload clear photos (required) and optionally a video showing the issue with the product.</p>
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Photos * (up to 3)</label>
              <div className="flex gap-2 flex-wrap">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full rounded-xl object-cover border border-gray-100" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <Camera className="w-5 h-5 text-gray-300" />
                    <span className="text-[10px] text-gray-400 font-bold mt-1">Add Photo</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                  </label>
                )}
              </div>
            </div>

            {/* Video */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Video (optional)</label>
              {videoPreview ? (
                <div className="relative">
                  <video src={videoPreview} controls className="w-full rounded-xl max-h-32 object-cover" />
                  <button type="button" onClick={() => { setVideo(null); setVideoPreview(null); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                  <Video className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500 font-medium">Upload video (MP4, MOV) — max 50MB</span>
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                ← Back
              </button>
              <button
                type="button"
                onClick={handleUploadEvidence}
                disabled={uploading || photos.length === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
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
  const [returnModal, setReturnModal] = useState(null); // { order, item }

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
    <div className="min-h-screen bg-[#FAFBFD] page-enter">
      <div className="nexcart-container py-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-gray-900">Your Orders</h1>
            <p className="text-sm text-gray-400 mt-0.5 font-bold">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold px-3 py-2.5 rounded-xl transition-all shadow-xs text-sm">
              Refresh
            </button>
            <Link to="/products" className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-white border border-gray-100 shadow-xs">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-6">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="rounded-2xl p-8 bg-white border border-rose-100 shadow-sm text-center space-y-3">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-bold text-gray-900 text-base">Unable to load orders</h3>
            <p className="text-xs text-gray-400 font-semibold max-w-sm mx-auto">We encountered an issue fetching your order history. Please click Retry below to load your data.</p>
            <button
              onClick={fetchOrders}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Retry Loading Orders
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl py-20 text-center bg-white border border-gray-100 shadow-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            </motion.div>
            <h3 className="font-display text-xl font-black text-gray-950 mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-8 font-semibold">Start shopping to place your first order.</p>
            <Link to="/products" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-8 py-3.5 rounded-full inline-flex items-center gap-2 font-bold shadow-md shadow-indigo-100">
              Shop Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const st       = ORDER_STATUS[order.status];
              const progress = STATUS_PROGRESS[order.status] || 1;
              const canCancel = CANCELLABLE_STATUSES.includes(order.status);
              const isDelivered = order.status === 'delivered';
              const isCancelling = cancellingId === order.id;
              const isConfirming = confirmCancelId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm bg-gray-50 border-b border-gray-100 font-semibold text-gray-500">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Order Placed</p>
                        <p className="font-bold text-gray-800 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total</p>
                        <p className="font-extrabold text-gray-900 mt-0.5">{formatPrice(order.final_price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Payment</p>
                        <p className="font-bold text-gray-800 mt-0.5 capitalize">{order.payment_method || 'Card'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Order # {order.id}</p>
                    </div>
                  </div>

                  {/* Status + Progress bar */}
                  <div className="px-4 pt-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{st?.icon}</span>
                        <span className={`font-semibold text-sm badge badge-${st?.color || 'info'}`}>
                          {st?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {order.status !== 'cancelled' && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Est. delivery: 2-5 days</span>
                          </div>
                        )}

                        {/* Cancel Order Button */}
                        {canCancel && !isConfirming && (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={isCancelling}
                            className="flex items-center gap-1.5 text-xs text-rose-600 font-extrabold hover:bg-rose-50 transition-colors px-2.5 py-1.5 rounded-xl border border-rose-200 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cancel Confirmation */}
                    <AnimatePresence>
                      {isConfirming && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-3"
                        >
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100">
                            <AlertTriangle className="w-4 h-4 text-rose-650 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-black text-rose-800">Cancel this order?</p>
                              <p className="text-xs text-rose-700/80 mt-0.5 font-semibold">This action cannot be undone. The stock will be restored.</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                className="text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-bold"
                              >
                                Keep
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={isCancelling}
                                className="text-xs px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-750 transition-colors flex items-center gap-1 disabled:opacity-60 font-bold"
                              >
                                {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {isCancelling ? 'Cancelling…' : 'Yes, Cancel'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {order.status !== 'cancelled' && (
                      <div className="relative mb-4">
                        <div className="h-1.5 rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${isDelivered ? 'bg-emerald-500' : 'bg-[#6366F1]'}`}
                            style={{ width: `${(progress / 5) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label, idx) => (
                            <span key={label} className={`text-[9px] font-bold ${idx < progress ? (isDelivered ? 'text-emerald-500' : 'text-[#6366F1]') : 'text-gray-300'}`}>
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="px-4 pb-4 space-y-4">
                    {order.items?.map(item => {
                      const isApproved = item.return_status === 'approved' || item.return_status === 'RETURN_APPROVED';
                      const isRejected = item.return_status === 'rejected' || item.return_status === 'RETURN_REJECTED';
                      const isPending = item.return_status === 'pending' || item.return_status === 'evidence_submitted' || item.return_status === 'RETURN_REQUESTED' || item.return_status === 'RETURN_PROCESSING';

                      return (
                        <div key={item.id} className="pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link to={`/products/${item.product_id}`} className="text-sm font-bold text-gray-800 hover:text-[#6366F1] transition-colors line-clamp-1">
                                {item.title}
                              </Link>
                              <p className="text-xs text-gray-400 font-bold mt-0.5">
                                Qty: {item.quantity} · {formatPrice(item.price_at_purchase)} each
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <Link to={`/products/${item.product_id}`}
                                  className="text-xs text-indigo-650 font-bold hover:text-indigo-850 transition-colors">
                                  Buy it again
                                </Link>
                                <span className="text-gray-200">|</span>
                                <Link to={`/products/${item.product_id}`}
                                  className="text-xs text-indigo-650 font-bold hover:text-indigo-850 transition-colors">
                                  View item
                                </Link>
                                {/* Return/Exchange button for delivered orders if no active return */}
                                {isDelivered && !item.return_status && (
                                  <>
                                    <span className="text-gray-200">|</span>
                                    <button
                                      onClick={() => setReturnModal({ order, item })}
                                      className="text-xs text-rose-600 font-bold hover:text-rose-800 transition-colors flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Return / Exchange
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-black text-sm text-gray-900">{formatPrice(item.price_at_purchase * item.quantity)}</p>
                            </div>
                          </div>

                          {/* ── Return Request Status Cards & Timeline ───────── */}
                          {isApproved && (
                            <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  <span>Return Approved</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700">Updated: {formatDate(item.return_approved_at || item.return_updated_at)}</span>
                              </div>
                              <p className="text-xs text-emerald-900 font-semibold">
                                Your return request for <span className="font-bold">{item.title}</span> has been approved successfully.
                              </p>
                              <div className="pt-2 border-t border-emerald-200/70 flex items-center justify-between text-[10px] font-bold text-emerald-800 flex-wrap gap-1">
                                <span>✓ Return Requested ({formatDate(item.return_created_at)})</span>
                                <span className="hidden sm:inline">→</span>
                                <span>✓ Under Review</span>
                                <span className="hidden sm:inline">→</span>
                                <span className="font-black text-emerald-900">✓ Return Approved</span>
                              </div>
                            </div>
                          )}

                          {isRejected && (
                            <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs">
                                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                  <span>Return Rejected</span>
                                </div>
                                <span className="text-[10px] font-bold text-rose-700">Updated: {formatDate(item.return_rejected_at || item.return_updated_at)}</span>
                              </div>
                              <p className="text-xs text-rose-950 font-medium">Your return request was rejected by admin.</p>
                              <div className="p-3 bg-white/90 rounded-xl border border-rose-200 text-xs">
                                <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 mb-0.5">Reason for Rejection:</p>
                                <p className="font-bold text-gray-900 leading-relaxed">{item.rejection_reason || 'No reason provided'}</p>
                              </div>
                              <div className="pt-2 border-t border-rose-200/70 flex items-center justify-between text-[10px] font-bold flex-wrap gap-1">
                                <span className="text-gray-500">✓ Return Requested ({formatDate(item.return_created_at)})</span>
                                <span className="hidden sm:inline text-gray-300">→</span>
                                <span className="text-gray-500">✓ Under Review</span>
                                <span className="hidden sm:inline text-gray-300">→</span>
                                <span className="text-rose-700 font-black">✕ Return Rejected</span>
                              </div>
                            </div>
                          )}

                          {isPending && (
                            <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <div className="flex items-center gap-1.5 text-amber-800 font-black text-xs">
                                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                  <span>Return Under Review</span>
                                </div>
                                <span className="text-[10px] font-bold text-amber-700">Requested: {formatDate(item.return_created_at)}</span>
                              </div>
                              <p className="text-xs text-amber-900 font-semibold">Your return request has been submitted and is under review by our admin team.</p>
                              <div className="pt-2 border-t border-amber-200/70 flex items-center justify-between text-[10px] font-bold text-amber-800 flex-wrap gap-1">
                                <span className="font-black">✓ Return Requested</span>
                                <span className="hidden sm:inline">→</span>
                                <span className="font-black text-amber-950">⏳ Under Review</span>
                                <span className="hidden sm:inline">→</span>
                                <span className="text-gray-400">Decision Pending</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Delivery info */}
                    {order.shipping_address && (
                      <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-gray-500 bg-gray-50 border border-gray-100 font-semibold">
                        <Truck className="w-3.5 h-3.5 text-indigo-650 flex-shrink-0 mt-0.5" />
                        <span>
                          Delivering to {order.shipping_address.full_name} · {order.shipping_address.address_line}, {order.shipping_address.city}, {order.shipping_address.pincode}
                        </span>
                      </div>
                    )}

                    {/* Delivered badge */}
                    {isDelivered && (
                      <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        Order delivered. You can request a return or exchange for up to 7 days.
                      </div>
                    )}
                  </div>
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
