const Database = require('better-sqlite3');
const PriceRepository = require('../src/repositories/PriceRepository');

describe('PriceRepository', () => {
  let db;
  let repo;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new PriceRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('updatePrices', () => {
    test('should insert new prices', () => {
      const count = repo.updatePrices([
        { symbol: 'BTCUSDT', price: '61200.00' },
        { symbol: 'ETHUSDT', price: '3100.00' }
      ]);

      expect(count).toBe(2);
      expect(repo.getAll()).toHaveLength(2);
    });

    test('should replace existing prices (UPSERT)', () => {
      repo.updatePrices([{ symbol: 'BTCUSDT', price: '60000.00' }]);
      repo.updatePrices([{ symbol: 'BTCUSDT', price: '62000.00' }]);

      const all = repo.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].price).toBe('62000.00');
    });

    test('should return 0 for empty array', () => {
      expect(repo.updatePrices([])).toBe(0);
    });

    test('should return 0 for non-array input', () => {
      expect(repo.updatePrices(null)).toBe(0);
    });
  });

  describe('getByTicker', () => {
    beforeEach(() => {
      repo.updatePrices([
        { symbol: 'BTCUSDT', price: '61200.00' },
        { symbol: 'ETHBTC', price: '0.052' },
        { symbol: 'ETHUSDT', price: '3100.00' },
        { symbol: 'DOGEUSDT', price: '0.12' }
      ]);
    });

    test('should return all pairs containing ticker', () => {
      const result = repo.getByTicker('BTC');
      expect(result).toHaveLength(2);
      expect(result.map(r => r.symbol)).toEqual(['BTCUSDT', 'ETHBTC']);
    });

    test('should return empty array for non-existent ticker', () => {
      expect(repo.getByTicker('SOL')).toEqual([]);
    });
  });

  describe('clear', () => {
    test('should remove all prices', () => {
      repo.updatePrices([
        { symbol: 'BTCUSDT', price: '61200.00' }
      ]);
      repo.clear();
      expect(repo.getAll()).toHaveLength(0);
    });
  });
});