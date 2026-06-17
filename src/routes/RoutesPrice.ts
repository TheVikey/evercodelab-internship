import type { Application, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/ValidationError';
import { NotFoundError } from '../errors/NotFoundError';
import { priceStore as defaultPriceStore } from '../store/StorePrices';
import { priceHistoryStore as defaultPriceHistoryStore } from '../store/StorePriceHistory';
import type { CurrencyStore, PriceStore, PriceHistoryStore } from '../types';

const VALID_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export function setupPriceRoute(
    app: Application,
    currencyStore: CurrencyStore,
    priceStoreOverride?: PriceStore,
    priceHistoryStoreOverride?: PriceHistoryStore
): void {

    const store = priceStoreOverride || defaultPriceStore;
    const historyStore = priceHistoryStoreOverride || defaultPriceHistoryStore;

    app.get('/price', (req: Request, res: Response, next: NextFunction) => {
        try {
            const { currency } = req.query;

            if (!currency || typeof currency !== 'string' || currency.trim() === '') {
                throw new ValidationError('Query parameter "currency" is required');
            }

            const ticker = currency.trim().toUpperCase();

            const exists = currencyStore.getCurrencyByTicker(ticker);
            if (!exists) {
                throw new NotFoundError(`Currency "${ticker}" not found in local database`);
            }

            const prices = store.getPricesByTicker(ticker);

            if (prices.length === 0) {
                throw new NotFoundError(
                    `No prices found for "${ticker}". Prices may not have been fetched yet.`
                );
            }

            res.json(prices);
        } catch (err) {
            next(err);
        }
    });

    app.get('/price/:ticker/history', (req: Request, res: Response, next: NextFunction) => {
        try {
            const ticker = (req.params.ticker as string).toUpperCase();

            const exists = currencyStore.getCurrencyByTicker(ticker);
            if (!exists) {
                throw new NotFoundError(`Currency "${ticker}" not found in local database`);
            }

            const interval = ((req.query.interval as string) || '1h').toLowerCase();
            if (!VALID_INTERVALS.includes(interval)) {
                throw new ValidationError(
                    `Invalid interval. Supported: ${VALID_INTERVALS.join(', ')}`
                );
            }

            const limitParam = req.query.limit;
            const limit = limitParam ? parseInt(limitParam as string, 10) : 100;
            if (isNaN(limit) || limit <= 0 || limit > 1000) {
                throw new ValidationError('Limit must be a positive number (max 1000)');
            }

            const symbol = `${ticker}USDT`;
            const history = historyStore.getPriceHistory(symbol, interval, limit);

            if (history.length === 0) {
                throw new NotFoundError(
                    `No price history found for "${symbol}" with interval "${interval}".`
                );
            }

            res.json(history);
        } catch (err) {
            next(err);
        }
    });
}