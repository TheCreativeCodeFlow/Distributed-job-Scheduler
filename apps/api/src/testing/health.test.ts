import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { mockDatabaseHealth, mockRedisHealth } from './helpers.js';

describe('Health Endpoints Integrations', () => {
  beforeAll(() => {
    // Setup environment variable expectations for testing
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  });

  it('should return UP status on GET /live', async () => {
    const res = await request(app).get('/live');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'UP');
  });

  it('should return READY status on GET /ready if all services are UP', async () => {
    mockDatabaseHealth(true);
    mockRedisHealth(true);

    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'READY');
  });

  it('should return 503 status on GET /ready if a service is DOWN', async () => {
    mockDatabaseHealth(false, 0, 'DB connection lost');
    mockRedisHealth(true);

    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status', 'NOT_READY');
  });
});
