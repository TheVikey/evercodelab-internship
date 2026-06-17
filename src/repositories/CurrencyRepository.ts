import type Database from 'better-sqlite3';
import type { Currency, CurrencyInput } from '../types';

export class CurrencyRepository {
    private db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;
        this._initTables();
    }

    private _initTables(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ticker TEXT NOT NULL UNIQUE
      )
    `);
    }

    getAll(): Currency[] {
        const stmt = this.db.prepare('SELECT id, name, ticker FROM currencies');
        return stmt.all() as Currency[];
    }

    getById(id: number): Currency | undefined {
        const stmt = this.db.prepare('SELECT id, name, ticker FROM currencies WHERE id = ?');
        return stmt.get(id) as Currency | undefined;
    }

    getByTicker(ticker: string): Currency | undefined {
        const stmt = this.db.prepare('SELECT id, name, ticker FROM currencies WHERE ticker = ?');
        return stmt.get(ticker) as Currency | undefined;
    }

    create({ name, ticker }: CurrencyInput): Currency {
        const insert = this.db.transaction((n: string, t: string): Currency => {
            const stmt = this.db.prepare('INSERT INTO currencies (name, ticker) VALUES (?, ?)');
            const result = stmt.run(n, t);
            return { id: Number(result.lastInsertRowid), name: n, ticker: t };
        });

        return insert(name, ticker);
    }

    update(id: number, { name, ticker }: Partial<CurrencyInput>): Currency | null {
        const update = this.db.transaction((id: number, updates: Partial<CurrencyInput>): Currency | null => {
            const fields: string[] = [];
            const values: (string | number)[] = [];

            if (updates.name !== undefined) {
                fields.push('name = ?');
                values.push(updates.name);
            }

            if (updates.ticker !== undefined) {
                fields.push('ticker = ?');
                values.push(updates.ticker);
            }

            if (fields.length === 0) {
                return this.getById(id) ?? null;
            }

            values.push(id);
            const sql = `UPDATE currencies SET ${fields.join(', ')} WHERE id = ?`;
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...values);

            if (result.changes === 0) {
                return null;
            }

            return this.getById(id) ?? null;
        });

        return update(id, { name, ticker });
    }

    delete(id: number): boolean {
        const stmt = this.db.prepare('DELETE FROM currencies WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    reset(): void {
        const stmt = this.db.prepare('DELETE FROM currencies');
        stmt.run();

        const resetAutoincrement = this.db.prepare(
            "DELETE FROM sqlite_sequence WHERE name = 'currencies'"
        );
        resetAutoincrement.run();
    }
}