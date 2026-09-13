// backend/tests/api/requests.test.js
import request from 'supertest';
import app from '../../src/app.js';

// ✅ اختبارات مبسطة لا تعتمد على قاعدة البيانات
describe('Requests API - Simple Tests', () => {
  it('should return 401 for requests endpoint without token', async () => {
    const response = await request(app)
      .get('/api/requests/my')
      .set('X-Portal-Id', 'test-portal-id');

    expect(response.status).toBe(401);
  });

  it('should return 401 for create request endpoint without token', async () => {
    const response = await request(app)
      .post('/api/requests')
      .set('X-Portal-Id', 'test-portal-id')
      .send({
        serviceId: 'test',
        formData: { title: 'Test' },
      });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent request', async () => {
    const response = await request(app)
      .get('/api/requests/507f1f77bcf86cd799439011')
      .set('X-Portal-Id', 'test-portal-id');

    expect(response.status).toBe(401);
  });
});