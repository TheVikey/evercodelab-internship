import request from 'supertest';
import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

import { WalletRepository } from '../src/repositories/WalletRepository';
import { createAuthMiddleware } from '../src/middleware/auth';
import { setupWalletsRoute } from '../src/routes/RoutesWallets';
import type { WalletStore } from '../src/types';

describe('CRUD /wallets', () => {
  let app: express.Application;
  let db: Database.Database;
  let repo: WalletRepository;

  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const validToken = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});

    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new WalletRepository(db);

    const store: WalletStore = {
      getWallets: () => repo.getAll(),
      getWalletById: (id) => repo.getById(id),
      getWalletsByBlockchain: (blockchain) => repo.getByBlockchain(blockchain),
      addWallet: (data) => repo.create(data),
      updateWallet: (id, data) => repo.update(id, data),
      deleteWallet: (id) => repo.delete(id),
      updateBalance: (id, balance) => repo.updateBalance(id, balance),
      reset: () => repo.reset()
    };

    app = express();
    app.use(express.json());
    app.use(createAuthMiddleware(JWT_SECRET));
    setupWalletsRoute(app, store);

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({
        error: err.message,
        timestamp: err.timestamp || new Date().toISOString()
      });
    });
  });

  afterAll(() => {
    db.close();
    jest.restoreAllMocks();
  });

  beforeEach(() => repo.reset());

  // ── POST /wallets ──

  test('POST should create wallet and return 201', async () => {
    const res = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123', blockchain: 'bsc', label: 'Main Wallet' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(typeof res.body.id).toBe('number');
    expect(res.body.address).toBe('0x123');
    expect(res.body.blockchain).toBe('bsc');
    expect(res.body.label).toBe('Main Wallet');
  });

  test('POST should return 400 if address or blockchain is missing', async () => {
    const res = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST should return 400 for invalid blockchain', async () => {
    const res = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123', blockchain: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid blockchain');
  });

  test('POST should return 403 without authorization', async () => {
    const res = await request(app)
      .post('/wallets')
      .send({ address: '0x123', blockchain: 'bsc' });

    expect(res.status).toBe(403);
  });

  // ── GET /wallets ──

  test('GET should return all wallets', async () => {
    await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123', blockchain: 'bsc' });

    const res = await request(app)
      .get('/wallets')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  test('GET should return empty array when no wallets exist', async () => {
    const res = await request(app)
      .get('/wallets')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // ── GET /wallets/:id ──

  test('GET /wallets/:id should return wallet by id', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123', blockchain: 'bsc', label: 'Test' });

    const res = await request(app)
      .get(`/wallets/${created.body.id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.address).toBe('0x123');
    expect(res.body.blockchain).toBe('bsc');
    expect(res.body.label).toBe('Test');
  });

  test('GET /wallets/:id should return 404 for non-existent id', async () => {
    const res = await request(app)
      .get('/wallets/99999')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  test('GET /wallets/:id should return 400 for invalid id', async () => {
    const res = await request(app)
      .get('/wallets/abc')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
  });

  // ── PUT /wallets/:id ──

  test('PUT should update existing wallet', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123', blockchain: 'bsc', label: 'Old' });

    const res = await request(app)
      .put(`/wallets/${created.body.id}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ label: 'New', blockchain: 'eth' });

    expect(res.status).toBe(200);
    expect(res.body.label).toBe('New');
    expect(res.body.blockchain).toBe('eth');
    expect(res.body.address).toBe('0x123');
  });

  test('PUT should return 404 for non-existent id', async () => {
    const res = await request(app)
      .put('/wallets/99999')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ label: 'Ghost' });

    expect(res.status).toBe(404);
  });

  test('PUT should return 400 for invalid blockchain', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123', blockchain: 'bsc' });

    const res = await request(app)
      .put(`/wallets/${created.body.id}`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ blockchain: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid blockchain');
  });

  // ── DELETE /wallets/:id ──

  test('DELETE should remove wallet and return 204', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ address: '0x123', blockchain: 'bsc' });

    const res = await request(app)
      .delete(`/wallets/${created.body.id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(204);
  });

  test('DELETE should return 404 for non-existent id', async () => {
    const res = await request(app)
      .delete('/wallets/99999')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  // ── Auth ──

  test('should return 403 for invalid JWT', async () => {
    const res = await request(app)
      .post('/wallets')
      .set('Authorization', 'Bearer invalid.token.here')
      .send({ address: '0x123', blockchain: 'bsc' });

    expect(res.status).toBe(403);
  });
});