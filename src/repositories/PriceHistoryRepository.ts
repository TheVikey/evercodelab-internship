import type Database from 'better-sqlite3';
import type { PriceHistory } from '../types';

export class PriceHistoryRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this._initTables();
  }

  private _initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        price TEXT NOT NULL,
        interval TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        UNIQUE(symbol, interval, timestamp)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_price_history_symbol_interval
      ON price_history(symbol, interval, timestamp DESC)
    `);
  }

  getPriceHistory(symbol: string, interval: string, limit: number = 100): PriceHistory[] {
    const stmt = this.db.prepare(`
      SELECT symbol, price, interval, timestamp
      FROM price_history
      WHERE symbol = ? AND interval = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(symbol, interval, limit) as PriceHistory[];
  }

  updatePriceHistory(histories: PriceHistory[]): number {
    if (!Array.isArray(histories) || histories.length === 0) {
      return 0;
    }

    const upsert = this.db.transaction((items: PriceHistory[]): number => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO price_history (symbol, price, interval, timestamp)
        VALUES (?, ?, ?, ?)
      `);

      for (const { symbol, price, interval, timestamp } of items) {
        stmt.run(symbol, price, interval, timestamp);
      }

      return items.length;
    });

    return upsert(histories);
  }

  clear(): void {
    const stmt = this.db.prepare('DELETE FROM price_history');
    stmt.run();
  }
}