import Database from 'better-sqlite3';
import { CurrencyRepository } from '../src/repositories/CurrencyRepository';
import { PriceRepository } from '../src/repositories/PriceRepository';
import { createPriceUpdater } from '../src/services/PriceUpdater';
import type { Logger, CurrencyStore, PriceStore } from '../src/types/index';

describe('priceUpdater', () => {
    let db: Database.Database;
    let currencyRepo: CurrencyRepository;
    let priceRepo: PriceRepository;
    let currencyStore: CurrencyStore;
    let priceStore: PriceStore;
    let logger: Logger;

    beforeEach(() => {
        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');

        currencyRepo = new CurrencyRepository(db);
        priceRepo = new PriceRepository(db);

        currencyStore = {
            getCurrencies: () => currencyRepo.getAll(),
            getCurrencyById: (id) => currencyRepo.getById(id),
            getCurrencyByTicker: (ticker) => currencyRepo.getByTicker(ticker),
            addCurrency: (data) => currencyRepo.create(data),
            updateCurrency: (id, data) => currencyRepo.update(id, data),
            deleteCurrency: (id) => currencyRepo.delete(id),
            reset: () => currencyRepo.reset()
        };

        priceStore = {
            getAllPrices: () => priceRepo.getAll(),
            getPricesByTicker: (ticker) => priceRepo.getByTicker(ticker),
            updatePrices: (prices) => priceRepo.updatePrices(prices),
            clearPrices: () => priceRepo.clear()
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

    test('should skip update when no currencies exist', async () => {
        const fetchBinancePrices = jest.fn();
        const updater = createPriceUpdater({
            logger, currencyStore, priceStore, fetchBinancePrices
        });

        const result = await updater.updatePrices();

        expect(result.updated).toBe(0);
        expect(fetchBinancePrices).not.toHaveBeenCalled();
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
        expect(priceRepo.getAll()).toHaveLength(3);
    });

    test('should propagate Binance API errors', async () => {
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