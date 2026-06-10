const Database = require('better-sqlite3');
const CurrencyRepository = require('../src/repositories/CurrencyRepository');
const PriceRepository = require('../src/repositories/PriceRepository');
const createPriceUpdater = require('../src/services/priceUpdater');

describe('priceUpdater', () => {
  let db;
  let currencyRepo;
  let priceRepo;
  let currencyStore;
  let priceStore;
  let logger;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    currencyRepo = new CurrencyRepository(db);
    priceRepo = new PriceRepository(db);

    currencyStore = {
      getCurrencies: () => currencyRepo.getAll()
    };

    priceStore = {
      updatePrices: (prices) => priceRepo.updatePrices(prices)
    };

    logger = {
      info: jest.fn(),
      error: jest.fn()
    };
  });

  afterEach(() => {
    db.close();
  });

  test('should skip update when no currencies exist', async () => {
    const fetchBinancePrices = jest.fn();
    const updater = createPriceUpdater({
      logger, currencyStore, priceStore, fetchBinancePrices
    });

    const result = await updater.updatePrices();

    expect(result.updated).toBe(0);
    expect(fetchBinancePrices).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('No currencies')
    );
  });

  test('should fetch and save prices for existing currencies', async () => {
    currencyRepo.create({ name: 'Bitcoin', ticker: 'BTC' });
    currencyRepo.create({ name: 'Ethereum', ticker: 'ETH' });

    const fetchBinancePrices = jest.fn().mockResolvedValue([
      { symbol: 'BTCUSDT', price: '61200.00' },
      { symbol: 'ETHBTC', price: '0.052' },
      { symbol: 'ETHUSDT', price: '3100.00' },
      { symbol: 'DOGEUSDT', price: '0.12' }
    ]);

    const updater = createPriceUpdater({
      logger, currencyStore, priceStore, fetchBinancePrices
    });

    const result = await updater.updatePrices();

    expect(fetchBinancePrices).toHaveBeenCalledTimes(1);
    expect(result.updated).toBe(3);

    const savedPrices = priceRepo.getAll();
    expect(savedPrices).toHaveLength(3);
    expect(savedPrices.map(p => p.symbol).sort()).toEqual([
      'BTCUSDT', 'ETHBTC', 'ETHUSDT'
    ]);
  });

  test('should handle Binance API failure gracefully', async () => {
    currencyRepo.create({ name: 'Bitcoin', ticker: 'BTC' });

    const fetchBinancePrices = jest.fn().mockRejectedValue(
      new Error('Network error')
    );

    const updater = createPriceUpdater({
      logger, currencyStore, priceStore, fetchBinancePrices
    });

    await expect(updater.updatePrices()).rejects.toThrow('Network error');
  });
});