"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  RefreshCw, 
  Trash2, 
  Bell, 
  Moon, 
  Sun,
  Database,
  Wifi,
  HardDrive,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-zinc-500">Benachrichtigungen im Browser</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if ("Notification" in window) {
                      const permission = await Notification.requestPermission();
                      toast.info(`Berechtigung: ${permission}`);
                    }
                  }}
                >
                  Aktivieren
                </Button>
              </div>
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
