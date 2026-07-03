/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../../app.js';
import { UserRepository, UserWithMemberships } from '../repositories/user.js';
import { PasswordService } from '../services/password.js';
import { TokenBlocklist } from '../services/token-blocklist.js';
import { RedisService } from '../../../redis/index.js';

vi.mock('../repositories/user.js');
vi.mock('../services/token-blocklist.js');

const TEST_SECRET = 'test-secret-key-123';

// Helper: generate a valid test token
const makeToken = (
  payload: object,
  secret = TEST_SECRET,
  opts: jwt.SignOptions = {},
) => jwt.sign(payload, secret, { algorithm: 'HS256', ...opts });

describe('Security Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Stub Redis so rate-limit and blocklist work in unit tests
    vi.spyOn(RedisService, 'getInstance').mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      ping: vi.fn().mockResolvedValue('PONG'),
    } as any);

    vi.spyOn(TokenBlocklist, 'isBlocked').mockResolvedValue(false);
    vi.spyOn(TokenBlocklist, 'add').mockResolvedValue(undefined);

    // Mock UserRepository globally in tests to avoid DB access and null-crashes
    vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(null);
    vi.spyOn(UserRepository, 'create').mockResolvedValue({
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User',
      passwordHash: 'mock-hash',
      memberships: [],
    } as any);
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  JWT / Authentication Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('JWT Validation', () => {
    it('should reject request with no Authorization header — 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject malformed JWT (random string) — 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not.a.jwt');
      expect(res.status).toBe(401);
    });

    it('should reject expired JWT — 401', async () => {
      const expired = makeToken(
        {
          sub: 'user-1',
          email: 'a@b.com',
          role: 'DEVELOPER',
          jti: 'test-jti',
          iss: 'distributed-job-scheduler',
          aud: 'distributed-job-scheduler-api',
        },
        TEST_SECRET,
        { expiresIn: -1 }, // expired 1 second ago
      );
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expired}`);
      expect(res.status).toBe(401);
      expect(res.body.detail).toMatch(/expired/i);
    });

    it('should reject JWT signed with wrong secret — 401', async () => {
      const wrongSecret = makeToken(
        {
          sub: 'user-1',
          email: 'a@b.com',
          role: 'DEVELOPER',
          jti: 'jti',
          iss: 'distributed-job-scheduler',
          aud: 'distributed-job-scheduler-api',
        },
        'completely-wrong-secret-that-is-long-enough',
      );
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${wrongSecret}`);
      expect(res.status).toBe(401);
    });

    it('should reject JWT with alg:none attack — 401', async () => {
      // Manually construct an unsigned token header
      const header = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' }),
      ).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          sub: 'user-1',
          email: 'a@b.com',
          role: 'DEVELOPER',
          jti: 'x',
          iss: 'distributed-job-scheduler',
          aud: 'distributed-job-scheduler-api',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${noneToken}`);
      expect(res.status).toBe(401);
    });

    it('should accept valid JWT — 200', async () => {
      // Build a token that passes iss/aud checks (test uses HS256 with test secret)
      const validToken = makeToken(
        {
          sub: 'user-1',
          email: 'a@b.com',
          role: 'DEVELOPER',
          jti: 'valid-jti',
          iss: 'distributed-job-scheduler',
          aud: 'distributed-job-scheduler-api',
        },
        TEST_SECRET,
        { expiresIn: '15m' },
      );
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('id', 'user-1');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  Input Validation / Payload Security
  // ─────────────────────────────────────────────────────────────────────────

  describe('Input Validation', () => {
    it('should reject oversized JSON body — 413', async () => {
      const largePayload = 'a'.repeat(200 * 1024); // 200 KB — over the 100kb limit
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(`{"email":"a@b.com","password":"${largePayload}"}`);
      expect(res.status).toBe(413);
    });

    it('should reject password over 72 characters on registration — 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'A1' + 'a'.repeat(72), // 74 chars
        });
      expect(res.status).toBe(400);
      expect(res.body.title).toBe('Validation Error');
    });

    it('should strip prototype pollution keys from body', async () => {
      // If prototype pollution prevention works, __proto__ should be stripped
      // and the request should proceed to validation (or fail validation, not cause prototype pollution)
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'bad@example.com',
          password: 'Test123!',
          __proto__: { isAdmin: true },
          constructor: { prototype: { isAdmin: true } },
        });
      // Should not get a 500 (no prototype pollution crash); validation may fail (400)
      expect(res.status).not.toBe(500);
      // The injected keys should not pollute Object.prototype
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });

    it('should reject invalid email format — 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'ValidPass1' });
      expect(res.status).toBe(400);
    });

    it('should reject password shorter than 8 chars — 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'a@b.com', password: 'Ab1' });
      expect(res.status).toBe(400);
    });

    it('should reject password without uppercase — 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'a@b.com', password: 'password1' });
      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  Security Headers
  // ─────────────────────────────────────────────────────────────────────────

  describe('Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const res = await request(app).get('/live');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const res = await request(app).get('/live');
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('should include Content-Security-Policy header', async () => {
      const res = await request(app).get('/live');
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('should include Strict-Transport-Security header', async () => {
      const res = await request(app).get('/live');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  Refresh Token Blocklist / Replay Attack Prevention
  // ─────────────────────────────────────────────────────────────────────────

  describe('Refresh Token Security', () => {
    it('should reject a blocklisted refresh token — 401', async () => {
      // Simulate a token that was already rotated and is now in the blocklist
      vi.spyOn(TokenBlocklist, 'isBlocked').mockResolvedValue(true);

      const mockUser = {
        id: 'user-id-123',
        email: 'test@domain.com',
        name: 'Dev',
        passwordHash: 'hash',
        memberships: [{ role: 'DEVELOPER' }],
      };

      vi.spyOn(UserRepository, 'findById').mockResolvedValue(
        mockUser as unknown as UserWithMemberships,
      );

      const refreshToken = makeToken(
        {
          sub: 'user-id-123',
          email: 'test@domain.com',
          role: 'DEVELOPER',
          jti: 'already-rotated-jti',
          iss: 'distributed-job-scheduler',
          aud: 'distributed-job-scheduler-api',
        },
        TEST_SECRET,
        { expiresIn: '7d' },
      );

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(401);
      expect(res.body.detail).toMatch(/already been used/i);
    });

    it('should successfully rotate refresh token when not blocked — 200', async () => {
      vi.spyOn(TokenBlocklist, 'isBlocked').mockResolvedValue(false);

      const mockUser = {
        id: 'user-id-123',
        email: 'test@domain.com',
        name: 'Dev',
        passwordHash: 'hash',
        memberships: [{ role: 'DEVELOPER' }],
      };

      vi.spyOn(UserRepository, 'findById').mockResolvedValue(
        mockUser as unknown as UserWithMemberships,
      );

      const refreshToken = makeToken(
        {
          sub: 'user-id-123',
          email: 'test@domain.com',
          role: 'DEVELOPER',
          jti: 'fresh-jti',
          iss: 'distributed-job-scheduler',
          aud: 'distributed-job-scheduler-api',
        },
        TEST_SECRET,
        { expiresIn: '7d' },
      );

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  RBAC / Authorization
  // ─────────────────────────────────────────────────────────────────────────

  describe('RBAC — Privilege Escalation', () => {
    const makeAuthToken = (role: string) =>
      makeToken(
        {
          sub: 'user-1',
          email: 'a@b.com',
          role,
          jti: `jti-${role}`,
          iss: 'distributed-job-scheduler',
          aud: 'distributed-job-scheduler-api',
        },
        TEST_SECRET,
        { expiresIn: '15m' },
      );

    it('should allow DEVELOPER role to access own profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${makeAuthToken('DEVELOPER')}`);
      expect(res.status).toBe(200);
    });

    it('should return 401 for unauthenticated access to protected endpoints', async () => {
      // Accessing a queue requires auth
      const res = await request(app).get('/api/v1/queues/some-id');
      expect(res.status).toBe(401);
    });

    it('should return 401 for missing auth on workers endpoint', async () => {
      const res = await request(app).get('/api/v1/workers');
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  Login Registration — User Enumeration Check
  // ─────────────────────────────────────────────────────────────────────────

  describe('User Enumeration Prevention', () => {
    it('should return identical 401 for non-existent user and wrong password', async () => {
      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(null);

      const resNonExistent = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'Password1' });

      const mockUser = {
        id: 'u-1',
        email: 'exists@domain.com',
        name: 'User',
        passwordHash: 'hash',
        memberships: [],
      };
      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(
        mockUser as unknown as UserWithMemberships,
      );
      vi.spyOn(PasswordService, 'verify').mockResolvedValue(false);

      const resWrongPw = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'exists@domain.com', password: 'WrongPass1' });

      expect(resNonExistent.status).toBe(401);
      expect(resWrongPw.status).toBe(401);
      // Both return identical error messages — no user enumeration
      expect(resNonExistent.body.detail).toBe(resWrongPw.body.detail);
    });
  });
});
