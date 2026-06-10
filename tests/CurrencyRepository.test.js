const Database = require('better-sqlite3');
const CurrencyRepository = require('../src/repositories/CurrencyRepository');

describe('CurrencyRepository', () => {
  let db;
  let repo;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new CurrencyRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    test('should create currency and return object with numeric id', () => {
      const result = repo.create({ name: 'Bitcoin', ticker: 'BTC' });

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe('Bitcoin');
      expect(result.ticker).toBe('BTC');
    });

    test('should throw on duplicate ticker (UNIQUE constraint)', () => {
      repo.create({ name: 'Bitcoin', ticker: 'BTC' });

      expect(() => {
        repo.create({ name: 'Bitcoin Copy', ticker: 'BTC' });
      }).toThrow(/UNIQUE constraint failed/);
    });
  });

  describe('getAll', () => {
    test('should return all created currencies', () => {
      repo.create({ name: 'Bitcoin', ticker: 'BTC' });
      repo.create({ name: 'Ethereum', ticker: 'ETH' });
      repo.create({ name: 'Solana', ticker: 'SOL' });

      const result = repo.getAll();
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('ticker');
    });
  });

  describe('getByTicker', () => {
    test('should return currency by valid ticker', () => {
      repo.create({ name: 'Bitcoin', ticker: 'BTC' });
      const result = repo.getByTicker('BTC');

      expect(result.name).toBe('Bitcoin');
      expect(result.ticker).toBe('BTC');
    });

    test('should return undefined for non-existent ticker', () => {
      const result = repo.getByTicker('NONEXISTENT');
      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    test('should update name only', () => {
      const created = repo.create({ name: 'Old Name', ticker: 'OLD' });
      const updated = repo.update(created.id, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.ticker).toBe('OLD');
    });

    test('should return null when updating non-existent currency', () => {
      const result = repo.update(99999, { name: 'Ghost' });
      expect(result).toBeNull();
    });

    test('should throw on duplicate ticker during update', () => {
      repo.create({ name: 'Bitcoin', ticker: 'BTC' });
      const eth = repo.create({ name: 'Ethereum', ticker: 'ETH' });

      expect(() => {
        repo.update(eth.id, { ticker: 'BTC' });
      }).toThrow(/UNIQUE constraint failed/);
    });
  });

  describe('delete', () => {
    test('should delete existing currency and return true, false for non-existent', () => {
      const created = repo.create({ name: 'Bitcoin', ticker: 'BTC' });
      const result = repo.delete(created.id);

      expect(result).toBe(true);
      expect(repo.getById(created.id)).toBeUndefined();

      const nonExistentResult = repo.delete(99999);
      expect(nonExistentResult).toBe(false);
    });
  });

  describe('SQL injection protection', () => {
    test('create should safely store SQL-like strings without executing them', () => {
      const maliciousTicker = "'; DROP TABLE currencies; --";
      const result = repo.create({ name: 'Malicious', ticker: maliciousTicker });

      expect(result.ticker).toBe(maliciousTicker);

      const all = repo.getAll();
      expect(all).toHaveLength(1);
    });
  });
});