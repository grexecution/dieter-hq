"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  RefreshCw, 
  Trash2, 
  Bell, 
  BellOff,
  BellRing,
  Moon, 
  Sun,
  Database,
  Wifi,
  HardDrive,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

type PushStatus = {
  permission: NotificationPermission | 'unsupported' | 'loading';
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  serviceWorkerActive: boolean;
  vapidKeyConfigured: boolean;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  const [pushStatus, setPushStatus] = useState<PushStatus>({
    permission: 'loading',
    isSubscribed: false,
    subscription: null,
    serviceWorkerActive: false,
    vapidKeyConfigured: false,
  });

  // Check push notification status
  const checkPushStatus = useCallback(async () => {
    // Check basic support
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushStatus(prev => ({ ...prev, permission: 'unsupported' }));
      return;
    }

    try {
      // Check VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      // Check service worker
      const registration = await navigator.serviceWorker.getRegistration();
      const swActive = !!registration?.active;
      
      // Check subscription
      let subscription: PushSubscription | null = null;
      if (registration) {
        subscription = await registration.pushManager.getSubscription();
      }

      setPushStatus({
        permission: Notification.permission,
        isSubscribed: !!subscription,
        subscription,
        serviceWorkerActive: swActive,
        vapidKeyConfigured: !!vapidKey,
      });
    } catch (error) {
      console.error('[Settings] Error checking push status:', error);
      setPushStatus(prev => ({ ...prev, permission: 'default' }));
    }
  }, []);

  useEffect(() => {
    checkPushStatus();
  }, [checkPushStatus]);

  // Subscribe to push notifications
  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error(`Berechtigung verweigert: ${permission}`);
        await checkPushStatus();
        setIsSubscribing(false);
        return;
      }

      // Get VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error('VAPID Key nicht konfiguriert');
        setIsSubscribing(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // Save to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (response.ok) {
        toast.success('Push-Benachrichtigungen aktiviert!');
        await checkPushStatus();
      } else {
        const data = await response.json();
        toast.error(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error('[Settings] Subscribe error:', error);
      toast.error(`Fehler beim Aktivieren: ${error instanceof Error ? error.message : 'Unbekannt'}`);
    }
    setIsSubscribing(false);
  };

  // Unsubscribe from push notifications
  const handleUnsubscribe = async () => {
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        
        toast.success('Push-Benachrichtigungen deaktiviert');
      }
      
      await checkPushStatus();
    } catch (error) {
      console.error('[Settings] Unsubscribe error:', error);
      toast.error('Fehler beim Deaktivieren');
    }
    setIsSubscribing(false);
  };

  // Send test notification
  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '🔔 Test Notification',
          body: `Test um ${new Date().toLocaleTimeString('de-DE')} - Push funktioniert!`,
          tag: 'test',
          url: '/settings',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.failed > 0 && data.lastError) {
          toast.error(`Push fehlgeschlagen: ${data.lastError.message || 'Unbekannter Fehler'} (Status: ${data.lastError.statusCode || 'N/A'})`);
        } else if (data.sent > 0) {
          toast.success(`Push gesendet! ✅`);
        } else {
          toast.info('Keine Push-Abonnements vorhanden');
        }
      } else {
        toast.error(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error('[Settings] Test notification error:', error);
      toast.error('Fehler beim Senden');
    }
    setIsSendingTest(false);
  };

  // Fetch server debug info
  const [serverDebug, setServerDebug] = useState<{
    vapidPublicConfigured: boolean;
    vapidPrivateConfigured: boolean;
    subscriptionCount: number;
  } | null>(null);

  const fetchServerDebug = async () => {
    try {
      const res = await fetch('/api/push/debug');
      const data = await res.json();
      if (data.ok) {
        setServerDebug({
          vapidPublicConfigured: data.config.vapidPublicConfigured,
          vapidPrivateConfigured: data.config.vapidPrivateConfigured,
          subscriptionCount: data.subscriptions.count,
        });
      }
    } catch (e) {
      console.error('[Settings] Debug fetch error:', e);
    }
  };

  useEffect(() => {
    fetchServerDebug();
  }, []);

  // Get status display info
  const getPushStatusDisplay = () => {
    if (pushStatus.permission === 'loading') {
      return { icon: Loader2, text: 'Lädt...', color: 'text-zinc-500', spin: true };
    }
    if (pushStatus.permission === 'unsupported') {
      return { icon: XCircle, text: 'Nicht unterstützt', color: 'text-red-500', spin: false };
    }
    if (pushStatus.permission === 'denied') {
      return { icon: BellOff, text: 'Blockiert', color: 'text-red-500', spin: false };
    }
    if (!pushStatus.serviceWorkerActive) {
      return { icon: AlertTriangle, text: 'Service Worker inaktiv', color: 'text-amber-500', spin: false };
    }
    if (!pushStatus.vapidKeyConfigured) {
      return { icon: AlertTriangle, text: 'VAPID nicht konfiguriert', color: 'text-amber-500', spin: false };
    }
    if (pushStatus.isSubscribed) {
      return { icon: CheckCircle2, text: 'Aktiv', color: 'text-emerald-500', spin: false };
    }
    return { icon: Bell, text: 'Nicht aktiviert', color: 'text-zinc-500', spin: false };
  };

  const statusDisplay = getPushStatusDisplay();

  const handleHardRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Cache wird geleert...");
    
    try {
      // Unregister all service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Clear all caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear localStorage (except auth)
      const authData = localStorage.getItem("auth");
      localStorage.clear();
      if (authData) localStorage.setItem("auth", authData);

      // Clear sessionStorage
      sessionStorage.clear();

      toast.success("Cache geleert! Seite wird neu geladen...");
      
      // Hard reload after short delay
      setTimeout(() => {
        window.location.href = window.location.origin + "?cache_bust=" + Date.now();
      }, 1000);
    } catch (error) {
      console.error("Hard refresh failed:", error);
      toast.error("Fehler beim Cache leeren");
      setIsRefreshing(false);
    }
  };

  const handleClearInbox = async () => {
    if (!confirm("Wirklich ALLE Inbox-Items löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return;
    }
    
    setIsClearing(true);
    try {
      // Archive all pending items
      const res = await fetch("/api/inbox/items?status=pending&limit=500");
      const data = await res.json();
      
      if (data.ok && data.data?.items) {
        for (const item of data.data.items) {
          await fetch(`/api/inbox/items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "archived" })
          });
        }
      }
      
      toast.success(`${data.data?.items?.length || 0} Items archiviert`);
    } catch (error) {
      console.error("Clear inbox failed:", error);
      toast.error("Fehler beim Leeren der Inbox");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Zurück</span>
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Einstellungen
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl p-4 space-y-6">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Darstellung
              </CardTitle>
              <CardDescription>Passe das Aussehen der App an</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-zinc-500">Dunkles Farbschema verwenden</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === "dark" ? "Light" : "Dark"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>Push-Benachrichtigungen verwalten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Display */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <div className="flex items-center gap-3">
                  <statusDisplay.icon className={`h-5 w-5 ${statusDisplay.color} ${statusDisplay.spin ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="font-medium">Status</p>
                    <p className={`text-sm ${statusDisplay.color}`}>{statusDisplay.text}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkPushStatus}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Debug Info */}
              <div className="text-xs text-zinc-500 space-y-1 p-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                <p className="font-medium text-zinc-700 dark:text-zinc-300">📱 Browser (Client):</p>
                <p>Permission: {pushStatus.permission}</p>
                <p>Service Worker: {pushStatus.serviceWorkerActive ? '✅' : '❌'}</p>
                <p>VAPID Key (client): {pushStatus.vapidKeyConfigured ? '✅' : '❌'}</p>
                <p>Subscribed: {pushStatus.isSubscribed ? '✅' : '❌'}</p>
                {pushStatus.subscription && (
                  <p className="truncate">Endpoint: {pushStatus.subscription.endpoint.slice(0, 50)}...</p>
                )}
                
                <div className="border-t border-zinc-200 dark:border-zinc-700 my-2" />
                
                <p className="font-medium text-zinc-700 dark:text-zinc-300">🖥️ Server (Vercel):</p>
                {serverDebug ? (
                  <>
                    <p>VAPID Public: {serverDebug.vapidPublicConfigured ? '✅' : '❌'}</p>
                    <p>VAPID Private: {serverDebug.vapidPrivateConfigured ? '✅' : '❌'}</p>
                    <p>Subscriptions in DB: {serverDebug.subscriptionCount}</p>
                  </>
                ) : (
                  <p>Lädt...</p>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs h-7"
                  onClick={() => {
                    checkPushStatus();
                    fetchServerDebug();
                    toast.info('Status aktualisiert');
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Debug
                </Button>
              </div>

              {/* Subscribe/Unsubscribe */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-zinc-500">
                    {pushStatus.isSubscribed 
                      ? 'Benachrichtigungen sind aktiv' 
                      : 'Benachrichtigungen aktivieren'}
                  </p>
                </div>
                {pushStatus.isSubscribed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnsubscribe}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <BellOff className="h-4 w-4 mr-2" />
                    )}
                    Deaktivieren
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSubscribe}
                    disabled={isSubscribing || pushStatus.permission === 'denied' || pushStatus.permission === 'unsupported'}
                  >
                    {isSubscribing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    Aktivieren
                  </Button>
                )}
              </div>

              {/* Test Notification */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">Test Push senden</p>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                    Sendet an alle {serverDebug?.subscriptionCount || 0} Geräte in DB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900/30"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Test senden
                </Button>
              </div>

              {/* Force Test (bypass checks) */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">🔧 Browser Notification Test</p>
                  <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
                    Testet die Browser Notification API direkt (kein Server)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {
                        new Notification('🐕 Dieter HQ Test', {
                          body: `Direkte Notification um ${new Date().toLocaleTimeString('de-DE')}`,
                          icon: '/icon-192.png',
                          tag: 'direct-test',
                        });
                        toast.success('Notification gesendet!');
                      } else {
                        toast.error(`Permission: ${permission}`);
                      }
                    } catch (e) {
                      toast.error(`Fehler: ${e instanceof Error ? e.message : 'Unknown'}`);
                    }
                  }}
                  className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
                >
                  <BellRing className="h-4 w-4 mr-2" />
                  Browser Test
                </Button>
              </div>

              {/* Permission blocked hint */}
              {pushStatus.permission === 'denied' && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen aktivieren.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Verbindung
              </CardTitle>
              <CardDescription>OpenClaw Gateway Status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Gateway Status</p>
                  <p className="text-sm text-zinc-500">Verbindung zum Backend prüfen</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/openclaw/status");
                      const data = await res.json();
                      if (data.ok && data.data?.connected) {
                        toast.success(`Verbunden! Latenz: ${data.data.latencyMs}ms`);
                      } else {
                        toast.error("Nicht verbunden");
                      }
                    } catch {
                      toast.error("Verbindungsfehler");
                    }
                  }}
                >
                  Prüfen
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cache & Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <HardDrive className="h-5 w-5" />
                Cache & Daten
              </CardTitle>
              <CardDescription>App-Daten und Cache verwalten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hard Refresh */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <div>
                  <p className="font-medium">Hard Refresh</p>
                  <p className="text-sm text-zinc-500">Cache leeren + Service Worker neu laden</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHardRefresh}
                  disabled={isRefreshing}
                  className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isRefreshing ? "Lädt..." : "Ausführen"}
                </Button>
              </div>

              {/* Clear Inbox */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <div>
                  <p className="font-medium">Inbox leeren</p>
                  <p className="text-sm text-zinc-500">Alle offenen Items archivieren</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearInbox}
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <Database className="h-4 w-4 mr-2 animate-pulse" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  {isClearing ? "Läuft..." : "Archivieren"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Gefahrenzone
              </CardTitle>
              <CardDescription>Vorsicht bei diesen Aktionen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                <div>
                  <p className="font-medium">Alle Daten löschen</p>
                  <p className="text-sm text-zinc-500">LocalStorage + Cache komplett leeren</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("ALLE lokalen Daten löschen? Du wirst ausgeloggt.")) {
                      localStorage.clear();
                      sessionStorage.clear();
                      caches.keys().then(names => names.forEach(name => caches.delete(name)));
                      window.location.href = "/";
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center text-xs text-zinc-400 py-4"
        >
          <p>DieterHQ v0.1.0</p>
          <p>OpenClaw Integration</p>
        </motion.div>
      </main>
    </div>
  );
}
