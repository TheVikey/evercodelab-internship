import request from 'supertest';
import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

import { CurrencyRepository } from '../src/repositories/CurrencyRepository';
import { createAuthMiddleware } from '../src/middleware/auth';
import { setupCurrenciesRoute } from '../src/routes/RoutesCurrencies';
import type { CurrencyStore } from '../src/types/index';

describe('CRUD /currencies', () => {
    let app: express.Application;
    let db: Database.Database;
    let repo: CurrencyRepository;

    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const validToken = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });

    beforeAll(() => {
        jest.spyOn(console, 'info').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'debug').mockImplementation(() => { });

        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');
        repo = new CurrencyRepository(db);

        const store: CurrencyStore = {
            getCurrencies: () => repo.getAll(),
            getCurrencyById: (id) => repo.getById(id),
            getCurrencyByTicker: (ticker) => repo.getByTicker(ticker),
            addCurrency: (data) => repo.create(data),
            updateCurrency: (id, data) => repo.update(id, data),
            deleteCurrency: (id) => repo.delete(id),
            reset: () => repo.reset()
        };

        app = express();
        app.use(express.json());
        app.use(createAuthMiddleware(JWT_SECRET));
        setupCurrenciesRoute(app, store);

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

    // ── POST /currencies ──

    test('POST should create currency and return 201', async () => {
        const res = await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Euro', ticker: 'EUR' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(typeof res.body.id).toBe('number');
        expect(res.body.name).toBe('Euro');
        expect(res.body.ticker).toBe('EUR');
    });

    test('POST should return 400 if name or ticker is missing', async () => {
        const res = await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Euro' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test('POST should return 400 for duplicate ticker', async () => {
        await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const res = await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Bitcoin Copy', ticker: 'BTC' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('already exists');
    });

    test('POST should return 403 without authorization', async () => {
        const res = await request(app)
            .post('/currencies')
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        expect(res.status).toBe(403);
    });

    // ── GET /currencies ──

    test('GET should return all currencies', async () => {
        await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const res = await request(app)
            .get('/currencies')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
    });

    test('GET should return empty array when no currencies exist', async () => {
        const res = await request(app)
            .get('/currencies')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    // ── GET /currencies/:id ──

    test('GET /currencies/:id should return currency by id', async () => {
        const created = await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const res = await request(app)
            .get(`/currencies/${created.body.id}`)
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Bitcoin');
        expect(res.body.ticker).toBe('BTC');
    });

    test('GET /currencies/:id should return 404 for non-existent id', async () => {
        const res = await request(app)
            .get('/currencies/99999')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(404);
    });

    test('GET /currencies/:id should return 400 for invalid id', async () => {
        const res = await request(app)
            .get('/currencies/abc')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(400);
    });

    // ── PUT /currencies/:id ──

    test('PUT should update existing currency', async () => {
        const created = await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Old', ticker: 'OLD' });

        const res = await request(app)
            .put(`/currencies/${created.body.id}`)
            .set('Authorization', `Bearer ${validToken}`)
            .send({ ticker: 'NEW' });

        expect(res.status).toBe(200);
        expect(res.body.ticker).toBe('NEW');
        expect(res.body.name).toBe('Old');
    });

    test('PUT should return 404 for non-existent id', async () => {
        const res = await request(app)
            .put('/currencies/99999')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Ghost' });

        expect(res.status).toBe(404);
    });

    // ── DELETE /currencies/:id ──

    test('DELETE should remove currency and return 204', async () => {
        const created = await request(app)
            .post('/currencies')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'X', ticker: 'X' });

        const res = await request(app)
            .delete(`/currencies/${created.body.id}`)
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(204);
    });

    test('DELETE should return 404 for non-existent id', async () => {
        const res = await request(app)
            .delete('/currencies/99999')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(404);
    });

    // ── Auth ──

    test('should return 403 for invalid JWT', async () => {
        const res = await request(app)
            .post('/currencies')
            .set('Authorization', 'Bearer invalid.token.here')
            .send({ name: 'Bad', ticker: 'BAD' });

        expect(res.status).toBe(403);
    });
});