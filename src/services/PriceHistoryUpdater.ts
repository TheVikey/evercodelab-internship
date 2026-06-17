import axios, { AxiosError } from 'axios';
import type { Logger, CurrencyStore, PriceHistoryStore, PriceHistory, BinanceKline } from '../types';

const BINANCE_KLINES_URL = 'https://api.binance.com/api/v3/klines';
const TIMEOUT_MS = 5000;

interface PriceHistoryUpdaterDeps {
  logger: Logger;
  currencyStore: CurrencyStore;
  priceHistoryStore: PriceHistoryStore;
}

export function createPriceHistoryUpdater(deps: PriceHistoryUpdaterDeps) {
  const { logger, currencyStore, priceHistoryStore } = deps;

  async function fetchKlines(
    symbol: string,
    interval: string,
    limit: number = 500
  ): Promise<BinanceKline[]> {
    try {
      const response = await axios.get<any[]>(BINANCE_KLINES_URL, {
        params: {
          symbol,
          interval,
          limit
        },
        timeout: TIMEOUT_MS,
        headers: { 'Accept': 'application/json' }
      });

      // Преобразуем массив массивов в массив объектов
      return response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6]
      }));
    } catch (err) {
      const axiosErr = err as AxiosError;
      throw new Error(`Failed to fetch klines for ${symbol}: ${axiosErr.message}`);
    }
  }

  async function updatePriceHistory(interval: string = '1h'): Promise<{ updated: number; symbols: string[] }> {
    const currencies = currencyStore.getCurrencies();

    if (currencies.length === 0) {
      logger.info('No currencies in DB, skipping price history update');
      return { updated: 0, symbols: [] };
    }

    let totalUpdated = 0;
    const symbols: string[] = [];

    for (const currency of currencies) {
      try {
        // Для каждой валюты запрашиваем пару с USDT
        const symbol = `${currency.ticker}USDT`;
        const klines = await fetchKlines(symbol, interval);

        const histories: PriceHistory[] = klines.map(kline => ({
          symbol,
          price: kline.close,
          interval,
          timestamp: kline.openTime
        }));

        const updated = priceHistoryStore.updatePriceHistory(histories);
        totalUpdated += updated;
        symbols.push(symbol);

        logger.info(`Updated ${updated} price history records for ${symbol}`);
      } catch (err) {
        logger.error(`Failed to update price history for ${currency.ticker}: ${(err as Error).message}`);
      }
    }

    return { updated: totalUpdated, symbols };
  }

  return { updatePriceHistory };
}