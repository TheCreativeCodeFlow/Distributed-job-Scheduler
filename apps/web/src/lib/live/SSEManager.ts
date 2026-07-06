/**
 * SSEManager
 *
 * Bridges the SSEClient → EventDispatcher → RefreshManager → TanStack Query pipeline.
 *
 * Responsibilities:
 * 1. Subscribe to all incoming SSE event types from globalEventDispatcher
 * 2. Map each event to the correct TanStack Query cache keys (selective invalidation)
 * 3. Fire toast notifications for important events (respecting preferences)
 * 4. Control polling fallback via globalPollingController
 */

import { globalEventDispatcher } from './EventDispatcher';
import { globalRefreshManager } from './RefreshManager';
import { globalPollingController } from './PollingController';
import { SSE_EVENTS } from './EventDispatcher';
import type { SSEStatus } from './SSEClient';

// Preference checker — reads from zustand without React hooks (safe in module scope)
type PreferenceGetter = () => {
  successNotifications: boolean;
  errorNotifications: boolean;
  warningNotifications: boolean;
  schedulerNotifications: boolean;
  retryNotifications: boolean;
  dlqNotifications: boolean;
  liveUpdateMode: string;
  pollingInterval: number | 'manual' | 'off';
};

type ToastEmitter = (
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  description?: string,
) => void;

// ── Event → Query Key Invalidation Map ──────────────────────────────────────

const EVENT_INVALIDATION_MAP: Record<string, string[]> = {
  [SSE_EVENTS.JOB_CREATED]: ['jobs', 'dashboard', 'metrics'],
  [SSE_EVENTS.JOB_SCHEDULED]: ['jobs', 'dashboard', 'metrics'],
  [SSE_EVENTS.JOB_QUEUED]: ['jobs', 'dashboard', 'metrics'],
  [SSE_EVENTS.JOB_CLAIMED]: ['jobs', 'workers', 'metrics'],
  [SSE_EVENTS.JOB_STARTED]: ['jobs', 'workers', 'executions', 'metrics'],
  [SSE_EVENTS.JOB_COMPLETED]: [
    'jobs',
    'dashboard',
    'metrics',
    'executions',
    'activity',
  ],
  [SSE_EVENTS.JOB_FAILED]: [
    'jobs',
    'dashboard',
    'metrics',
    'executions',
    'activity',
  ],
  [SSE_EVENTS.JOB_CANCELLED]: ['jobs', 'dashboard', 'metrics', 'activity'],

  [SSE_EVENTS.RETRY_PENDING]: ['retries', 'jobs', 'metrics'],
  [SSE_EVENTS.RETRY_SCHEDULED]: ['retries', 'jobs', 'metrics'],
  [SSE_EVENTS.RETRY_EXHAUSTED]: ['retries', 'dlq', 'activity', 'metrics'],

  [SSE_EVENTS.DEAD_LETTER_CREATED]: ['dlq', 'activity', 'metrics'],
  [SSE_EVENTS.DEAD_LETTER_REPLAYED]: ['dlq', 'jobs', 'activity'],

  [SSE_EVENTS.WORKER_REGISTERED]: ['workers', 'dashboard', 'metrics'],
  [SSE_EVENTS.WORKER_HEARTBEAT]: ['workers', 'dashboard'],
  [SSE_EVENTS.WORKER_LOST]: ['workers', 'dashboard', 'metrics', 'activity'],
  [SSE_EVENTS.WORKER_RECOVERED]: [
    'workers',
    'dashboard',
    'metrics',
    'activity',
  ],
  [SSE_EVENTS.WORKER_OFFLINE]: ['workers', 'dashboard', 'metrics'],

  [SSE_EVENTS.QUEUE_PAUSED]: ['queues', 'dashboard', 'activity'],
  [SSE_EVENTS.QUEUE_RESUMED]: ['queues', 'dashboard', 'activity'],
  [SSE_EVENTS.QUEUE_DISABLED]: ['queues', 'dashboard', 'activity'],
  [SSE_EVENTS.QUEUE_ENABLED]: ['queues', 'dashboard', 'activity'],
  [SSE_EVENTS.QUEUE_DRAINING]: ['queues', 'dashboard', 'activity'],

  [SSE_EVENTS.SCHEDULER_PROMOTION_STARTED]: ['scheduler'],
  [SSE_EVENTS.SCHEDULER_PROMOTION_COMPLETED]: [
    'scheduler',
    'jobs',
    'metrics',
    'activity',
  ],
  [SSE_EVENTS.SCHEDULER_PROMOTION_FAILED]: ['scheduler', 'activity'],

  [SSE_EVENTS.METRICS_UPDATED]: ['metrics'],
  [SSE_EVENTS.ACTIVITY_CREATED]: ['activity'],
  [SSE_EVENTS.HEALTH_CHANGED]: ['dashboard', 'metrics'],
};

// ── SSEManager ────────────────────────────────────────────────────────────────

class SSEManagerClass {
  private unsubscribers: Array<() => void> = [];
  private initialized = false;
  private getPreferences: PreferenceGetter | null = null;
  private emitToast: ToastEmitter | null = null;
  private wasInPollingFallback = false;

  public initialize(getPreferences: PreferenceGetter, emitToast: ToastEmitter) {
    if (this.initialized) return;
    this.initialized = true;
    this.getPreferences = getPreferences;
    this.emitToast = emitToast;

    this.subscribeToSSEStatus();
    this.subscribeToAllEvents();
  }

  public destroy() {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
    this.initialized = false;
  }

  // ── SSE Connection Status Handler ─────────────────────────────────────────

  private subscribeToSSEStatus() {
    const unsub = globalEventDispatcher.subscribe(
      SSE_EVENTS.SSE_STATUS,
      ({ status }: { status: SSEStatus }) => {
        if (status === 'reconnecting' || status === 'disconnected') {
          // Activate polling fallback
          if (!this.wasInPollingFallback) {
            this.wasInPollingFallback = true;
            const prefs = this.getPreferences?.();
            if (prefs && prefs.liveUpdateMode !== 'manual') {
              const interval =
                typeof prefs.pollingInterval === 'number'
                  ? prefs.pollingInterval
                  : 10000;
              globalPollingController.setInterval(interval as any);
            }
          }
        } else if (status === 'connected') {
          // Deactivate polling fallback
          this.wasInPollingFallback = false;
          globalPollingController.setInterval('off');
          // Sync stale data after reconnect
          globalRefreshManager.triggerManualRefresh();
        }
      },
    );
    this.unsubscribers.push(unsub);
  }

  // ── Event Subscription and Invalidation ──────────────────────────────────

  private subscribeToAllEvents() {
    for (const [eventType, keys] of Object.entries(EVENT_INVALIDATION_MAP)) {
      const unsub = globalEventDispatcher.subscribe(eventType, (data) => {
        this.handleEvent(eventType, data, keys);
      });
      this.unsubscribers.push(unsub);
    }
  }

  private handleEvent(eventType: string, data: any, queryKeys: string[]) {
    // 1. Invalidate query cache keys (selectively, deduplicated)
    const uniqueKeys = [...new Set(queryKeys)];
    for (const key of uniqueKeys) {
      globalRefreshManager.triggerManualRefresh(key);
    }

    // 2. Emit notifications for important events
    this.maybeEmitNotification(eventType, data);
  }

  // ── Notification Dispatch ─────────────────────────────────────────────────

  private maybeEmitNotification(eventType: string, data: any) {
    if (!this.emitToast || !this.getPreferences) return;
    const prefs = this.getPreferences();

    const jobId = data?.jobId ? String(data.jobId).slice(0, 8) : '';
    const workerId = data?.workerId ? String(data.workerId).slice(0, 8) : '';
    const queueId = data?.queueId ? String(data.queueId).slice(0, 8) : '';

    switch (eventType) {
      case SSE_EVENTS.JOB_COMPLETED:
        if (prefs.successNotifications)
          this.emitToast(
            'success',
            'Job Completed',
            `Job ${jobId}… finished successfully.`,
          );
        break;

      case SSE_EVENTS.JOB_FAILED:
        if (prefs.errorNotifications)
          this.emitToast(
            'error',
            'Job Failed',
            `Job ${jobId}… encountered an error.`,
          );
        break;

      case SSE_EVENTS.WORKER_LOST:
        if (prefs.errorNotifications)
          this.emitToast(
            'error',
            'Worker Lost',
            `Worker ${workerId}… stopped responding.`,
          );
        break;

      case SSE_EVENTS.WORKER_OFFLINE:
        if (prefs.warningNotifications)
          this.emitToast(
            'warning',
            'Worker Offline',
            `Worker ${workerId}… went offline.`,
          );
        break;

      case SSE_EVENTS.RETRY_EXHAUSTED:
        if (prefs.retryNotifications)
          this.emitToast(
            'warning',
            'Retry Exhausted',
            `Job ${jobId}… has no more retry attempts.`,
          );
        break;

      case SSE_EVENTS.DEAD_LETTER_CREATED:
        if (prefs.dlqNotifications)
          this.emitToast(
            'warning',
            'DLQ Entry Created',
            `Job ${jobId}… moved to Dead Letter Queue.`,
          );
        break;

      case SSE_EVENTS.DEAD_LETTER_REPLAYED:
        if (prefs.dlqNotifications)
          this.emitToast(
            'info',
            'DLQ Replayed',
            `Entry replayed as a new job.`,
          );
        break;

      case SSE_EVENTS.QUEUE_PAUSED:
        if (prefs.warningNotifications)
          this.emitToast(
            'warning',
            'Queue Paused',
            `Queue ${queueId}… is now paused.`,
          );
        break;

      case SSE_EVENTS.QUEUE_DISABLED:
        if (prefs.warningNotifications)
          this.emitToast(
            'warning',
            'Queue Disabled',
            `Queue ${queueId}… has been disabled.`,
          );
        break;

      case SSE_EVENTS.SCHEDULER_PROMOTION_COMPLETED:
        if (prefs.schedulerNotifications && data?.promotedCount > 0)
          this.emitToast(
            'success',
            'Scheduler Promotion',
            `${data.promotedCount} job(s) promoted to queue.`,
          );
        break;

      case SSE_EVENTS.SCHEDULER_PROMOTION_FAILED:
        if (prefs.schedulerNotifications)
          this.emitToast(
            'error',
            'Scheduler Failure',
            'Promotion cycle failed. Check logs.',
          );
        break;

      default:
        break;
    }
  }
}

export const SSEManager = new SSEManagerClass();
