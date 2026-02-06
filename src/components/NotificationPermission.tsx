'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported' | 'loading';

export function NotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>('loading');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      setPermission(Notification.permission as PermissionState);
    } catch (error) {
      console.error('[Notification] Error checking subscription:', error);
      setPermission('default');
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result !== 'granted') {
        setIsLoading(false);
        return;
      }

      // Get VAPID public key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('[Notification] VAPID public key not configured');
        setIsLoading(false);
        return;
      }

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // Save subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (response.ok) {
        setIsSubscribed(true);
      } else {
        console.error('[Notification] Failed to save subscription');
      }
    } catch (error) {
      console.error('[Notification] Error subscribing:', error);
    }
    setIsLoading(false);
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error('[Notification] Error unsubscribing:', error);
    }
    setIsLoading(false);
  };

  if (permission === 'loading') {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-400"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Laden...</span>
      </button>
    );
  }

  if (permission === 'unsupported') {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-500"
        title="Push-Benachrichtigungen werden nicht unterstützt"
      >
        <BellOff className="w-4 h-4" />
        <span className="text-sm">Nicht unterstützt</span>
      </button>
    );
  }

  if (permission === 'denied') {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 text-red-400"
        title="Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen aktivieren."
      >
        <BellOff className="w-4 h-4" />
        <span className="text-sm">Blockiert</span>
      </button>
    );
  }

  if (isSubscribed) {
    return (
      <button
        onClick={unsubscribe}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30 transition-colors"
        title="Benachrichtigungen deaktivieren"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        <span className="text-sm">Aktiv</span>
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
      title="Benachrichtigungen aktivieren"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="text-sm">Aktivieren</span>
    </button>
  );
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
