import type { PriceUpdaterDeps, PriceUpdaterResult } from '../types';

export function createPriceUpdater(deps: PriceUpdaterDeps) {
    const { logger, currencyStore, priceStore, fetchBinancePrices } = deps;

    async function updatePrices(): Promise<PriceUpdaterResult> {
        const currencies = currencyStore.getCurrencies();

        if (currencies.length === 0) {
            logger.info('No currencies in DB, skipping price update');
            return { updated: 0, tickers: [] };
        }

        const allPrices = await fetchBinancePrices();
        const tickers = currencies.map(c => c.ticker);

        const filtered = allPrices.filter(p =>
            tickers.some(t => p.symbol.includes(t))
        );

        const updated = priceStore.updatePrices(filtered);

        logger.info(
            `Updated ${updated} prices for tickers: ${tickers.join(', ')}`
        );

        return { updated, tickers };
    }

    return { updatePrices };
}