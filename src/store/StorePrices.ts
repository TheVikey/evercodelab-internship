import { getDatabase } from '../db/database';
import { PriceRepository } from '../repositories/PriceRepository';
import type { PriceStore, Price, BinancePriceResponse } from '../types';

let repository: PriceRepository | null = null;

function getRepository(): PriceRepository {
    if (!repository) {
        const db = getDatabase();
        repository = new PriceRepository(db);
    }
    return repository;
}

export const priceStore: PriceStore = {
    getAllPrices(): Price[] {
        return getRepository().getAll();
    },

    getPricesByTicker(ticker: string): Price[] {
        return getRepository().getByTicker(ticker);
    },

    updatePrices(prices: BinancePriceResponse[]): number {
        return getRepository().updatePrices(prices);
    },

    clearPrices(): void {
        getRepository().clear();
    }
};