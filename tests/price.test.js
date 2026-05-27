jest.mock('../src/services/services_binanceClient');
const { fetchBinancePrices } = require('../src/services/services_binanceClient');
const http = require('http');
const createApp = require('../src/app');
const currencyStore = require('../src/store/store_currencies');
require('dotenv').config();
const jwt = require('jsonwebtoken');

describe('GET /price', () => {
  let server;
  
  const VALID_TOKEN = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '1h' });
  const authHeaders = { Authorization: `Bearer ${VALID_TOKEN}` };

  beforeAll((done) => {
    const app = createApp({ authToken: process.env.JWT_SECRET });
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(() => done());
  });

  beforeEach(() => {
    currencyStore.reset();
    currencyStore.addCurrency({ name: 'Bitcoin', ticker: 'BTC' });
    currencyStore.addCurrency({ name: 'Ethereum', ticker: 'ETH' });
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