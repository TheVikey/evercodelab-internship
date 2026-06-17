import request from 'supertest';
import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

import { CurrencyRepository } from '../src/repositories/CurrencyRepository';
import { PriceRepository } from '../src/repositories/PriceRepository';
import { createAuthMiddleware } from '../src/middleware/auth';
import { setupPriceRoute } from '../src/routes/RoutesPrice';
import type { CurrencyStore, PriceStore } from '../src/types/index';

describe('GET /price', () => {
    let app: express.Application;
    let db: Database.Database;
    let currencyRepo: CurrencyRepository;
    let priceRepo: PriceRepository;

    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const validToken = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });

    beforeAll(() => {
        jest.spyOn(console, 'info').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'debug').mockImplementation(() => { });

        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');

        currencyRepo = new CurrencyRepository(db);
        priceRepo = new PriceRepository(db);

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
            getAllPrices: () => priceRepo.getAll(),
            getPricesByTicker: (ticker) => priceRepo.getByTicker(ticker),
            updatePrices: (prices) => priceRepo.updatePrices(prices),
            clearPrices: () => priceRepo.clear()
        };

        app = express();
        app.use(express.json());
        app.use(createAuthMiddleware(JWT_SECRET));
        setupPriceRoute(app, currencyStore, priceStore);

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

    test('should return prices filtered by ticker', async () => {
        const res = await request(app)
            .get('/price?currency=BTC')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
        expect(res.body.map((p: any) => p.symbol).sort()).toEqual(['BTCUSDT', 'ETHBTC']);
    });

    test('should return 400 if currency parameter is missing', async () => {
        const res = await request(app)
            .get('/price')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('currency');
    });

    test('should return 404 if currency not in DB', async () => {
        const res = await request(app)
            .get('/price?currency=SOL')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('SOL');
    });

    test('should return 404 if no prices exist for existing currency', async () => {
        priceRepo.clear();

        const res = await request(app)
            .get('/price?currency=BTC')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('No prices found');
    });

    test('should return prices with updated_at field', async () => {
        const res = await request(app)
            .get('/price?currency=BTC')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('updated_at');
    });

    test('should return 403 without authorization', async () => {
        const res = await request(app).get('/price?currency=BTC');
        expect(res.status).toBe(403);
    });
});