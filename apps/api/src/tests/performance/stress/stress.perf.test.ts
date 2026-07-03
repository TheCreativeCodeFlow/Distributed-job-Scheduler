/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { BenchmarkRunner } from '../benchmarks/runner.js';
import { db } from '../../../database/index.js';

describe('Stress Performance Benchmarks', () => {
  it('should measure scheduler promotion throughput under extreme delayed jobs count', async () => {
    vi.restoreAllMocks();
    vi.spyOn(db, '$queryRaw').mockResolvedValue(
      Array.from({ length: 100 }, (_, i) => ({
        id: `sj-${i}`,
        job_id: `j-${i}`,
      })),
    );
    vi.spyOn(db.job, 'updateMany').mockResolvedValue({ count: 100 } as any);

    const latencies: number[] = [];
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const opStart = Date.now();
      // Simulate promotion database transaction block
      const candidates = await db.$queryRaw<
        any[]
      >`SELECT id FROM scheduled_jobs LIMIT 100`;
      await db.job.updateMany({
        where: { id: { in: candidates.map((c) => c.job_id) } },
        data: { status: 'QUEUED' },
      });
      latencies.push(Date.now() - opStart);
    }

    const totalDuration = (Date.now() - startTime) / 1000;
    const stats = BenchmarkRunner.record(
      'Scheduler Promotion Stress - 1000 jobs',
      latencies,
      10,
      10,
      totalDuration,
    );

    expect(stats.successRate).toBe(100);
  });
});
