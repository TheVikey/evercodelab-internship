import request from 'supertest';
import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

import { CurrencyRepository } from '../src/repositories/CurrencyRepository';
import { PriceHistoryRepository } from '../src/repositories/PriceHistoryRepository';
import { createAuthMiddleware } from '../src/middleware/auth';
import { setupPriceRoute } from '../src/routes/RoutesPrice';
import type { CurrencyStore, PriceStore, PriceHistoryStore } from '../src/types';

describe('GET /price/:ticker/history', () => {
  let app: express.Application;
  let db: Database.Database;
  let currencyRepo: CurrencyRepository;
  let priceHistoryRepo: PriceHistoryRepository;

  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const validToken = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});

    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    currencyRepo = new CurrencyRepository(db);
    priceHistoryRepo = new PriceHistoryRepository(db);

    const currencyStore: CurrencyStore = {
      getCurrencies: () => currencyRepo.getAll(),
      getCurrencyById: (id) => currencyRepo.getById(id),
      getCurrencyByTicker: (ticker) => currencyRepo.getByTicker(ticker),
      addCurrency: (data) => currencyRepo.create(data),
      updateCurrency: (id, data) => currencyRepo.update(id, data),
      deleteCurrency: (id) => currencyRepo.delete(id),
      reset: () => currencyRepo.reset()
    };

    const priceStore: PriceStore = {
      getAllPrices: () => [],
      getPricesByTicker: () => [],
      updatePrices: () => 0,
      clearPrices: () => {}
    };

    const priceHistoryStore: PriceHistoryStore = {
      getPriceHistory: (symbol, interval, limit) =>
        priceHistoryRepo.getPriceHistory(symbol, interval, limit),
      updatePriceHistory: (histories) =>
        priceHistoryRepo.updatePriceHistory(histories),
      clear: () => priceHistoryRepo.clear()
    };

    app = express();
    app.use(express.json());
    app.use(createAuthMiddleware(JWT_SECRET));
    setupPriceRoute(app, currencyStore, priceStore, priceHistoryStore);

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

  beforeEach(() => {
    currencyRepo.reset();
    priceHistoryRepo.clear();

    currencyRepo.create({ name: 'Bitcoin', ticker: 'BTC' });

    priceHistoryRepo.updatePriceHistory([
      { symbol: 'BTCUSDT', price: '61000.00', interval: '1h', timestamp: 1700000000000 },
      { symbol: 'BTCUSDT', price: '61200.00', interval: '1h', timestamp: 1700003600000 },
      { symbol: 'BTCUSDT', price: '61500.00', interval: '1h', timestamp: 1700007200000 },
      { symbol: 'BTCUSDT', price: '61800.00', interval: '5m', timestamp: 1700000000000 }
    ]);
  });

  test('should return price history for ticker', async () => {
    const res = await request(app)
      .get('/price/BTC/history?interval=1h')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
  });

  test('should use default interval 1h if not specified', async () => {
    const res = await request(app)
      .get('/price/BTC/history')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  test('should return 404 for non-existent currency', async () => {
    const res = await request(app)
      .get('/price/SOL/history')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('SOL');
  });

  test('should return 400 for invalid interval', async () => {
    const res = await request(app)
      .get('/price/BTC/history?interval=invalid')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid interval');
  });

  test('should return 400 for invalid limit', async () => {
    const res = await request(app)
      .get('/price/BTC/history?limit=-1')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
  });

  test('should return 404 if no history exists for interval', async () => {
    const res = await request(app)
      .get('/price/BTC/history?interval=1d')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  test('should return 403 without authorization', async () => {
    const res = await request(app).get('/price/BTC/history');
    expect(res.status).toBe(403);
  });
});