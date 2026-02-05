'use client';

import { useState, useEffect } from 'react';
import { isPWA, getStorageEstimate } from '../sw-register';
import { useNetworkStatus } from './useNetworkStatus';
import { getTotalPending } from '../db-queue';

export interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  isSlowConnection: boolean;
  canInstall: boolean;
  hasUpdate: boolean;
  pendingSync: number;
  storage: {
    usage: number;
    quota: number;
    percentage: number;
  };
  serviceWorker: {
    registered: boolean;
    active: boolean;
  };
}

/**
 * Comprehensive PWA status hook
 * Provides all PWA-related information in one place
 */
export function usePWA(): PWAStatus {
  const networkStatus = useNetworkStatus();
  const [pwaStat, setPWAStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: true,
    isSlowConnection: false,
    canInstall: false,
    hasUpdate: false,
    pendingSync: 0,
    storage: {
      usage: 0,
      quota: 0,
      percentage: 0,
    },
    serviceWorker: {
      registered: false,
      active: false,
    },
  });

  useEffect(() => {
    async function updateStatus() {
      const installed = isPWA();
      const canInstall = 'BeforeInstallPromptEvent' in window;
      const storage = await getStorageEstimate();
      const pending = await getTotalPending();

      // Check service worker status
      const registration = await navigator.serviceWorker.getRegistration();
      const swStatus = {
        registered: !!registration,
        active: !!registration?.active,
      };

      setPWAStatus({
        isInstalled: installed,
        isOnline: networkStatus.isOnline,
        isSlowConnection: networkStatus.isSlowConnection,
        canInstall: canInstall && !installed,
        hasUpdate: !!registration?.waiting,
        pendingSync: pending,
        storage,
        serviceWorker: swStatus,
      });
    }

    updateStatus();

    // Update on SW changes
    const handleSWUpdate = () => {
      updateStatus();
    };

    window.addEventListener('sw-update-available', handleSWUpdate);
    window.addEventListener('sw-sync-complete', updateStatus);

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdate);
      window.removeEventListener('sw-sync-complete', updateStatus);
    };
  }, [networkStatus]);

  return pwaStat;
}

/**
 * Hook to detect if running in standalone mode (installed PWA)
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isPWA());
  }, []);

  return isStandalone;
}

/**
 * Hook for install prompt
 */
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const install = async () => {
    if (!prompt) return false;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  };

  const dismiss = () => {
    setIsInstallable(false);
    setPrompt(null);
  };

  return { isInstallable, install, dismiss };
}
