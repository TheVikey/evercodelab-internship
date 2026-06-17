import { getDatabase } from '../db/database';
import { CurrencyRepository } from '../repositories/CurrencyRepository';
import type { CurrencyStore, Currency, CurrencyInput } from '../types';

let repository: CurrencyRepository | null = null;

function getRepository(): CurrencyRepository {
    if (!repository) {
        const db = getDatabase();
        repository = new CurrencyRepository(db);
    }
    return repository;
}

export const currencyStore: CurrencyStore = {
    getCurrencies(): Currency[] {
        return getRepository().getAll();
    },

    getCurrencyById(id: number): Currency | undefined {
        return getRepository().getById(id);
    },

    getCurrencyByTicker(ticker: string): Currency | undefined {
        return getRepository().getByTicker(ticker);
    },

    addCurrency(data: CurrencyInput): Currency {
        return getRepository().create(data);
    },

    updateCurrency(id: number, data: Partial<CurrencyInput>): Currency | null {
        return getRepository().update(id, data);
    },

    deleteCurrency(id: number): boolean {
        return getRepository().delete(id);
    },

    reset(): void {
        getRepository().reset();
    }
};