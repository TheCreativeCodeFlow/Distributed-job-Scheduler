import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { UserRepository, UserWithMemberships } from '../repositories/user.js';
import { PasswordService } from '../services/password.js';
import { requireRoles } from '../middleware/rbac.js';
import { Request, Response, NextFunction } from 'express';

vi.mock('../repositories/user.js');

describe('Authentication Module Integrations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should successfully register a new user and return user payload', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'test@domain.com',
        name: 'Developer Name',
        passwordHash: 'hashed-pass',
        memberships: [],
      };

      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(UserRepository, 'create').mockResolvedValue(
        mockUser as unknown as UserWithMemberships,
      );

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@domain.com',
        name: 'Developer Name',
        password: 'SecurePass123',
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id', 'user-id-123');
      expect(res.body.user).toHaveProperty('email', 'test@domain.com');
    });

    it('should return validation error if email format is invalid', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email',
        name: 'Developer Name',
        password: 'SecurePass123',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('title', 'Validation Error');
    });
  });

  describe('POST /auth/login', () => {
    it('should successfully log in user and return access token', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'test@domain.com',
        name: 'Developer Name',
        passwordHash: 'hashed-pass',
        memberships: [{ role: 'DEVELOPER' }],
      };

      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(
        mockUser as unknown as UserWithMemberships,
      );
      vi.spyOn(PasswordService, 'verify').mockResolvedValue(true);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@domain.com',
        password: 'SecurePass123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return unauthorized error on invalid password', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'test@domain.com',
        name: 'Developer Name',
        passwordHash: 'hashed-pass',
        memberships: [],
      };

      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(
        mockUser as unknown as UserWithMemberships,
      );
      vi.spyOn(PasswordService, 'verify').mockResolvedValue(false);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@domain.com',
        password: 'WrongPassword123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Role-Based Access Control Middleware', () => {
    it('should permit action if user role matches permitted list', () => {
      const req = {
        user: { id: 'u-1', email: 'e', role: 'DEVELOPER' },
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = requireRoles('DEVELOPER', 'ORG_OWNER');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should block request if user role does not match permitted list', () => {
      const req = {
        user: { id: 'u-1', email: 'e', role: 'READ_ONLY' },
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = requireRoles('DEVELOPER', 'ORG_OWNER');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
