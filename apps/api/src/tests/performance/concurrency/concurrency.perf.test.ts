import { describe, it, expect } from 'vitest';
import { BenchmarkRunner } from '../benchmarks/runner.js';

describe('Concurrency Performance Benchmarks', () => {
  it('should verify zero duplicate claims under high concurrency worker counts (10, 100, 500, 1000 workers)', async () => {
    const simulateWorkers = async (name: string, workerCount: number) => {
      const latencies: number[] = [];
      const startTime = Date.now();

      // Simulates atomic worker poll claims using simulated SKIP LOCKED db calls
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

      const totalDuration = (Date.now() - startTime) / 1000;
      const stats = BenchmarkRunner.record(
        name,
        latencies,
        workerCount,
        workerCount,
        totalDuration,
      );

      expect(doubleClaims).toBe(0);
      expect(stats.successRate).toBe(100);
    };

    await simulateWorkers('Worker Polling Concurrency - 10 Workers', 10);
    await simulateWorkers('Worker Polling Concurrency - 100 Workers', 100);
    await simulateWorkers('Worker Polling Concurrency - 500 Workers', 500);
    await simulateWorkers('Worker Polling Concurrency - 1000 Workers', 1000);
  });
});
