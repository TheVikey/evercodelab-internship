jest.mock('../src/services/services_binanceClient');
const { fetchBinancePrices } = require('../src/services/services_binanceClient');
const http = require('http');
const express = require('express');
const Database = require('better-sqlite3');
const CurrencyRepository = require('../src/repositories/CurrencyRepository');
const createAuthMiddleware = require('../src/middleware/auth');
const setupPriceRoute = require('../src/routes/routes_price');
const jwt = require('jsonwebtoken');

describe('GET /price', () => {
  let server;
  let db;
  let repository;
  
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const VALID_TOKEN = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });
  const authHeaders = { Authorization: `Bearer ${VALID_TOKEN}` };

  beforeAll((done) => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    repository = new CurrencyRepository(db);
    
    const currencyStore = {
      getCurrencies: () => repository.getAll(),
      getCurrencyByTicker: (ticker) => repository.getByTicker(ticker),
      reset: () => repository.reset()
    };

    const app = express();
    app.use(express.json());
    
    const authMiddleware = createAuthMiddleware(JWT_SECRET);
    app.use(authMiddleware);
    
    setupPriceRoute(app, currencyStore);
    
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
    repository.reset();
    repository.create({ name: 'Bitcoin', ticker: 'BTC' });
    repository.create({ name: 'Ethereum', ticker: 'ETH' });
    fetchBinancePrices.mockClear();
  });

  test('should return 400 if currency is missing', async () => {
    const res = await httpRequest(server, '/price', { headers: authHeaders });
    expect(res.statusCode).toBe(400);
    expect(res.data.error).toContain('currency');
  });

  test('should return 404 if currency not in DB', async () => {
    const res = await httpRequest(server, '/price?currency=SOL', { headers: authHeaders });
    expect(res.statusCode).toBe(404);
    expect(res.data.error).toContain('SOL');
  });

  test('should fetch Binance prices and filter by ticker', async () => {
    fetchBinancePrices.mockResolvedValue([
      { symbol: 'BTCUSDT', price: '61200.00' },
      { symbol: 'ETHBTC', price: '0.052' },
      { symbol: 'ETHUSDT', price: '3100.00' },
      { symbol: 'DOGEUSDT', price: '0.12' }
    ]);

    const res = await httpRequest(server, '/price?currency=BTC', { headers: authHeaders });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.data[0].symbol).toBe('BTCUSDT');
    expect(res.data[1].symbol).toBe('ETHBTC');
    expect(fetchBinancePrices).toHaveBeenCalledTimes(1);
  });
});

function httpRequest(server, path, options = {}) {
  const port = server.address().port;
  const { method = 'GET', headers = {}, body } = options;

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: data ? JSON.parse(data) : '' });
        } catch {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}