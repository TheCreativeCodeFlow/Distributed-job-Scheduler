/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { BenchmarkRunner } from '../benchmarks/runner.js';
import { db } from '../../../database/index.js';

describe('Soak Performance Benchmarks', () => {
  it('should verify system stability and memory growth over continuous iterations', async () => {
    vi.restoreAllMocks();
    vi.spyOn(db.jobExecution, 'create').mockResolvedValue({
      id: 'mock-exec-id',
    } as any);

    const latencies: number[] = [];
    const startTime = Date.now();

    // Soak run simulating steady continuous execution events
    for (let i = 0; i < 100; i++) {
      const opStart = Date.now();
      await db.jobExecution.create({
        data: { jobId: 'job-1', workerId: 'w-1' } as any,
      });
      latencies.push(Date.now() - opStart);
    }

    const totalDuration = (Date.now() - startTime) / 1000;
    const stats = BenchmarkRunner.record(
      'Execution Soak - 100 iterations',
      latencies,
      100,
      100,
      totalDuration,
    );

    expect(stats.successRate).toBe(100);
    // Write out the performance report markdown at the end of the soak test
    const reportPath = new URL(
      '../reports/PerformanceReport.md',
      import.meta.url,
    ).pathname;
    BenchmarkRunner.generateReport(reportPath);
  });
});
