import React from 'react';
import { LiveContext } from './LiveContext';
import { globalRefreshManager } from './RefreshManager';
import type { PollingInterval } from './PollingController';

export interface UseLiveUpdatesOptions {
  moduleKey?: string;
  refetch?: () => void;
}

export interface UseLiveUpdatesResult {
  refetchInterval: number | false;
  isVisible: boolean;
  pollingInterval: PollingInterval;
  triggerRefresh: (moduleKey?: string) => void;
}

export function useLiveUpdates({
  moduleKey,
  refetch,
}: UseLiveUpdatesOptions = {}): UseLiveUpdatesResult {
  const context = React.useContext(LiveContext);

  // Compute active polling rate (in ms), respecting tab visibility and manual mode
  const refetchInterval = React.useMemo<number | false>(() => {
    if (!context) return false;
    const { isVisible, pollingInterval } = context;
    if (
      !isVisible ||
      pollingInterval === 'manual' ||
      pollingInterval === 'off'
    ) {
      return false;
    }
    return pollingInterval as number;
  }, [context]);

  // Subscribe to manual and broadcast refreshes to execute query refetch callback
  React.useEffect(() => {
    if (!refetch) return;

    const unsub = globalRefreshManager.subscribeToRefresh(moduleKey, () => {
      refetch();
    });

    return unsub;
  }, [moduleKey, refetch]);

  if (!context) {
    return {
      refetchInterval: false,
      isVisible: true,
      pollingInterval: 'off',
      triggerRefresh: () => {},
    };
  }

  return {
    refetchInterval,
    isVisible: context.isVisible,
    pollingInterval: context.pollingInterval,
    triggerRefresh: context.triggerRefresh,
  };
}
