import Database from 'better-sqlite3';
import axios from 'axios';
import { CurrencyRepository } from '../src/repositories/CurrencyRepository';
import { PriceHistoryRepository } from '../src/repositories/PriceHistoryRepository';
import { createPriceHistoryUpdater } from '../src/services/PriceHistoryUpdater';
import type { Logger, CurrencyStore, PriceHistoryStore } from '../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('priceHistoryUpdater', () => {
  let db: Database.Database;
  let currencyRepo: CurrencyRepository;
  let priceHistoryRepo: PriceHistoryRepository;
  let currencyStore: CurrencyStore;
  let priceHistoryStore: PriceHistoryStore;
  let logger: Logger;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    currencyRepo = new CurrencyRepository(db);
    priceHistoryRepo = new PriceHistoryRepository(db);

    currencyStore = {
      getCurrencies: () => currencyRepo.getAll(),
      getCurrencyById: (id) => currencyRepo.getById(id),
      getCurrencyByTicker: (ticker) => currencyRepo.getByTicker(ticker),
      addCurrency: (data) => currencyRepo.create(data),
      updateCurrency: (id, data) => currencyRepo.update(id, data),
      deleteCurrency: (id) => currencyRepo.delete(id),
      reset: () => currencyRepo.reset()
    };

    priceHistoryStore = {
      getPriceHistory: (symbol, interval, limit) =>
        priceHistoryRepo.getPriceHistory(symbol, interval, limit),
      updatePriceHistory: (histories) =>
        priceHistoryRepo.updatePriceHistory(histories),
      clear: () => priceHistoryRepo.clear()
    };

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn()
    };

    mockedAxios.get.mockReset();
  });

  afterEach(() => {
    db.close();
  });

  test('should skip update when no currencies exist', async () => {
    const updater = createPriceHistoryUpdater({
      logger,
      currencyStore,
      priceHistoryStore
    });

    const result = await updater.updatePriceHistory('1h');

    expect(result.updated).toBe(0);
    expect(result.symbols).toEqual([]);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  test('should fetch and save klines for existing currencies', async () => {
    currencyRepo.create({ name: 'Bitcoin', ticker: 'BTC' });

    // Мок Binance klines API (каждый kline — массив)
    mockedAxios.get.mockResolvedValue({
      data: [
        [1700000000000, '61000', '61200', '60800', '61100', '100', 1700003600000],
        [1700003600000, '61100', '61300', '60900', '61200', '120', 1700007200000]
      ]
    });

    const updater = createPriceHistoryUpdater({
      logger,
      currencyStore,
      priceHistoryStore
    });

    const result = await updater.updatePriceHistory('1h');

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(result.updated).toBe(2);
    expect(result.symbols).toEqual(['BTCUSDT']);

    const saved = priceHistoryRepo.getPriceHistory('BTCUSDT', '1h');
    expect(saved).toHaveLength(2);
  });

  test('should handle API failure gracefully and continue', async () => {
    currencyRepo.create({ name: 'Bitcoin', ticker: 'BTC' });
    currencyRepo.create({ name: 'Ethereum', ticker: 'ETH' });

    // Первый вызов (BTC) падает, второй (ETH) успешный
    mockedAxios.get
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        data: [
          [1700000000000, '3100', '3200', '3050', '3150', '500', 1700003600000]
        ]
      });

    const updater = createPriceHistoryUpdater({
      logger,
      currencyStore,
      priceHistoryStore
    });

    const result = await updater.updatePriceHistory('1h');

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(result.updated).toBe(1);
    expect(result.symbols).toEqual(['ETHUSDT']);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});