import { db } from '../../../database/index.js';
import { RedisService } from '../../../redis/index.js';
import {
  QueueStatus,
  WorkerStatus,
  JobStatus,
  DlqStatus,
  LeaseStatus,
} from '@prisma/client';
import { SchedulerService } from '../../scheduler/services/scheduler.js';

export class MetricsService {
  private static heartbeatRenewals = 0;

  /**
   * Increments the total heartbeat renewal counter.
   */
  public static incrementHeartbeatRenewals(): void {
    this.heartbeatRenewals += 1;
  }

  /**
   * Resets local counters (primarily for tests).
   */
  public static resetCounters(): void {
    this.heartbeatRenewals = 0;
  }

  /**
   * Helper to retrieve user organization memberships.
   */
  private static async getUserOrgIds(userId: string): Promise<string[]> {
    const memberships = await db.organizationMember.findMany({
      where: { userId },
    });
    return memberships.map((m) => m.organizationId);
  }

  /**
   * GET /metrics/queues
   */
  public static async getQueuesMetrics(userId: string) {
    const orgIds = await this.getUserOrgIds(userId);
    const where = { project: { organizationId: { in: orgIds } } };

    const [active, paused, disabled, draining] = await Promise.all([
      db.queue.count({ where: { ...where, status: QueueStatus.ACTIVE } }),
      db.queue.count({ where: { ...where, status: QueueStatus.PAUSED } }),
      db.queue.count({ where: { ...where, status: QueueStatus.DISABLED } }),
      db.queue.count({ where: { ...where, status: QueueStatus.DRAINING } }),
    ]);

    return { active, paused, disabled, draining };
  }

  /**
   * GET /metrics/workers
   */
  public static async getWorkersMetrics() {
    const [registered, idle, running, lost, recovering] = await Promise.all([
      db.worker.count({ where: { status: { not: WorkerStatus.OFFLINE } } }),
      db.worker.count({ where: { status: WorkerStatus.IDLE } }),
      db.worker.count({ where: { status: WorkerStatus.RUNNING } }),
      db.worker.count({ where: { status: WorkerStatus.LOST } }),
      db.worker.count({ where: { status: WorkerStatus.RECOVERING } }),
    ]);

    return { registered, idle, running, lost, recovering };
  }

  /**
   * GET /metrics/jobs
   */
  public static async getJobsMetrics(userId: string) {
    const orgIds = await this.getUserOrgIds(userId);
    const where = { queue: { project: { organizationId: { in: orgIds } } } };

    const [queued, claimed, running, completed, failed, scheduled] =
      await Promise.all([
        db.job.count({ where: { ...where, status: JobStatus.QUEUED } }),
        db.job.count({ where: { ...where, status: JobStatus.CLAIMED } }),
        db.job.count({ where: { ...where, status: JobStatus.RUNNING } }),
        db.job.count({ where: { ...where, status: JobStatus.COMPLETED } }),
        db.job.count({ where: { ...where, status: JobStatus.FAILED } }),
        db.job.count({ where: { ...where, status: JobStatus.SCHEDULED } }),
      ]);

    return { queued, claimed, running, completed, failed, scheduled };
  }

  /**
   * GET /metrics/retries
   */
  public static async getRetriesMetrics(userId: string) {
    const orgIds = await this.getUserOrgIds(userId);
    const where = { queue: { project: { organizationId: { in: orgIds } } } };

    const [pending, exhausted] = await Promise.all([
      db.job.count({ where: { ...where, status: JobStatus.RETRY_PENDING } }),
      db.job.count({ where: { ...where, status: JobStatus.RETRY_EXHAUSTED } }),
    ]);

    return { pending, exhausted };
  }

  /**
   * GET /metrics/dlq
   */
  public static async getDlqMetrics(userId: string) {
    const orgIds = await this.getUserOrgIds(userId);
    const where = {
      job: { queue: { project: { organizationId: { in: orgIds } } } },
    };

    const [active, replayed] = await Promise.all([
      db.deadLetterEntry.count({
        where: { ...where, status: DlqStatus.ACTIVE },
      }),
      db.deadLetterEntry.count({
        where: { ...where, status: DlqStatus.REPLAYED },
      }),
    ]);

    return { active, replayed };
  }

  /**
   * GET /metrics/scheduler
   */
  public static async getSchedulerMetrics() {
    const schedMetrics = await SchedulerService.getMetrics();
    return {
      promotionCount: schedMetrics.totalPromoted,
      emptyScans: schedMetrics.emptyScans,
      batchSizes: schedMetrics.lastPromotedCount,
      promotionLatency: schedMetrics.lastPromotionLatencyMs,
    };
  }

  /**
   * GET /metrics/execution
   */
  public static async getExecutionMetrics(userId: string) {
    const orgIds = await this.getUserOrgIds(userId);
    const executions = await db.jobExecution.findMany({
      where: {
        status: { in: ['SUCCESS', 'ERROR'] },
        durationMs: { not: null },
        job: {
          queue: {
            project: {
              organizationId: { in: orgIds },
            },
          },
        },
      },
      select: { durationMs: true },
    });

    const durations = executions
      .map((e) => e.durationMs as number)
      .sort((a, b) => a - b);

    const count = durations.length;
    if (count === 0) {
      return { averageRuntime: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sum = durations.reduce((acc, val) => acc + val, 0);
    const averageRuntime = sum / count;

    const getPercentile = (p: number) => {
      const idx = Math.floor(p * count);
      return durations[Math.min(idx, count - 1)];
    };

    return {
      averageRuntime,
      p50: getPercentile(0.5),
      p95: getPercentile(0.95),
      p99: getPercentile(0.99),
    };
  }

  /**
   * GET /metrics/system
   */
  public static async getSystemMetrics() {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const databaseLatency = Date.now() - dbStart;

    const redisHealth = await RedisService.checkHealth();
    const redisLatency = redisHealth.latencyMs ?? 0;

    const expiredLeases = await db.workerLease.count({
      where: { status: LeaseStatus.EXPIRED },
    });

    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      databaseLatency,
      redisLatency,
      expiredLeases,
      heartbeatRenewalRate: this.heartbeatRenewals,
    };
  }

  /**
   * Formats all metrics in Prometheus text format.
   */
  public static async getPrometheusMetrics(userId: string): Promise<string> {
    const [queues, workers, jobs, retries, dlq, scheduler, execution, system] =
      await Promise.all([
        this.getQueuesMetrics(userId),
        this.getWorkersMetrics(),
        this.getJobsMetrics(userId),
        this.getRetriesMetrics(userId),
        this.getDlqMetrics(userId),
        this.getSchedulerMetrics(),
        this.getExecutionMetrics(userId),
        this.getSystemMetrics(),
      ]);

    let out = '';

    // Queues
    out += `# HELP queues_active Active queues gauge\n# TYPE queues_active gauge\nqueues_active ${queues.active}\n`;
    out += `# HELP queues_paused Paused queues gauge\n# TYPE queues_paused gauge\nqueues_paused ${queues.paused}\n`;
    out += `# HELP queues_disabled Disabled queues gauge\n# TYPE queues_disabled gauge\nqueues_disabled ${queues.disabled}\n`;
    out += `# HELP queues_draining Draining queues gauge\n# TYPE queues_draining gauge\nqueues_draining ${queues.draining}\n`;

    // Workers
    out += `# HELP workers_registered Registered workers gauge\n# TYPE workers_registered gauge\nworkers_registered ${workers.registered}\n`;
    out += `# HELP workers_idle Idle workers gauge\n# TYPE workers_idle gauge\nworkers_idle ${workers.idle}\n`;
    out += `# HELP workers_running Running workers gauge\n# TYPE workers_running gauge\nworkers_running ${workers.running}\n`;
    out += `# HELP workers_lost Lost workers gauge\n# TYPE workers_lost gauge\nworkers_lost ${workers.lost}\n`;
    out += `# HELP workers_recovering Recovering workers gauge\n# TYPE workers_recovering gauge\nworkers_recovering ${workers.recovering}\n`;

    // Jobs
    out += `# HELP jobs_queued Queued jobs gauge\n# TYPE jobs_queued gauge\njobs_queued ${jobs.queued}\n`;
    out += `# HELP jobs_claimed Claimed jobs gauge\n# TYPE jobs_claimed gauge\njobs_claimed ${jobs.claimed}\n`;
    out += `# HELP jobs_running Running jobs gauge\n# TYPE jobs_running gauge\njobs_running ${jobs.running}\n`;
    out += `# HELP jobs_completed Completed jobs gauge\n# TYPE jobs_completed gauge\njobs_completed ${jobs.completed}\n`;
    out += `# HELP jobs_failed Failed jobs gauge\n# TYPE jobs_failed gauge\njobs_failed ${jobs.failed}\n`;
    out += `# HELP jobs_scheduled Scheduled jobs gauge\n# TYPE jobs_scheduled gauge\njobs_scheduled ${jobs.scheduled}\n`;

    // Retries
    out += `# HELP retries_pending Pending retries gauge\n# TYPE retries_pending gauge\nretries_pending ${retries.pending}\n`;
    out += `# HELP retries_exhausted Exhausted retries gauge\n# TYPE retries_exhausted gauge\nretries_exhausted ${retries.exhausted}\n`;

    // DLQ
    out += `# HELP dlq_active Active DLQ entries gauge\n# TYPE dlq_active gauge\ndlq_active ${dlq.active}\n`;
    out += `# HELP dlq_replayed Replayed DLQ entries gauge\n# TYPE dlq_replayed gauge\ndlq_replayed ${dlq.replayed}\n`;

    // Scheduler
    out += `# HELP scheduler_promoted_total Total promoted jobs counter\n# TYPE scheduler_promoted_total counter\nscheduler_promoted_total ${scheduler.promotionCount}\n`;
    out += `# HELP scheduler_empty_scans_total Total empty scans counter\n# TYPE scheduler_empty_scans_total counter\nscheduler_empty_scans_total ${scheduler.emptyScans}\n`;
    out += `# HELP scheduler_last_batch_size Last batch size gauge\n# TYPE scheduler_last_batch_size gauge\nscheduler_last_batch_size ${scheduler.batchSizes}\n`;
    out += `# HELP scheduler_promotion_latency_ms Last promotion latency gauge\n# TYPE scheduler_promotion_latency_ms gauge\nscheduler_promotion_latency_ms ${scheduler.promotionLatency}\n`;

    // Execution
    out += `# HELP execution_average_runtime_ms Average runtime gauge\n# TYPE execution_average_runtime_ms gauge\nexecution_average_runtime_ms ${execution.averageRuntime}\n`;
    out += `# HELP execution_p50_runtime_ms P50 runtime gauge\n# TYPE execution_p50_runtime_ms gauge\nexecution_p50_runtime_ms ${execution.p50}\n`;
    out += `# HELP execution_p95_runtime_ms P95 runtime gauge\n# TYPE execution_p95_runtime_ms gauge\nexecution_p95_runtime_ms ${execution.p95}\n`;
    out += `# HELP execution_p99_runtime_ms P99 runtime gauge\n# TYPE execution_p99_runtime_ms gauge\nexecution_p99_runtime_ms ${execution.p99}\n`;

    // Heartbeats
    out += `# HELP heartbeats_renewal_rate Heartbeat renewal counter\n# TYPE heartbeats_renewal_rate counter\nheartbeats_renewal_rate ${system.heartbeatRenewalRate}\n`;
    out += `# HELP leases_expired Leases expired gauge\n# TYPE leases_expired gauge\nleases_expired ${system.expiredLeases}\n`;

    // System
    out += `# HELP system_uptime_seconds Uptime counter\n# TYPE system_uptime_seconds counter\nsystem_uptime_seconds ${system.uptime}\n`;
    out += `# HELP system_memory_rss_bytes RSS memory usage gauge\n# TYPE system_memory_rss_bytes gauge\nsystem_memory_rss_bytes ${system.memory.rss}\n`;
    out += `# HELP system_database_latency_ms Database latency gauge\n# TYPE system_database_latency_ms gauge\nsystem_database_latency_ms ${system.databaseLatency}\n`;
    out += `# HELP system_redis_latency_ms Redis latency gauge\n# TYPE system_redis_latency_ms gauge\nsystem_redis_latency_ms ${system.redisLatency}\n`;

    return out;
  }
}
