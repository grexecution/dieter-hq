'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        {/* Glass container */}
        <div className="glass-medium-elevated rounded-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              You&apos;re Offline
            </h1>
            <p className="text-foreground-secondary">
              No internet connection detected. Some features may be unavailable.
            </p>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Network Status</span>
                <span className="text-sm font-medium text-destructive">Offline</span>
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Cached Pages</span>
                <span className="text-sm font-medium text-success">Available</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full glass-medium hover:glass-strong transition-all duration-200 rounded-xl px-6 py-3 text-foreground font-medium flex items-center justify-center gap-2 hover-press"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full glass hover:glass-medium transition-all duration-200 rounded-xl px-6 py-3 text-foreground-secondary font-medium hover-press"
            >
              Go Back
            </button>
          </div>

          {/* Available features */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-foreground-tertiary mb-3">
              Available Offline:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Chat', 'Calendar', 'Tasks', 'Notes'].map((feature) => (
                <span
                  key={feature}
                  className="glass rounded-full px-3 py-1 text-xs text-foreground-secondary"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-6 text-sm text-foreground-tertiary">
          Your changes will sync automatically when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}

// Note: Metadata exported from client components is not supported.
// Use generateMetadata in a layout.tsx or keep this as a server component wrapper.
