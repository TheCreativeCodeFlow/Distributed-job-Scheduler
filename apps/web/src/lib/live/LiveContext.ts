import React from 'react';
import type { PollingInterval } from './PollingController';
import type { SSEStatus } from './SSEClient';

export interface LiveContextType {
  now: Date;
  isVisible: boolean;
  pollingInterval: PollingInterval;
  setPollingInterval: (interval: PollingInterval) => void;
  triggerRefresh: (moduleKey?: string) => void;

  // SSE & Real-time extensions
  sseStatus: SSEStatus;
  isOffline: boolean;
  lastEventAt: Date | null;
  reconnectSSE: () => void;
}

export const LiveContext = React.createContext<LiveContextType | null>(null);
