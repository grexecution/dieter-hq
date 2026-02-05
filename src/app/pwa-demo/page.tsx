'use client';

import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  Database, 
  Gauge,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { usePWA } from '@/lib/hooks/usePWA';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useInstallPrompt } from '@/lib/hooks/usePWA';
import { ProgressiveImage, AdaptiveImage } from '@/components/ProgressiveImage';
import { queueMessage, syncAllQueues } from '@/lib/db-queue';
import { getPerformanceMetrics, getPerformanceRecommendations } from '@/lib/performance';

export default function PWADemoPage() {
  const pwaStatus = usePWA();
  const networkStatus = useNetworkStatus();
  const { isInstallable, install, dismiss } = useInstallPrompt();
  const [isSyncing, setIsSyncing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    // Load performance metrics
    setMetrics(getPerformanceMetrics());
    setRecommendations(getPerformanceRecommendations());
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllQueues();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQueueTest = async () => {
    await queueMessage({
      content: 'Test message queued at ' + new Date().toISOString(),
      timestamp: Date.now(),
    });
    alert('Message queued! Will sync when online.');
  };

  const StatusBadge = ({ condition, label }: { condition: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {condition ? (
        <CheckCircle className="w-5 h-5 text-success" />
      ) : (
        <XCircle className="w-5 h-5 text-destructive" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background p-4 safe-padding pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-medium-elevated rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-2">PWA Features Demo</h1>
          <p className="text-foreground-secondary">
            Test and explore all Progressive Web App features
          </p>
        </div>

        {/* PWA Status */}
        <div className="glass-medium-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">PWA Status</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusBadge 
              condition={pwaStatus.isInstalled} 
              label="Installed as PWA" 
            />
            <StatusBadge 
              condition={pwaStatus.serviceWorker.registered} 
              label="Service Worker Active" 
            />
            <StatusBadge 
              condition={pwaStatus.isOnline} 
              label="Online" 
            />
            <StatusBadge 
              condition={pwaStatus.pendingSync === 0} 
              label="No Pending Sync" 
            />
          </div>

          {isInstallable && (
            <div className="mt-4 p-4 glass rounded-xl">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Install Available</h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    Install this app for a better experience
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={install}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover-press"
                    >
                      Install Now
                    </button>
                    <button
                      onClick={dismiss}
                      className="glass hover:glass-medium px-4 py-2 rounded-lg text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Network Status */}
        <div className="glass-medium-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            {networkStatus.isOnline ? (
              <Wifi className="w-5 h-5 text-success" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive" />
            )}
            <h2 className="text-xl font-semibold">Network Status</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">Status:</span>
              <span className={`text-sm font-medium ${networkStatus.isOnline ? 'text-success' : 'text-destructive'}`}>
                {networkStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {networkStatus.effectiveType && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Connection Type:</span>
                <span className="text-sm font-medium">{networkStatus.effectiveType.toUpperCase()}</span>
              </div>
            )}

            {networkStatus.downlink !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Downlink:</span>
                <span className="text-sm font-medium">{networkStatus.downlink.toFixed(1)} Mbps</span>
              </div>
            )}

            {networkStatus.rtt !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Latency (RTT):</span>
                <span className="text-sm font-medium">{networkStatus.rtt} ms</span>
              </div>
            )}

            {networkStatus.saveData && (
              <div className="p-3 glass rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="text-sm">Data Saver Mode Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Storage & Sync */}
        <div className="glass-medium-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Storage & Sync</h2>
          </div>

          <div className="space-y-4">
            {/* Storage Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground-secondary">Storage Used</span>
                <span className="font-medium">
                  {(pwaStatus.storage.usage / 1024 / 1024).toFixed(2)} MB / 
                  {(pwaStatus.storage.quota / 1024 / 1024).toFixed(0)} MB
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(pwaStatus.storage.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Pending Sync */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">Pending Sync Items:</span>
              <span className="text-sm font-medium">{pwaStatus.pendingSync}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={isSyncing || !networkStatus.isOnline}
                className="flex-1 glass hover:glass-medium disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium hover-press flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
              <button
                onClick={handleQueueTest}
                className="flex-1 glass hover:glass-medium rounded-lg px-4 py-2 text-sm font-medium hover-press"
              >
                Queue Test Message
              </button>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="glass-medium-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Performance</h2>
          </div>

          {metrics?.memory && (
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">JS Heap Size:</span>
                <span className="text-sm font-medium">
                  {(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Total Heap:</span>
                <span className="text-sm font-medium">
                  {(metrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Recommendations
              </h3>
              <ul className="space-y-1">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-foreground-secondary">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Progressive Image Demo */}
        <div className="glass-medium-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Progressive Image Loading</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Standard Progressive</h3>
              <ProgressiveImage
                src="/icon-512.png"
                alt="Progressive load demo"
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Adaptive Quality</h3>
              <AdaptiveImage
                src="/icon-512.png"
                alt="Adaptive quality demo"
                width={200}
                height={200}
                className="rounded-lg"
              />
              <p className="text-xs text-foreground-secondary mt-2">
                Quality adapts to network speed
              </p>
            </div>
          </div>
        </div>

        {/* Glass Effects Demo */}
        <div className="glass-medium-elevated rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Glass Effects</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-sm font-medium">Light</p>
              <p className="text-xs text-foreground-secondary mt-1">.glass</p>
            </div>
            <div className="glass-medium rounded-xl p-4 text-center">
              <p className="text-sm font-medium">Medium</p>
              <p className="text-xs text-foreground-secondary mt-1">.glass-medium</p>
            </div>
            <div className="glass-strong rounded-xl p-4 text-center">
              <p className="text-sm font-medium">Strong</p>
              <p className="text-xs text-foreground-secondary mt-1">.glass-strong</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="glass rounded-xl p-4 text-center text-sm text-foreground-secondary">
          <p>All PWA features are active and ready to use!</p>
          <p className="mt-1">Check the console for detailed logs.</p>
        </div>
      </div>
    </div>
  );
}
