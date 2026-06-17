import Database from 'better-sqlite3';
import { WalletRepository } from '../src/repositories/WalletRepository';
import { createWalletBalanceUpdater } from '../src/services/WalletBalanceUpdater';
import { getBalance } from '../src/services/BlockchainClient';
import type { Logger, WalletStore } from '../src/types';

jest.mock('../src/services/BlockchainClient', () => ({
  getBalance: jest.fn()
}));

const mockGetBalance = getBalance as jest.MockedFunction<typeof getBalance>;

describe('walletBalanceUpdater', () => {
  let db: Database.Database;
  let repo: WalletRepository;
  let walletStore: WalletStore;
  let logger: Logger;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new WalletRepository(db);

    walletStore = {
      getWallets: () => repo.getAll(),
      getWalletById: (id) => repo.getById(id),
      getWalletsByBlockchain: (blockchain) => repo.getByBlockchain(blockchain),
      addWallet: (data) => repo.create(data),
      updateWallet: (id, data) => repo.update(id, data),
      deleteWallet: (id) => repo.delete(id),
      updateBalance: (id, balance) => repo.updateBalance(id, balance),
      reset: () => repo.reset()
    };

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn()
    };

    mockGetBalance.mockReset();
  });

  afterEach(() => {
    db.close();
  });

  test('should skip update when no wallets exist', async () => {
    const updater = createWalletBalanceUpdater({ logger, walletStore });

    const result = await updater.updateBalances();

    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);
    expect(mockGetBalance).not.toHaveBeenCalled();
  });

  test('should update balance for EVM wallets', async () => {
    repo.create({
      address: '0x8894E0a0c962CB723c1ef8580d0543D766927E2b',
      blockchain: 'bsc',
      label: 'Test'
    });

    mockGetBalance.mockResolvedValue('1.50000000');

    const updater = createWalletBalanceUpdater({ logger, walletStore });
    const result = await updater.updateBalances();

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
    expect(result.updated).toBe(1);
    expect(result.failed).toBe(0);

    const wallets = repo.getAll();
    expect(wallets[0].balance).toBe('1.50000000');
    expect(wallets[0].balance_updated_at).toBeDefined();
  });

  test('should skip non-EVM wallets (btc)', async () => {
    repo.create({
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      blockchain: 'btc',
      label: 'BTC Wallet'
    });

    const updater = createWalletBalanceUpdater({ logger, walletStore });
    const result = await updater.updateBalances();

    expect(mockGetBalance).not.toHaveBeenCalled();
    expect(result.updated).toBe(0);
  });

  test('should handle API failure and continue with next wallet', async () => {
    repo.create({
      address: '0x8894E0a0c962CB723c1ef8580d0543D766927E2b',
      blockchain: 'bsc',
      label: 'Wallet 1'
    });
    repo.create({
      address: '0x0000000000000000000000000000000000001000',
      blockchain: 'bsc',
      label: 'Wallet 2'
    });

    mockGetBalance
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('2.00000000');

    const updater = createWalletBalanceUpdater({ logger, walletStore });
    const result = await updater.updateBalances();

    expect(result.updated).toBe(1);
    expect(result.failed).toBe(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  test('should update multiple wallets', async () => {
    repo.create({
      address: '0x8894E0a0c962CB723c1ef8580d0543D766927E2b',
      blockchain: 'bsc'
    });
    repo.create({
      address: '0x0000000000000000000000000000000000001000',
      blockchain: 'eth'
    });

    mockGetBalance
      .mockResolvedValueOnce('1.50000000')
      .mockResolvedValueOnce('0.10000000');

    const updater = createWalletBalanceUpdater({ logger, walletStore });
    const result = await updater.updateBalances();

    expect(result.updated).toBe(2);
    expect(result.failed).toBe(0);
    expect(mockGetBalance).toHaveBeenCalledTimes(2);
  });
});