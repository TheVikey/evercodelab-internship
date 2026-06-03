const http = require('http');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const createApp = require('../src/app');
const CurrencyRepository = require('../src/repositories/CurrencyRepository');

describe('CRUD /currencies', () => {
  let server;
  let db;
  let repository;
  
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const validToken = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });
  const authHeaders = { Authorization: `Bearer ${validToken}` };

  beforeAll((done) => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    repository = new CurrencyRepository(db);
    
    const currencyStore = {
      getCurrencies: () => repository.getAll(),
      getCurrencyById: (id) => repository.getById(id),
      getCurrencyByTicker: (ticker) => repository.getByTicker(ticker),
      addCurrency: (data) => repository.create(data),
      updateCurrency: (id, data) => repository.update(id, data),
      deleteCurrency: (id) => repository.delete(id),
      reset: () => repository.reset()
    };

    const app = require('../src/app')({ authToken: JWT_SECRET });
    
    const express = require('express');
    const createAuthMiddleware = require('../src/middleware/auth');
    const setupCurrenciesRoute = require('../src/routes/routes_currencies');
    
    const testApp = express();
    testApp.use(express.json());
    
    const authMiddleware = createAuthMiddleware(JWT_SECRET);
    testApp.use(authMiddleware);
    
    setupCurrenciesRoute(testApp, currencyStore);
    
    testApp.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: err.message,
        timestamp: err.timestamp || new Date().toISOString()
      });
    });
    
    server = testApp.listen(0, done);
  });

  afterAll((done) => {
    server.close(() => {
      db.close();
      done();
    });
  });

  beforeEach(() => repository.reset());

  test('POST should create currency and return 201', async () => {
    const res = await httpRequest(server, '/currencies', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'Euro', ticker: 'EUR' }
    });
    expect(res.statusCode).toBe(201);
    expect(res.data).toHaveProperty('id');
    expect(typeof res.data.id).toBe('number');
    expect(res.data.name).toBe('Euro');
  });

  test('GET should return created currencies', async () => {
    await httpRequest(server, '/currencies', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'A', ticker: 'B' }
    });
    const res = await httpRequest(server, '/currencies', { headers: authHeaders });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(1);
  });

  test('PUT should update existing currency', async () => {
    const { data: created } = await httpRequest(server, '/currencies', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'Old', ticker: 'OLD' }
    });
    const res = await httpRequest(server, `/currencies/${created.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { ticker: 'NEW' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.data.ticker).toBe('NEW');
  });

  test('DELETE should remove currency and return 204', async () => {
    const { data: created } = await httpRequest(server, '/currencies', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'X', ticker: 'X' }
    });
    const res = await httpRequest(server, `/currencies/${created.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    expect(res.statusCode).toBe(204);
  });

  test('should return 403 for invalid JWT', async () => {
    const invalidHeaders = { Authorization: 'Bearer invalid.token.here' };
    const res = await httpRequest(server, '/currencies', {
      method: 'POST',
      headers: invalidHeaders,
      body: { name: 'Bad', ticker: 'BAD' }
    });
    expect(res.statusCode).toBe(403);
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