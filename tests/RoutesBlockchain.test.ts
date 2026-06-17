import request from 'supertest';
import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

import { BlockchainRepository } from '../src/repositories/BlockchainRepository';
import { createAuthMiddleware } from '../src/middleware/auth';
import { setupBlockchainRoute } from '../src/routes/RoutesBlockchain';
import { getBalance } from '../src/services/BlockchainClient';
import { WalletRepository } from '../src/repositories/WalletRepository';
import type { BlockchainStore, WalletStore } from '../src/types';

jest.mock('../src/services/BlockchainClient', () => ({
  getBalance: jest.fn(),
}));

const mockGetBalance = getBalance as jest.MockedFunction<typeof getBalance>;

describe('Blockchain routes', () => {
  let app: express.Application;
  let db: Database.Database;
  let repo: BlockchainRepository;
  let walletRepo: WalletRepository;

  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const validToken = jwt.sign({}, JWT_SECRET, { expiresIn: '1h' });

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});

    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new BlockchainRepository(db);

    walletRepo = new WalletRepository(db);

    const walletStore: WalletStore = {
        getWallets: () => walletRepo.getAll(),
        getWalletById: (id) => walletRepo.getById(id),
        getWalletsByBlockchain: (blockchain) => walletRepo.getByBlockchain(blockchain),
        addWallet: (data) => walletRepo.create(data),
        updateWallet: (id, data) => walletRepo.update(id, data),
        deleteWallet: (id) => walletRepo.delete(id),
        updateBalance: (id, balance) => walletRepo.updateBalance(id, balance),
        reset: () => walletRepo.reset()
    };

    const store: BlockchainStore = {
      getBlockHeight: (blockchain) => repo.getBlockHeight(blockchain),
      updateBlockHeight: (blockchain, height) => repo.updateBlockHeight(blockchain, height),
      reset: () => repo.reset()
    };

    app = express();
    app.use(express.json());
    app.use(createAuthMiddleware(JWT_SECRET));
      setupBlockchainRoute(app, store, walletStore);

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
    repo.reset();
    mockGetBalance.mockReset();
  });

  // ── GET /blockchain/height ──

  describe('GET /blockchain/height', () => {
    test('should return block height from DB', async () => {
      repo.updateBlockHeight('bsc', 40000000);

      const res = await request(app)
        .get('/blockchain/height?blockchain=bsc')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.blockchain).toBe('bsc');
      expect(res.body.height).toBe(40000000);
    });

    test('should default to bsc if blockchain not specified', async () => {
      repo.updateBlockHeight('bsc', 40000000);

      const res = await request(app)
        .get('/blockchain/height')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.blockchain).toBe('bsc');
    });

    test('should return 404 if block height not synced yet', async () => {
      const res = await request(app)
        .get('/blockchain/height')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });

    test('should return 400 for invalid blockchain', async () => {
      const res = await request(app)
        .get('/blockchain/height?blockchain=invalid')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid blockchain');
    });

    test('should return 403 without authorization', async () => {
      const res = await request(app).get('/blockchain/height');
      expect(res.status).toBe(403);
    });
  });

  // ── GET /wallets/:address/balance ──

  describe('GET /wallets/:address/balance', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

    beforeEach(() => {
      walletRepo.reset();
    });

    test('should return balance for wallet with balance in DB', async () => {
      // Создаём кошелёк и обновляем баланс (имитируем фоновую задачу)
      const wallet = walletRepo.create({
        address: validAddress,
        blockchain: 'bsc',
        label: 'Test Wallet'
      });
      walletRepo.updateBalance(wallet.id, '1.50000000');

      const res = await request(app)
        .get(`/wallets/${validAddress}/balance`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.address).toBe(validAddress);
      expect(res.body.balance).toBe('1.50000000');
      expect(res.body.blockchain).toBe('bsc');
      expect(res.body).toHaveProperty('updated_at');
    });

    test('should return 404 if wallet not found in DB', async () => {
      const res = await request(app)
        .get(`/wallets/${validAddress}/balance`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('should return 404 if wallet exists but balance not synced yet', async () => {
      // Создаём кошелёк, но баланс ещё не обновлён фоновой задачей
      walletRepo.create({
        address: validAddress,
        blockchain: 'bsc',
        label: 'Test Wallet'
      });

      const res = await request(app)
        .get(`/wallets/${validAddress}/balance`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not available yet');
    });

    test('should return 400 for invalid address format', async () => {
      const res = await request(app)
        .get('/wallets/invalid-address/balance')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid address');
    });

    test('should be case-insensitive when searching wallet', async () => {
      const wallet = walletRepo.create({
        address: validAddress.toLowerCase(),
        blockchain: 'bsc'
      });
      walletRepo.updateBalance(wallet.id, '2.00000000');

      // Запрашиваем с заглавными буквами
      const res = await request(app)
        .get(`/wallets/${validAddress.toUpperCase()}/balance`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe('2.00000000');
    });

    test('should return 403 without authorization', async () => {
      const res = await request(app)
        .get(`/wallets/${validAddress}/balance`);

      expect(res.status).toBe(403);
    });
  });
});