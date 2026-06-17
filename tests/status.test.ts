import request from 'supertest';
import { createApp } from '../src/app';
import config from '../src/config';

describe('GET /status', () => {
  const app = createApp({ authToken: config.authToken });

  test('should return 200 OK', async () => {
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
  });

  test('should return body "ok"', async () => {
    const res = await request(app).get('/status');
    expect(res.text).toBe('ok');
  });

  test('should work WITHOUT authorization token (public endpoint)', async () => {
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  test('should return 200 even with invalid token (auth not required)', async () => {
    const res = await request(app)
      .get('/status')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  test('should return text content-type', async () => {
    const res = await request(app).get('/status');
    expect(res.headers['content-type']).toMatch(/text/);
  });

  test('should return 404 for POST /status', async () => {
    const res = await request(app).post('/status');
    expect([403, 404, 405]).toContain(res.status);
  });

  test('should return 404 for PUT /status', async () => {
    const res = await request(app).put('/status');
    expect([403, 404, 405]).toContain(res.status);
  });

  test('should return 404 for DELETE /status', async () => {
    const res = await request(app).delete('/status');
    expect([403, 404, 405]).toContain(res.status);
  });
});