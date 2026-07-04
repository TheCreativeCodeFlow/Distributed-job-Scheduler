export interface QueueMetrics {
  active: number;
  paused: number;
  disabled: number;
  draining: number;
}

export interface WorkerMetrics {
  registered: number;
  idle: number;
  running: number;
  lost: number;
  recovering: number;
}

export interface JobMetrics {
  queued: number;
  claimed: number;
  running: number;
  completed: number;
  failed: number;
  scheduled: number;
}

export interface RetryMetrics {
  pending: number;
  exhausted: number;
}

export interface DlqMetrics {
  active: number;
  replayed: number;
}

export interface SchedulerMetrics {
  promotionCount: number;
  emptyScans: number;
  batchSizes: number;
  promotionLatency: number;
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    rss: number;
    heapTotal?: number;
    heapUsed?: number;
  };
  cpu: Record<string, unknown>;
  databaseLatency: number;
  redisLatency: number;
  expiredLeases: number;
  heartbeatRenewalRate: number;
}
