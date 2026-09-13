// backend/tests/integration/auth.test.js
import request from 'supertest';
import app from '../../src/app.js';

// ✅ اختبارات بسيطة جداً - فقط الصحية والـ 404
describe('Auth API - Simple Tests', () => {
  it('should return 404 for unknown route', async () => {
    const response = await request(app)
      .get('/api/unknown-route');

    expect(response.status).toBe(404);
  });

  it('should return health check', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });
});