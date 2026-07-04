export interface SchedulerStatus {
  status: 'ACTIVE' | 'PAUSED' | 'DEGRADED';
  lastPromotionCycleAt: string | null;
}

export interface SchedulerMetrics {
  totalPromoted: number;
  lastPromotedCount: number;
  errorCount: number;
  emptyScans: number;
  lastPromotionLatencyMs: number;
}

export interface SchedulerDashboardData {
  status: string;
  loopIntervalMs: number;
  totalPromotedJobs: number;
}

export interface SchedulerHealth {
  databaseStatus: 'HEALTHY' | 'UNHEALTHY';
  redisStatus: 'HEALTHY' | 'UNHEALTHY';
  schedulerStatus: 'HEALTHY' | 'UNHEALTHY';
  workerAvailability: 'AVAILABLE' | 'DEGRADED';
  latencyMs: number;
}
