'use client';

import React from 'react';
import { LiveContext } from './LiveContext';
import {
  globalPollingController,
  type PollingInterval,
} from './PollingController';
import { globalRefreshManager } from './RefreshManager';
import { SSEClient, type SSEStatus } from './SSEClient';
import { SSEManager } from './SSEManager';
import { usePreferencesStore } from '../../store/preferences';
import { useAuthStore } from '../../store/auth';
import { useNotificationStore } from '../../store/notifications';
import { globalEventDispatcher, SSE_EVENTS } from './EventDispatcher';

interface LiveProviderProps {
  children: React.ReactNode;
}

export function LiveProvider({ children }: LiveProviderProps) {
  const [now, setNow] = React.useState<Date>(() => new Date(Date.now()));
  const [isVisible, setIsVisible] = React.useState<boolean>(true);
  const [pollingInterval, setPollingIntervalState] =
    React.useState<PollingInterval>(globalPollingController.getInterval());

  // SSE specific states
  const [sseStatus, setSseStatus] = React.useState<SSEStatus>('idle');
  const [isOffline, setIsOffline] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });
  const [lastEventAt, setLastEventAt] = React.useState<Date | null>(null);

  // 1. Synchronize visibility state
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsVisible(document.visibilityState === 'visible');

      const handleVisibilityChange = () => {
        setIsVisible(document.visibilityState === 'visible');
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      };
    }
  }, []);

  // 2. Clock ticking clock
  React.useEffect(() => {
    if (!isVisible) return;

    const clockInterval = setInterval(() => {
      setNow(new Date(Date.now()));
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [isVisible]);

  // 3. Sync polling interval controller to react state
  React.useEffect(() => {
    const unsub = globalPollingController.subscribe((newInterval) => {
      setPollingIntervalState(newInterval);
    });
    return unsub;
  }, []);

  // 4. Initialize SSEManager and SSEClient
  React.useEffect(() => {
    // Setup token getter
    SSEClient.setTokenGetter(() => useAuthStore.getState().accessToken);

    // Initialize manager
    SSEManager.initialize(
      () => usePreferencesStore.getState().preferences,
      (type, message, description) => {
        useNotificationStore
          .getState()
          .addToast({ type, message, description });
      },
    );

    // Listeners for SSE events
    const unsubStatus = globalEventDispatcher.subscribe(
      SSE_EVENTS.SSE_STATUS,
      ({ status }) => {
        setSseStatus(status);
      },
    );

    const unsubAnyEvent = globalEventDispatcher.subscribe(
      'sse:any_event',
      () => {
        setLastEventAt(new Date());
      },
    );

    const unsubConnected = globalEventDispatcher.subscribe(
      SSE_EVENTS.SSE_CONNECTED,
      () => {
        setLastEventAt(new Date());
      },
    );

    const unsubOffline = globalEventDispatcher.subscribe(
      SSE_EVENTS.SSE_OFFLINE,
      () => {
        setIsOffline(true);
      },
    );

    const unsubOnline = globalEventDispatcher.subscribe(
      SSE_EVENTS.SSE_ONLINE,
      () => {
        setIsOffline(false);
      },
    );

    return () => {
      unsubStatus();
      unsubAnyEvent();
      unsubConnected();
      unsubOffline();
      unsubOnline();
      SSEClient.destroy();
      SSEManager.destroy();
    };
  }, []);

  // 5. Connect/reconfigure SSE and polling based on preferences & auth state
  const preferences = usePreferencesStore((state) => state.preferences);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  React.useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // User is not authenticated, disable SSE and polling
      SSEClient.disable();
      globalPollingController.setInterval('off');
      return;
    }

    const { liveUpdateMode, pollingInterval } = preferences;

    if (liveUpdateMode === 'auto') {
      // Enable SSE client
      SSEClient.enable();
      // If SSE starts successfully, it will turn off polling itself (via SSEManager status listener).
      // But initially we can set the polling interval as backup until it connects.
      const currentSseStatus = SSEClient.getStatus();
      if (currentSseStatus === 'connected') {
        globalPollingController.setInterval('off');
      } else {
        globalPollingController.setInterval(pollingInterval);
      }
    } else if (liveUpdateMode === 'polling') {
      SSEClient.disable();
      globalPollingController.setInterval(pollingInterval);
    } else {
      // manual
      SSEClient.disable();
      globalPollingController.setInterval('off');
    }
  }, [preferences, isAuthenticated, accessToken]);

  const setPollingInterval = React.useCallback((interval: PollingInterval) => {
    globalPollingController.setInterval(interval);
  }, []);

  const triggerRefresh = React.useCallback((moduleKey?: string) => {
    globalRefreshManager.triggerManualRefresh(moduleKey);
  }, []);

  const reconnectSSE = React.useCallback(() => {
    SSEClient.reconnect();
  }, []);

  const value = React.useMemo(
    () => ({
      now,
      isVisible,
      pollingInterval,
      setPollingInterval,
      triggerRefresh,
      sseStatus,
      isOffline,
      lastEventAt,
      reconnectSSE,
    }),
    [
      now,
      isVisible,
      pollingInterval,
      setPollingInterval,
      triggerRefresh,
      sseStatus,
      isOffline,
      lastEventAt,
      reconnectSSE,
    ],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
