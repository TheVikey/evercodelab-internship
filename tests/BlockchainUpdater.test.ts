import Database from 'better-sqlite3';
import { BlockchainRepository } from '../src/repositories/BlockchainRepository';
import { createBlockchainUpdater } from '../src/services/BlockchainUpdater';
import type { Logger, BlockchainStore } from '../src/types';

describe('blockchainUpdater', () => {
  let db: Database.Database;
  let repo: BlockchainRepository;
  let blockchainStore: BlockchainStore;
  let logger: Logger;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new BlockchainRepository(db);

    blockchainStore = {
      getBlockHeight: (blockchain) => repo.getBlockHeight(blockchain),
      updateBlockHeight: (blockchain, height) => repo.updateBlockHeight(blockchain, height),
      reset: () => repo.reset()
    };

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn()
    };
  });

  afterEach(() => {
    db.close();
  });

  test('should fetch and save block height', async () => {
    const mockGetBlockHeight = jest.fn().mockResolvedValue(40000000);

    const updater = createBlockchainUpdater({
      logger,
      blockchainStore,
      getBlockHeight: mockGetBlockHeight
    });

    const result = await updater.updateBlockHeight();

    expect(mockGetBlockHeight).toHaveBeenCalledTimes(1);
    expect(result.blockchain).toBe('bsc');
    expect(result.height).toBe(40000000);

    const saved = repo.getBlockHeight('bsc');
    expect(saved?.height).toBe(40000000);
  });

  test('should update existing block height', async () => {
    repo.updateBlockHeight('bsc', 40000000);

    const mockGetBlockHeight = jest.fn().mockResolvedValue(40000001);

    const updater = createBlockchainUpdater({
      logger,
      blockchainStore,
      getBlockHeight: mockGetBlockHeight
    });

    const result = await updater.updateBlockHeight();

    expect(result.height).toBe(40000001);

    const saved = repo.getBlockHeight('bsc');
    expect(saved?.height).toBe(40000001);
  });

  test('should propagate API errors', async () => {
    const mockGetBlockHeight = jest.fn().mockRejectedValue(
      new Error('RPC connection failed')
    );

    const updater = createBlockchainUpdater({
      logger,
      blockchainStore,
      getBlockHeight: mockGetBlockHeight
    });

    await expect(updater.updateBlockHeight()).rejects.toThrow('RPC connection failed');
  });
});