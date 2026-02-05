'use client';

import { useState, useEffect } from 'react';
import { getNetworkStatus, setupNetworkListeners } from '../sw-register';

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number; // Mbps
  rtt?: number; // milliseconds
  saveData?: boolean;
  isSlowConnection: boolean;
}

/**
 * Hook to monitor network status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    const initial = getNetworkStatus();
    return {
      ...initial,
      isSlowConnection: isSlowConnection(initial),
    };
  });

  useEffect(() => {
    // Update status immediately
    const current = getNetworkStatus();
    setStatus({
      ...current,
      isSlowConnection: isSlowConnection(current),
    });

    // Set up network change listeners
    const cleanup = setupNetworkListeners({
      onOnline: () => {
        const updated = getNetworkStatus();
        setStatus({
          ...updated,
          isSlowConnection: isSlowConnection(updated),
        });
      },
      onOffline: () => {
        const updated = getNetworkStatus();
        setStatus({
          ...updated,
          isSlowConnection: isSlowConnection(updated),
        });
      },
    });

    // Listen for connection changes
    const handleConnectionChange = () => {
      const updated = getNetworkStatus();
      setStatus({
        ...updated,
        isSlowConnection: isSlowConnection(updated),
      });
    };

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      cleanup();
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return status;
}

function isSlowConnection(status: ReturnType<typeof getNetworkStatus>): boolean {
  if (!status.isOnline) return true;
  
  return (
    status.saveData === true ||
    status.effectiveType === 'slow-2g' ||
    status.effectiveType === '2g' ||
    status.effectiveType === '3g'
  );
}
