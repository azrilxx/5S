import { beforeAll, afterAll } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.BCRYPT_ROUNDS = '4'; // Faster for tests
process.env.PORT = '0'; // Random port
process.env.HOST = '127.0.0.1';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // Higher limit for tests
process.env.LOGIN_RATE_LIMIT_MAX = '100'; // Higher limit for tests
process.env.HELMET_ENABLED = 'false'; // Disable for easier testing
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

beforeAll(async () => {
  // Global test setup
  console.log('🧪 Test environment initialized');
});

afterAll(async () => {
  // Global test cleanup
  console.log('🧪 Test environment cleaned up');
});