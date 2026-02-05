'use client';

import { useEffect, useState } from 'react';
import { Download, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import {
  registerServiceWorker,
  activateUpdate,
  setupNetworkListeners,
  requestPersistentStorage,
  isPWA,
} from '@/lib/sw-register';
import { initPerformanceMonitoring } from '@/lib/performance';
import { syncAllQueues, getTotalPending } from '@/lib/db-queue';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInitializer() {
  const [isOnline, setIsOnline] = useState(true);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initialize PWA features
    initializePWA();

    // Set up network listeners
    const cleanup = setupNetworkListeners({
      onOnline: () => {
        setIsOnline(true);
        handleOnline();
      },
      onOffline: () => {
        setIsOnline(false);
      },
    });

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPromptEvent(promptEvent);
      
      // Only show install prompt if not already a PWA
      if (!isPWA()) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for SW update
    const handleSWUpdate = () => {
      setShowUpdatePrompt(true);
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    // Check pending sync items
    checkPendingSync();

    return () => {
      cleanup();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  async function initializePWA() {
    try {
      // Register service worker
      const result = await registerServiceWorker();
      console.log('[PWA] Initialized:', result);

      // Request persistent storage
      await requestPersistentStorage();

      // Initialize performance monitoring
      initPerformanceMonitoring();

      // Set initial online state
      setIsOnline(navigator.onLine);
    } catch (error) {
      console.error('[PWA] Initialization failed:', error);
    }
  }

  async function checkPendingSync() {
    try {
      const pending = await getTotalPending();
      setPendingSync(pending);
    } catch (error) {
      console.error('[PWA] Failed to check pending sync:', error);
    }
  }

  async function handleOnline() {
    console.log('[PWA] Online - checking for pending sync');
    
    await checkPendingSync();

    // Auto-sync if there are pending items
    if (pendingSync > 0) {
      await handleSync();
    }
  }

  async function handleSync() {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const results = await syncAllQueues();
      console.log('[PWA] Sync complete:', results);
      
      // Refresh pending count
      await checkPendingSync();
    } catch (error) {
      console.error('[PWA] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleInstall() {
    if (!installPromptEvent) return;

    try {
      await installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      
      console.log('[PWA] Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      
      setInstallPromptEvent(null);
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }
  }

  async function handleUpdate() {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      activateUpdate(registration);
    }
  }

  return (
    <>
      {/* Network status indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 safe-padding">
          <div className="glass-strong border-b border-border/50 backdrop-blur-xl px-4 py-2">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  You&apos;re offline
                </span>
              </div>
              
              {pendingSync > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-secondary">
                    {pendingSync} pending
                  </span>
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online with pending sync */}
      {isOnline && pendingSync > 0 && (
        <div className="fixed bottom-20 right-4 z-50 safe-padding">
          <div className="glass-medium-elevated rounded-2xl shadow-xl p-4 max-w-sm animate-slide-in-right">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Wifi className="w-5 h-5 text-success" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Back online
                </p>
                <p className="text-xs text-foreground-secondary mt-1">
                  {pendingSync} item{pendingSync !== 1 ? 's' : ''} waiting to sync
                </p>
              </div>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-shrink-0 glass hover:glass-medium rounded-lg p-2 transition-all hover-press disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-20 right-4 z-50 safe-padding">
          <div className="glass-medium-elevated rounded-2xl shadow-xl p-4 max-w-sm animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Update available
                </p>
                <p className="text-xs text-foreground-secondary mt-1">
                  A new version is ready to install
                </p>
              </div>

              <button
                onClick={() => setShowUpdatePrompt(false)}
                className="flex-shrink-0 glass hover:glass-medium rounded-lg p-1 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-all hover-press"
              >
                Update Now
              </button>
              <button
                onClick={() => setShowUpdatePrompt(false)}
                className="glass hover:glass-medium rounded-lg px-3 py-2 text-sm font-medium transition-all"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install prompt */}
      {showInstallPrompt && !isPWA() && (
        <div className="fixed bottom-20 right-4 z-50 safe-padding">
          <div className="glass-medium-elevated rounded-2xl shadow-xl p-4 max-w-sm animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Install Dieter HQ
                </p>
                <p className="text-xs text-foreground-secondary mt-1">
                  Install the app for a better experience
                </p>
              </div>

              <button
                onClick={() => setShowInstallPrompt(false)}
                className="flex-shrink-0 glass hover:glass-medium rounded-lg p-1 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-all hover-press"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="glass hover:glass-medium rounded-lg px-3 py-2 text-sm font-medium transition-all"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
