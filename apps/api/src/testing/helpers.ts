import { vi } from 'vitest';
import { Database } from '../database/index.js';
import { RedisService } from '../redis/index.js';

// Mock implementation of Database helpers
export const mockDatabaseHealth = (
  ok: boolean,
  latencyMs?: number,
  error?: string,
) => {
  const mockResult: { ok: boolean; latencyMs?: number; error?: string } = {
    ok,
  };
  if (latencyMs !== undefined) {
    mockResult.latencyMs = latencyMs;
  }
  if (error !== undefined) {
    mockResult.error = error;
  }

  vi.spyOn(Database, 'checkHealth').mockResolvedValue(mockResult);
};

// Mock implementation of Redis helpers
export const mockRedisHealth = (
  ok: boolean,
  latencyMs?: number,
  error?: string,
) => {
  const mockResult: { ok: boolean; latencyMs?: number; error?: string } = {
    ok,
  };
  if (latencyMs !== undefined) {
    mockResult.latencyMs = latencyMs;
  }
  if (error !== undefined) {
    mockResult.error = error;
  }

  vi.spyOn(RedisService, 'checkHealth').mockResolvedValue(mockResult);
};
