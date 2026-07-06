'use client';

import React from 'react';
import { useSSEConnection } from '../../lib/live/useSSEConnection';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOffline } = useSSEConnection();

  if (!isOffline) return null;

  return (
    <div
      className="flex w-full items-center justify-center gap-2 bg-destructive/10 border-b border-destructive/20 px-6 py-2.5 text-xs font-bold text-destructive animate-in slide-in-from-top duration-200 select-none"
      role="alert"
    >
      <WifiOff className="h-4 w-4 animate-pulse" />
      <span>
        You are currently offline. Real-time updates paused. Reconnecting
        automatically when connection is restored.
      </span>
    </div>
  );
}
export default OfflineBanner;
