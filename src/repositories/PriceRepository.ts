import type Database from 'better-sqlite3';
import type { Price, BinancePriceResponse } from '../types';

export class PriceRepository {
    private db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;
        this._initTables();
    }

    private _initTables(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS prices (
        symbol TEXT PRIMARY KEY,
        price TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    }

    getAll(): Price[] {
        const stmt = this.db.prepare('SELECT symbol, price, updated_at FROM prices');
        return stmt.all() as Price[];
    }

    getByTicker(ticker: string): Price[] {
        const stmt = this.db.prepare(
            'SELECT symbol, price, updated_at FROM prices WHERE symbol LIKE ?'
        );
        return stmt.all(`%${ticker}%`) as Price[];
    }

    updatePrices(prices: BinancePriceResponse[]): number {
        if (!Array.isArray(prices) || prices.length === 0) {
            return 0;
        }

        const upsert = this.db.transaction((items: BinancePriceResponse[]): number => {
            const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO prices (symbol, price, updated_at)
        VALUES (?, ?, datetime('now'))
      `);
            for (const { symbol, price } of items) {
                stmt.run(symbol, String(price));
            }
            return items.length;
        });

        return upsert(prices);
    }

    clear(): void {
        const stmt = this.db.prepare('DELETE FROM prices');
        stmt.run();
    }
}