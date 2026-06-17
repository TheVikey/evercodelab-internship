import Database from 'better-sqlite3';
import { BlockchainRepository } from '../src/repositories/BlockchainRepository';

describe('BlockchainRepository', () => {
  let db: Database.Database;
  let repo: BlockchainRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new BlockchainRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('updateBlockHeight', () => {
    test('should insert new block height', () => {
      const result = repo.updateBlockHeight('bsc', 40000000);
      expect(result.blockchain).toBe('bsc');
      expect(result.height).toBe(40000000);
      expect(result).toHaveProperty('updated_at');
    });

    test('should replace existing block height (UPSERT)', () => {
      repo.updateBlockHeight('bsc', 40000000);
      repo.updateBlockHeight('bsc', 40000001);

      const result = repo.getBlockHeight('bsc');
      expect(result?.height).toBe(40000001);
    });
  });

  describe('getBlockHeight', () => {
    test('should return undefined for non-existent blockchain', () => {
      expect(repo.getBlockHeight('sol')).toBeUndefined();
    });

    test('should return block height for existing blockchain', () => {
      repo.updateBlockHeight('bsc', 40000000);
      const result = repo.getBlockHeight('bsc');
      expect(result?.height).toBe(40000000);
    });
  });

  describe('reset', () => {
    test('should remove all block heights', () => {
      repo.updateBlockHeight('bsc', 40000000);
      repo.reset();
      expect(repo.getBlockHeight('bsc')).toBeUndefined();
    });
  });
});