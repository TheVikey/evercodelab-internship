import Database from 'better-sqlite3';
import { PriceHistoryRepository } from '../src/repositories/PriceHistoryRepository';

describe('PriceHistoryRepository', () => {
  let db: Database.Database;
  let repo: PriceHistoryRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    repo = new PriceHistoryRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('updatePriceHistory', () => {
    test('should insert new price history records', () => {
      const count = repo.updatePriceHistory([
        { symbol: 'BTCUSDT', price: '61200.00', interval: '1h', timestamp: 1700000000000 },
        { symbol: 'BTCUSDT', price: '61300.00', interval: '1h', timestamp: 1700003600000 }
      ]);
      expect(count).toBe(2);
    });

    test('should return 0 for empty array', () => {
      expect(repo.updatePriceHistory([])).toBe(0);
    });

    test('should return 0 for null input', () => {
      expect(repo.updatePriceHistory(null as any)).toBe(0);
    });
  });

  describe('getPriceHistory', () => {
    beforeEach(() => {
      repo.updatePriceHistory([
        { symbol: 'BTCUSDT', price: '61000.00', interval: '1h', timestamp: 1700000000000 },
        { symbol: 'BTCUSDT', price: '61200.00', interval: '1h', timestamp: 1700003600000 },
        { symbol: 'BTCUSDT', price: '61500.00', interval: '1h', timestamp: 1700007200000 },
        { symbol: 'ETHUSDT', price: '3100.00', interval: '1h', timestamp: 1700000000000 }
      ]);
    });

    test('should return history for specific symbol and interval', () => {
      const result = repo.getPriceHistory('BTCUSDT', '1h');
      expect(result).toHaveLength(3);
    });

    test('should order by timestamp DESC', () => {
      const result = repo.getPriceHistory('BTCUSDT', '1h');
      expect(result[0].timestamp).toBe(1700007200000);
      expect(result[2].timestamp).toBe(1700000000000);
    });

    test('should respect limit parameter', () => {
      const result = repo.getPriceHistory('BTCUSDT', '1h', 2);
      expect(result).toHaveLength(2);
    });

    test('should return empty array for non-existent symbol', () => {
      expect(repo.getPriceHistory('SOLUSDT', '1h')).toEqual([]);
    });

    test('should return empty array for wrong interval', () => {
      expect(repo.getPriceHistory('BTCUSDT', '5m')).toEqual([]);
    });
  });

  describe('clear', () => {
    test('should remove all price history', () => {
      repo.updatePriceHistory([
        { symbol: 'BTCUSDT', price: '61200.00', interval: '1h', timestamp: 1700000000000 }
      ]);
      repo.clear();
      expect(repo.getPriceHistory('BTCUSDT', '1h')).toEqual([]);
    });
  });
});