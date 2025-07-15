import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';
import { storage } from '../storage.js';
import { TokenService } from '../middleware/auth.js';
import type { Express } from 'express';

describe('Authentication API', () => {
  let app: Express;

  beforeEach(async () => {
    app = createApp();
    // Reset storage for each test
    (storage as any).users.clear();
    (storage as any).currentUserIds = 1;
    await (storage as any).initializeData();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        username: 'admin',
        role: 'admin'
      });
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'auditor'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'auditor'
      });
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject duplicate username', async () => {
      const userData = {
        username: 'admin',  // Already exists
        password: 'TestPass123',
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT_ERROR');
    });

    it('should reject weak password', async () => {
      const userData = {
        username: 'testuser',
        password: 'weak',
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123',
        name: 'Test User',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get a refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get an access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: 'admin',
        role: 'admin'
      });
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get an access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should change password with valid credentials', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'admin123',
          newPassword: 'NewPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify old password no longer works
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(oldLoginResponse.status).toBe(401);

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'NewPassword123'
        });

      expect(newLoginResponse.status).toBe(200);
    });

    it('should reject incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject weak new password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'admin123',
          newPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Token Service', () => {
    it('should generate and verify access tokens', () => {
      const payload = { id: 1, username: 'test', role: 'admin' };
      const token = TokenService.generateAccessToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = TokenService.verifyAccessToken(token);
      expect(decoded).toMatchObject({
        id: 1,
        username: 'test',
        role: 'admin',
        tokenType: 'access'
      });
    });

    it('should generate and verify refresh tokens', () => {
      const payload = { id: 1, username: 'test', role: 'admin' };
      const token = TokenService.generateRefreshToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = TokenService.verifyRefreshToken(token);
      expect(decoded).toMatchObject({
        id: 1,
        username: 'test',
        role: 'admin',
        tokenType: 'refresh'
      });
    });

    it('should reject access token as refresh token', () => {
      const payload = { id: 1, username: 'test', role: 'admin' };
      const accessToken = TokenService.generateAccessToken(payload);
      
      expect(() => {
        TokenService.verifyRefreshToken(accessToken);
      }).toThrow();
    });

    it('should reject refresh token as access token', () => {
      const payload = { id: 1, username: 'test', role: 'admin' };
      const refreshToken = TokenService.generateRefreshToken(payload);
      
      expect(() => {
        TokenService.verifyAccessToken(refreshToken);
      }).toThrow();
    });
  });
});