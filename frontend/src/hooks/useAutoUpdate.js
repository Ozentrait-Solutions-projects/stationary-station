import { useEffect } from 'react';

let initialBuildTime = null;

export function useAutoUpdate() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker if supported
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);

            // Check for updates on page load & periodically
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker == null) return;

              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] New content is available; please refresh.');
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  } else {
                    console.log('[PWA] Content is cached for offline use.');
                  }
                }
              };
            };
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });

      // Reload page when new Service Worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] Controller changed. Reloading page...');
          window.location.reload();
        }
      });
    }

    // Version checking function
    const checkForNewVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        if (!response.ok) return;
        const data = await response.json();

        if (!initialBuildTime) {
          initialBuildTime = data.buildTime || data.timestamp;
          return;
        }

        const currentBuild = data.buildTime || data.timestamp;
        if (currentBuild && currentBuild !== initialBuildTime) {
          console.log('[PWA] New version detected:', currentBuild, 'Old:', initialBuildTime);
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) reg.update();
          }
          // Smooth reload to apply latest changes
          window.location.reload();
        }
      } catch (err) {
        // Silent catch for network errors
      }
    };

    // Initial check
    checkForNewVersion();

    // Check on window focus and visibility change
    const onFocus = () => checkForNewVersion();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForNewVersion();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Poll every 60 seconds
    const intervalId = setInterval(checkForNewVersion, 60000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);
}
