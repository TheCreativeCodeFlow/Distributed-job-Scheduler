/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { BenchmarkRunner } from '../benchmarks/runner.js';
import { db } from '../../../database/index.js';

describe('Spike Performance Benchmarks', () => {
  it('should measure response latencies during sudden extreme queues creation spikes', async () => {
    vi.restoreAllMocks();
    vi.spyOn(db.queue, 'create').mockResolvedValue({ id: 'mock-q-id' } as any);

    const latencies: number[] = [];
    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
      const opStart = Date.now();
      await db.queue.create({
        data: { name: `q-${i}`, slug: `q-${i}` } as any,
      });
      latencies.push(Date.now() - opStart);
    }

    const totalDuration = (Date.now() - startTime) / 1000;
    const stats = BenchmarkRunner.record(
      'Queues Creation Spike - 50 queues',
      latencies,
      50,
      50,
      totalDuration,
    );

    expect(stats.successRate).toBe(100);
  });
});
