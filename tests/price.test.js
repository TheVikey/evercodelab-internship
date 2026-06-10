const http = require('http');
const express = require('express');
const Database = require('better-sqlite3');
const CurrencyRepository = require('../src/repositories/CurrencyRepository');
const PriceRepository = require('../src/repositories/PriceRepository');
const createAuthMiddleware = require('../src/middleware/auth');
const setupPriceRoute = require('../src/routes/routes_price');
const jwt = require('jsonwebtoken');

describe('GET /price', () => {
  let server;
  let db;
  let currencyRepo;
  let priceRepo;
  let priceStore;

  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const VALID_TOKEN = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });
  const authHeaders = { Authorization: `Bearer ${VALID_TOKEN}` };

  beforeAll((done) => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    currencyRepo = new CurrencyRepository(db);
    priceRepo = new PriceRepository(db);

    priceStore = {
      getPricesByTicker: (ticker) => priceRepo.getByTicker(ticker),
      updatePrices: (prices) => priceRepo.updatePrices(prices),
      clearPrices: () => priceRepo.clear()
    };

    const currencyStore = {
      getCurrencies: () => currencyRepo.getAll(),
      getCurrencyByTicker: (ticker) => currencyRepo.getByTicker(ticker)
    };

    const app = express();
    app.use(express.json());

    const authMiddleware = createAuthMiddleware(JWT_SECRET);
    app.use(authMiddleware);

    setupPriceRoute(app, currencyStore, priceStore);

    app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: err.message,
        timestamp: err.timestamp || new Date().toISOString()
      });
    });

    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(() => {
      db.close();
      done();
    });
  });

  beforeEach(() => {
    currencyRepo.reset();
    priceRepo.clear();

    currencyRepo.create({ name: 'Bitcoin', ticker: 'BTC' });
    currencyRepo.create({ name: 'Ethereum', ticker: 'ETH' });

    priceRepo.updatePrices([
      { symbol: 'BTCUSDT', price: '61200.00' },
      { symbol: 'ETHBTC', price: '0.052' },
      { symbol: 'ETHUSDT', price: '3100.00' },
      { symbol: 'DOGEUSDT', price: '0.12' }
    ]);
  });

  test('should return 400 if currency is missing', async () => {
    const res = await httpRequest(server, '/price', { headers: authHeaders });
    expect(res.statusCode).toBe(400);
    expect(res.data.error).toContain('currency');
  });

  test('should return 404 if currency not in DB', async () => {
    const res = await httpRequest(server, '/price?currency=SOL', {
      headers: authHeaders
    });
    expect(res.statusCode).toBe(404);
    expect(res.data.error).toContain('SOL');
  });

  test('should return prices from local DB filtered by ticker', async () => {
    const res = await httpRequest(server, '/price?currency=BTC', {
      headers: authHeaders
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.data.map(p => p.symbol).sort()).toEqual(['BTCUSDT', 'ETHBTC']);
  });

  test('should return 404 if no prices exist for existing currency', async () => {
    priceRepo.clear();

    const res = await httpRequest(server, '/price?currency=BTC', {
      headers: authHeaders
    });
    expect(res.statusCode).toBe(404);
    expect(res.data.error).toContain('No prices found');
  });

  test('should return prices with updated_at field', async () => {
    const res = await httpRequest(server, '/price?currency=BTC', {
      headers: authHeaders
    });
    expect(res.statusCode).toBe(200);
    expect(res.data[0]).toHaveProperty('updated_at');
  });
});

function httpRequest(server, path, options = {}) {
  const port = server.address().port;
  const { method = 'GET', headers = {}, body } = options;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json', ...headers }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              data: data ? JSON.parse(data) : ''
            });
          } catch {
            resolve({ statusCode: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}