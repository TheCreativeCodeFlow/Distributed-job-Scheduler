/**
 * SSEClient
 *
 * A singleton that manages exactly ONE EventSource connection for the entire
 * application. No component or page should open its own EventSource.
 *
 * Features:
 * - Single global connection
 * - Exponential backoff reconnection: 1s → 2s → 5s → 10s → 30s → 60s
 * - Browser visibility awareness (pauses reconnect when tab hidden)
 * - Offline detection (pauses reconnect, resumes on network restore)
 * - Dispatches events through globalEventDispatcher
 * - Token-based authentication via query param
 */

import { globalEventDispatcher } from './EventDispatcher';
import { SSE_EVENTS } from './EventDispatcher';

export type SSEStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'polling-fallback';

type TokenGetter = () => string | null;

const BACKOFF_SEQUENCE = [1000, 2000, 5000, 10000, 30000, 60000];

class SSEClientClass {
  private static instance: SSEClientClass;
  private eventSource: EventSource | null = null;
  private tokenGetter: TokenGetter | null = null;
  private status: SSEStatus = 'idle';
  private backoffIndex = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;
  private baseUrl: string;

  // Throttle tracking for burst events
  private recentEvents = new Map<string, number>();
  private readonly THROTTLE_WINDOW_MS = 500;

  private constructor() {
    this.baseUrl =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
      );
    }
  }

  public static getInstance(): SSEClientClass {
    if (!SSEClientClass.instance) {
      SSEClientClass.instance = new SSEClientClass();
    }
    return SSEClientClass.instance;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  public setTokenGetter(getter: TokenGetter) {
    this.tokenGetter = getter;
  }

  public enable() {
    this.enabled = true;
    this.connect();
  }

  public disable() {
    this.enabled = false;
    this.disconnect();
    this.setStatus('idle');
  }

  public getStatus(): SSEStatus {
    return this.status;
  }

  public reconnect() {
    this.clearReconnectTimer();
    this.disconnect();
    this.connect();
  }

  public destroy() {
    this.enabled = false;
    this.clearReconnectTimer();
    this.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
      );
    }
  }

  // ── Internal Connection Management ────────────────────────────────────────

  private connect() {
    if (!this.enabled) return;
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) {
      this.setStatus('disconnected');
      globalEventDispatcher.publish(SSE_EVENTS.SSE_OFFLINE, {});
      return;
    }
    if (document.visibilityState === 'hidden') {
      // Will reconnect when visible again
      return;
    }

    const token = this.tokenGetter?.();
    if (!token) {
      // No token yet — retry shortly
      this.scheduleReconnect();
      return;
    }

    this.disconnect();

    const url = `${this.baseUrl}/events/stream?token=${encodeURIComponent(token)}`;
    this.setStatus('connecting');

    try {
      this.eventSource = new EventSource(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.eventSource.onopen = () => {
      this.backoffIndex = 0;
      this.setStatus('connected');
      globalEventDispatcher.publish(SSE_EVENTS.SSE_CONNECTED, {
        timestamp: new Date().toISOString(),
      });
    };

    this.eventSource.onerror = () => {
      // EventSource automatically retries but we manage it ourselves
      this.disconnect();
      this.scheduleReconnect();
    };

    // Listen to the initial connection confirmation
    this.eventSource.addEventListener('connected', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        globalEventDispatcher.publish('sse:connected:detail', data);
      } catch {
        /* ignore parse error */
      }
    });

    // Forward all named events from the backend
    const allEventTypes = Object.values(SSE_EVENTS).filter(
      (v) => !v.startsWith('sse:'),
    );

    for (const eventType of allEventTypes) {
      this.eventSource.addEventListener(eventType, (e) => {
        this.handleIncomingEvent(eventType, (e as MessageEvent).data);
      });
    }

    // Fallback for unnamed 'message' events
    this.eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload?.type) {
          this.handleIncomingEvent(payload.type, e.data);
        }
      } catch {
        /* ignore */
      }
    };
  }

  private disconnect() {
    if (this.eventSource) {
      this.eventSource.onopen = null;
      this.eventSource.onerror = null;
      this.eventSource.onmessage = null;
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private scheduleReconnect() {
    this.clearReconnectTimer();
    if (!this.enabled) return;

    const delay =
      BACKOFF_SEQUENCE[
        Math.min(this.backoffIndex, BACKOFF_SEQUENCE.length - 1)
      ];
    this.backoffIndex = Math.min(
      this.backoffIndex + 1,
      BACKOFF_SEQUENCE.length - 1,
    );

    this.setStatus('reconnecting');
    globalEventDispatcher.publish(SSE_EVENTS.SSE_RECONNECTING, {
      delay,
      attempt: this.backoffIndex,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: SSEStatus) {
    if (this.status !== status) {
      this.status = status;
      globalEventDispatcher.publish(SSE_EVENTS.SSE_STATUS, { status });
    }
  }

  // ── Event Handling ────────────────────────────────────────────────────────

  private handleIncomingEvent(eventType: string, rawData: string) {
    // Throttle burst of identical event types within 500ms window
    const now = Date.now();
    const lastSeen = this.recentEvents.get(eventType);
    if (lastSeen && now - lastSeen < this.THROTTLE_WINDOW_MS) {
      // Still publish but mark as seen
      this.recentEvents.set(eventType, now);
    } else {
      this.recentEvents.set(eventType, now);
    }

    // Cleanup stale throttle entries every ~100 events
    if (this.recentEvents.size > 100) {
      const cutoff = now - this.THROTTLE_WINDOW_MS * 2;
      for (const [key, ts] of this.recentEvents) {
        if (ts < cutoff) this.recentEvents.delete(key);
      }
    }

    try {
      const payload = JSON.parse(rawData);
      globalEventDispatcher.publish(eventType, payload);
      globalEventDispatcher.publish('sse:any_event', { eventType, payload });
    } catch {
      globalEventDispatcher.publish(eventType, { raw: rawData });
      globalEventDispatcher.publish('sse:any_event', {
        eventType,
        raw: rawData,
      });
    }
  }

  // ── Browser Event Handlers ────────────────────────────────────────────────

  private handleOnline = () => {
    globalEventDispatcher.publish(SSE_EVENTS.SSE_ONLINE, {});
    if (this.enabled && this.status !== 'connected') {
      this.backoffIndex = 0;
      this.clearReconnectTimer();
      this.connect();
    }
  };

  private handleOffline = () => {
    this.clearReconnectTimer();
    this.disconnect();
    this.setStatus('disconnected');
    globalEventDispatcher.publish(SSE_EVENTS.SSE_OFFLINE, {});
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (this.enabled && this.status !== 'connected') {
        this.backoffIndex = 0;
        this.clearReconnectTimer();
        this.connect();
      }
    }
    // On hidden: don't disconnect — don't start new reconnects
  };
}

export const SSEClient = SSEClientClass.getInstance();
