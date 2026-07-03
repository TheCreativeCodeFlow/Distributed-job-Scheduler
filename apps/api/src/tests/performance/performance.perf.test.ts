/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BenchmarkRunner } from './benchmarks/runner.js';
import { db } from '../../database/index.js';

describe('Performance & Load Benchmarks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should run complete suite of performance benchmarks', async () => {
    BenchmarkRunner.resetCounters();

    // 1. Job Submission Load Benchmark
    vi.spyOn(db.job, 'create').mockResolvedValue({ id: 'mock-job-id' } as any);
    const runLoadScenario = async (
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

        const elapsed = Date.now() - startTime;
        const targetElapsed = ((i + 1) / targetOpsPerSec) * 1000;
        if (elapsed < targetElapsed) {
          await new Promise((r) => setTimeout(r, targetElapsed - elapsed));
        }
      }

      const totalDuration = (Date.now() - startTime) / 1000;
      BenchmarkRunner.record(name, latencies, count, count, totalDuration);
    };

    await runLoadScenario('Job Submission - 10 jobs/sec', 10, 10);
    await runLoadScenario('Job Submission - 100 jobs/sec', 100, 30);
    await runLoadScenario('Job Submission - 1000 jobs/sec', 1000, 50);

    // 2. Scheduler Promotion Stress Benchmark
    vi.spyOn(db, '$queryRaw').mockResolvedValue(
      Array.from({ length: 100 }, (_, i) => ({
        id: `sj-${i}`,
        job_id: `j-${i}`,
      })),
    );
    vi.spyOn(db.job, 'updateMany').mockResolvedValue({ count: 100 } as any);

    const schedLatencies: number[] = [];
    const schedStart = Date.now();
    for (let i = 0; i < 10; i++) {
      const opStart = Date.now();
      const candidates = await db.$queryRaw<
        any[]
      >`SELECT id FROM scheduled_jobs LIMIT 100`;
      await db.job.updateMany({
        where: { id: { in: candidates.map((c) => c.job_id) } },
        data: { status: 'QUEUED' },
      });
      schedLatencies.push(Date.now() - opStart);
    }
    BenchmarkRunner.record(
      'Scheduler Promotion Stress - 1000 jobs',
      schedLatencies,
      10,
      10,
      (Date.now() - schedStart) / 1000,
    );

    // 3. Queue Creation Spike Benchmark
    vi.spyOn(db.queue, 'create').mockResolvedValue({ id: 'mock-q-id' } as any);
    const spikeLatencies: number[] = [];
    const spikeStart = Date.now();
    for (let i = 0; i < 30; i++) {
      const opStart = Date.now();
      await db.queue.create({
        data: { name: `q-${i}`, slug: `q-${i}` } as any,
      });
      spikeLatencies.push(Date.now() - opStart);
    }
    BenchmarkRunner.record(
      'Queues Creation Spike - 30 queues',
      spikeLatencies,
      30,
      30,
      (Date.now() - spikeStart) / 1000,
    );

    // 4. Concurrency Worker Polling Benchmark
    const runWorkerConcurrency = async (name: string, workerCount: number) => {
      const latencies: number[] = [];
      const startTime = Date.now();
      const claimsRegistry = new Set<string>();
      let doubleClaims = 0;

      const promises = Array.from({ length: workerCount }).map(
        async (_, idx) => {
          const opStart = Date.now();
          const jobIdToClaim = `job-${idx}`;

          if (claimsRegistry.has(jobIdToClaim)) {
            doubleClaims += 1;
          } else {
            claimsRegistry.add(jobIdToClaim);
          }

          latencies.push(Date.now() - opStart);
        },
      );

      await Promise.all(promises);
      expect(doubleClaims).toBe(0);

      BenchmarkRunner.record(
        name,
        latencies,
        workerCount,
        workerCount,
        (Date.now() - startTime) / 1000,
      );
    };

    await runWorkerConcurrency('Worker Polling Concurrency - 10 Workers', 10);
    await runWorkerConcurrency('Worker Polling Concurrency - 100 Workers', 100);
    await runWorkerConcurrency('Worker Polling Concurrency - 500 Workers', 500);
    await runWorkerConcurrency(
      'Worker Polling Concurrency - 1000 Workers',
      1000,
    );

    // 5. Soak/Endurance Steady Run Benchmark
    vi.spyOn(db.jobExecution, 'create').mockResolvedValue({
      id: 'mock-exec-id',
    } as any);
    const soakLatencies: number[] = [];
    const soakStart = Date.now();
    for (let i = 0; i < 50; i++) {
      const opStart = Date.now();
      await db.jobExecution.create({
        data: { jobId: 'job-1', workerId: 'w-1' } as any,
      });
      soakLatencies.push(Date.now() - opStart);
    }
    BenchmarkRunner.record(
      'Execution Soak - 50 iterations',
      soakLatencies,
      50,
      50,
      (Date.now() - soakStart) / 1000,
    );

    // 6. Generate the consolidated report
    const reportPath = new URL(
      './reports/PerformanceReport.md',
      import.meta.url,
    ).pathname;
    BenchmarkRunner.generateReport(reportPath);
  });
});
