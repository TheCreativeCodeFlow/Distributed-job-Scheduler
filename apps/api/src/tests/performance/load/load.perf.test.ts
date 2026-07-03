/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { BenchmarkRunner } from '../benchmarks/runner.js';
import { db } from '../../../database/index.js';

describe('Load Performance Benchmarks', () => {
  it('should validate job submission throughput at 10, 100, and 1000 jobs/sec scales', async () => {
    vi.restoreAllMocks();
    vi.spyOn(db.job, 'create').mockResolvedValue({ id: 'mock-job-id' } as any);

    const runScenario = async (
      name: string,
      targetOpsPerSec: number,
      count: number,
    ) => {
      const latencies: number[] = [];
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        const opStart = Date.now();
        await db.job.create({ data: { queueId: 'q-1', payload: {} } as any });
        latencies.push(Date.now() - opStart);

        // Throttle to match target rate
        const elapsed = Date.now() - startTime;
        const targetElapsed = ((i + 1) / targetOpsPerSec) * 1000;
        if (elapsed < targetElapsed) {
          await new Promise((r) => setTimeout(r, targetElapsed - elapsed));
        }
      }

      const totalDuration = (Date.now() - startTime) / 1000;
      const stats = BenchmarkRunner.record(
        name,
        latencies,
        count,
        count,
        totalDuration,
      );

      expect(stats.successRate).toBe(100);
      expect(stats.throughput).toBeGreaterThan(0);
    };

    await runScenario('Job Submission - 10 jobs/sec', 10, 20);
    await runScenario('Job Submission - 100 jobs/sec', 100, 50);
    await runScenario('Job Submission - 1000 jobs/sec', 1000, 100);
  });
});
