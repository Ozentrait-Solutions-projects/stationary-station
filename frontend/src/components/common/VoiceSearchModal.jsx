import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, AlertCircle, CheckCircle2, Loader2, Volume2 } from 'lucide-react';

export default function VoiceSearchModal({ isOpen, onClose, onSearch }) {
  const [status, setStatus]           = useState('idle'); // 'listening' | 'processing' | 'success' | 'error' | 'permission_denied' | 'unsupported'
  const [transcript, setTranscript]   = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef                = useRef(null);
  const autoStopTimeoutRef            = useRef(null);

  const stopRecognition = useCallback(() => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    stopRecognition();
    setTranscript('');
    setErrorMessage('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('unsupported');
      setErrorMessage('Voice search is not supported by your browser. Try Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setStatus('listening');
        // Set an auto-stop safety timeout if silence persists for 8 seconds
        autoStopTimeoutRef.current = setTimeout(() => {
          stopRecognition();
          setStatus('error');
          setErrorMessage("Didn't hear anything. Please try speaking again.");
        }, 8000);
      };

      recognition.onresult = (event) => {
        if (autoStopTimeoutRef.current) {
          clearTimeout(autoStopTimeoutRef.current);
          autoStopTimeoutRef.current = null;
        }

        let liveText = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          liveText += text;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        setTranscript(liveText);

        if (isFinal && liveText.trim()) {
          stopRecognition();
          setStatus('processing');

          setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
              onSearch(liveText.trim());
              onClose();
            }, 600);
          }, 400);
        }
      };

      recognition.onerror = (event) => {
        stopRecognition();
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setStatus('permission_denied');
          setErrorMessage('Microphone access is blocked. Please allow microphone permissions in your browser settings.');
        } else if (event.error === 'no-speech') {
          setStatus('error');
          setErrorMessage("Sorry, I didn't catch that. Please try again.");
        } else {
          setStatus('error');
          setErrorMessage('Voice recognition error. Please try speaking clearly or typing your search.');
        }
      };

      recognition.onend = () => {
        if (autoStopTimeoutRef.current) {
          clearTimeout(autoStopTimeoutRef.current);
          autoStopTimeoutRef.current = null;
        }
      };

      recognition.start();
    } catch {
      setStatus('error');
      setErrorMessage('Could not initialize voice recognition. Please try again.');
    }
  }, [onClose, onSearch, stopRecognition]);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopRecognition();
      setStatus('idle');
      setTranscript('');
      setErrorMessage('');
    }

    return () => {
      stopRecognition();
    };
  }, [isOpen, startListening, stopRecognition]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-gray-100 overflow-hidden text-center"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>



            {/* ── Visual Animated Indicator ───────────────────────────── */}
            <div className="relative my-6 flex items-center justify-center h-32">
              {/* Listening State */}
              {status === 'listening' && (
                <>
                  <span className="absolute w-24 h-24 rounded-full bg-indigo-500/20 animate-ping" />
                  <span className="absolute w-32 h-32 rounded-full bg-purple-500/10 animate-pulse" />

                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-indigo-200"
                  >
                    <Mic className="w-9 h-9" />
                  </motion.div>
                </>
              )}

              {/* Processing State */}
              {status === 'processing' && (
                <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
              )}

              {/* Success State */}
              {status === 'success' && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
              )}

              {/* Error or Permission Denied State */}
              {(status === 'error' || status === 'permission_denied' || status === 'unsupported') && (
                <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                  {status === 'permission_denied' ? <MicOff className="w-9 h-9" /> : <AlertCircle className="w-9 h-9" />}
                </div>
              )}
            </div>

            {/* ── Live Waveform Animation Bar ────────────────────────── */}
            {status === 'listening' && (
              <div className="flex items-center justify-center gap-1.5 h-8 mb-4">
                {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9].map((height, i) => (
                  <motion.span
                    key={i}
                    animate={{ scaleY: [0.3, height, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                    className="w-1.5 h-8 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full origin-bottom"
                  />
                ))}
              </div>
            )}

            {/* ── Live Transcription & Status Text ───────────────────── */}
            <div className="min-h-[60px] flex flex-col items-center justify-center mb-4">
              {status === 'listening' && (
                <>
                  <p className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-2">
                    🎤 Listening…
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-800 line-clamp-2 px-2">
                    {transcript ? `"${transcript}"` : 'Waiting for input...'}
                  </p>
                </>
              )}

              {status === 'processing' && (
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">🔍 Processing</p>
                  <p className="text-sm font-medium text-gray-600">Analyzing your search...</p>
                </div>
              )}

              {status === 'success' && (
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">✓ Search Complete</p>
                  <p className="text-base font-black text-gray-900">"{transcript}"</p>
                </div>
              )}

              {(status === 'error' || status === 'permission_denied' || status === 'unsupported') && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                    {status === 'permission_denied' ? 'Permission Required' : 'Voice Search Alert'}
                  </p>
                  <p className="text-sm font-medium text-gray-600 px-2">{errorMessage}</p>
                </div>
              )}
            </div>

            {/* ── Action Buttons ─────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-gray-100">
              {(status === 'error' || status === 'permission_denied' || status === 'unsupported') ? (
                <button
                  onClick={startListening}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" /> Try Again
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="text-xs text-gray-400 font-bold hover:text-gray-700 transition-colors"
                >
                  Cancel & Type Search
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
