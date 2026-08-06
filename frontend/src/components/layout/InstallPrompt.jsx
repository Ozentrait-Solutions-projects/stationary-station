import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the user is on an iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install prompt if not dismissed this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS and not already standalone, show custom guide
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isIOSDevice && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        // We can show it after a small delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We no longer need the prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 overflow-hidden"
      >
        <div className="glass shadow-2xl rounded-2xl p-5 border border-indigo-150 flex flex-col gap-4 relative bg-white/95 backdrop-blur-xl">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App Info Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#EC4899] flex items-center justify-center text-white font-extrabold text-lg shadow-md flex-shrink-0">
              N
            </div>
            <div className="flex-1 pr-6">
              <h3 className="font-display font-bold text-gray-900 text-base leading-tight">Install NexCart</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Live Smart, Shop Happy</p>
            </div>
          </div>

          {/* Body Context */}
          {!isIOS ? (
            <div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Install our app on your device for quick access, full-screen view, and smoother performance.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 btn-primary py-2.5 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:shadow-indigo-200 transition-all font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Install Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Later
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3.5 font-medium">
                Install NexCart on your iOS device to access it anytime from your Home Screen:
              </p>
              <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-gray-700 flex flex-col gap-2.5 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                  <span className="flex items-center gap-1 font-medium">
                    Tap the share icon <Share className="w-3.5 h-3.5 inline text-blue-500" /> in Safari.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                  <span className="flex items-center gap-1 font-medium">
                    Scroll down and select <span className="font-bold">Add to Home Screen</span> <PlusSquare className="w-3.5 h-3.5 inline text-gray-700" />.
                  </span>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                Close Guide
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
