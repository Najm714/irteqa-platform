// backend/tests/unit/middleware/auth.test.js
import request from 'supertest';
import app from '../../../src/app.js';

describe('Auth Middleware - Simple Test', () => {
  it('should return 401 if no token provided', async () => {
    const response = await request(app)
      .get('/api/requests/my')
      .set('X-Portal-Id', 'test-portal-id');

    expect(response.status).toBe(401);
  });

  it('should return 401 if token is invalid', async () => {
    const response = await request(app)
      .get('/api/requests/my')
      .set('Authorization', 'Bearer invalidtoken')
      .set('X-Portal-Id', 'test-portal-id');

    expect(response.status).toBe(401);
  });

  it('should allow access to health check', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
  });
});