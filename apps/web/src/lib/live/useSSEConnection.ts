'use client';

import React from 'react';
import { LiveContext } from './LiveContext';

export interface UseSSEConnectionResult {
  status:
    | 'idle'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'polling-fallback';
  isConnected: boolean;
  isOffline: boolean;
  lastEventAt: Date | null;
  reconnect: () => void;
}

export function useSSEConnection(): UseSSEConnectionResult {
  const context = React.useContext(LiveContext);

  if (!context) {
    return {
      status: 'disconnected',
      isConnected: false,
      isOffline: false,
      lastEventAt: null,
      reconnect: () => {},
    };
  }

  // Treat 'connected' state as isConnected true
  const isConnected = context.sseStatus === 'connected';

  return {
    status: context.sseStatus,
    isConnected,
    isOffline: context.isOffline,
    lastEventAt: context.lastEventAt,
    reconnect: context.reconnectSSE,
  };
}
