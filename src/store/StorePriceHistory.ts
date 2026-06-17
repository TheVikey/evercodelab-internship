import { getDatabase } from '../db/database';
import { PriceHistoryRepository } from '../repositories/PriceHistoryRepository';
import type { PriceHistoryStore, PriceHistory } from '../types';

let repository: PriceHistoryRepository | null = null;

function getRepository(): PriceHistoryRepository {
  if (!repository) {
    const db = getDatabase();
    repository = new PriceHistoryRepository(db);
  }
  return repository;
}

export const priceHistoryStore: PriceHistoryStore = {
  getPriceHistory(symbol: string, interval: string, limit?: number): PriceHistory[] {
    return getRepository().getPriceHistory(symbol, interval, limit);
  },

  updatePriceHistory(histories: PriceHistory[]): number {
    return getRepository().updatePriceHistory(histories);
  },

  clear(): void {
    getRepository().clear();
  }
};