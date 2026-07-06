import { EventEmitter } from 'events';

// ─── SSE Event Type Constants ─────────────────────────────────────────────────

export const SSE_EVENT_TYPES = {
  // Job lifecycle
  JOB_CREATED: 'JobCreated',
  JOB_SCHEDULED: 'JobScheduled',
  JOB_QUEUED: 'JobQueued',
  JOB_CLAIMED: 'JobClaimed',
  JOB_STARTED: 'JobStarted',
  JOB_COMPLETED: 'JobCompleted',
  JOB_FAILED: 'JobFailed',
  JOB_CANCELLED: 'JobCancelled',

  // Retry lifecycle
  RETRY_PENDING: 'RetryPending',
  RETRY_SCHEDULED: 'RetryScheduled',
  RETRY_EXHAUSTED: 'RetryExhausted',

  // Dead Letter Queue
  DEAD_LETTER_CREATED: 'DeadLetterCreated',
  DEAD_LETTER_REPLAYED: 'DeadLetterReplayed',

  // Worker lifecycle
  WORKER_REGISTERED: 'WorkerRegistered',
  WORKER_HEARTBEAT: 'WorkerHeartbeat',
  WORKER_LOST: 'WorkerLost',
  WORKER_RECOVERED: 'WorkerRecovered',
  WORKER_OFFLINE: 'WorkerOffline',

  // Queue lifecycle
  QUEUE_PAUSED: 'QueuePaused',
  QUEUE_RESUMED: 'QueueResumed',
  QUEUE_DISABLED: 'QueueDisabled',
  QUEUE_ENABLED: 'QueueEnabled',
  QUEUE_DRAINING: 'QueueDraining',

  // Scheduler
  SCHEDULER_PROMOTION_STARTED: 'SchedulerPromotionStarted',
  SCHEDULER_PROMOTION_COMPLETED: 'SchedulerPromotionCompleted',
  SCHEDULER_PROMOTION_FAILED: 'SchedulerPromotionFailed',

  // System
  METRICS_UPDATED: 'MetricsUpdated',
  ACTIVITY_CREATED: 'ActivityCreated',
  NOTIFICATION_CREATED: 'NotificationCreated',
  HEALTH_CHANGED: 'HealthChanged',
} as const;

export type SSEEventType =
  (typeof SSE_EVENT_TYPES)[keyof typeof SSE_EVENT_TYPES];

export interface SSEEventPayload {
  type: SSEEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

// ─── EventBusService ──────────────────────────────────────────────────────────

/**
 * In-process singleton event bus.
 *
 * All service methods call EventBusService.emit(type, data) after committing
 * state mutations. SSEController subscribes to this bus and forwards events
 * to all connected SSE clients.
 *
 * Designed to be the single source of truth for real-time events. Future
 * migration to Redis pub/sub can replace the internal EventEmitter without
 * changing consumer APIs.
 */
class EventBusServiceClass extends EventEmitter {
  private static instance: EventBusServiceClass;

  private constructor() {
    super();
    // Increase max listeners to accommodate many concurrent SSE connections
    this.setMaxListeners(500);
  }

  public static getInstance(): EventBusServiceClass {
    if (!EventBusServiceClass.instance) {
      EventBusServiceClass.instance = new EventBusServiceClass();
    }
    return EventBusServiceClass.instance;
  }

  /**
   * Emit a typed SSE event. Called by service layer after state mutations.
   */
  public emitEvent(
    type: SSEEventType,
    data: Record<string, unknown> = {},
  ): void {
    const payload: SSEEventPayload = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit('sse:event', payload);
  }
}

export const EventBusService = EventBusServiceClass.getInstance();
