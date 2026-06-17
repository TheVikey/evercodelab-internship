import type Database from 'better-sqlite3';
import type { Wallet, WalletInput } from '../types';

export class WalletRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this._initTables();
  }

  private _initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        blockchain TEXT NOT NULL,
        label TEXT,
        balance TEXT,
        balance_updated_at TEXT
      )
    `);

      try { this.db.exec("ALTER TABLE wallets ADD COLUMN balance TEXT"); } catch { }
      try { this.db.exec("ALTER TABLE wallets ADD COLUMN balance_updated_at TEXT"); } catch { }
  }

  getAll(): Wallet[] {
      const stmt = this.db.prepare('SELECT id, address, blockchain, label, balance, balance_updated_at FROM wallets');
      return stmt.all() as Wallet[];
  }

  getById(id: number): Wallet | undefined {
      const stmt = this.db.prepare('SELECT id, address, blockchain, label, balance, balance_updated_at FROM wallets WHERE id = ?');
      return stmt.get(id) as Wallet | undefined;
  }

  getByBlockchain(blockchain: string): Wallet[] {
    const stmt = this.db.prepare('SELECT id, address, blockchain, label FROM wallets WHERE blockchain = ?');
    return stmt.all(blockchain) as Wallet[];
  }

  create({ address, blockchain, label }: WalletInput): Wallet {
    const insert = this.db.transaction((addr: string, bc: string, lbl?: string): Wallet => {
      const stmt = this.db.prepare(
        'INSERT INTO wallets (address, blockchain, label) VALUES (?, ?, ?)'
      );
      const result = stmt.run(addr, bc, lbl || null);
      return { id: Number(result.lastInsertRowid), address: addr, blockchain: bc, label: lbl };
    });

    return insert(address, blockchain, label);
  }

  update(id: number, { address, blockchain, label }: Partial<WalletInput>): Wallet | null {
    const update = this.db.transaction((id: number, updates: Partial<WalletInput>): Wallet | null => {
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      if (updates.address !== undefined) {
        fields.push('address = ?');
        values.push(updates.address);
      }

      if (updates.blockchain !== undefined) {
        fields.push('blockchain = ?');
        values.push(updates.blockchain);
      }

      if (updates.label !== undefined) {
        fields.push('label = ?');
        values.push(updates.label || null);
      }

      if (fields.length === 0) {
          return this.getById(id) ?? null;
      }

      values.push(id);
      const sql = `UPDATE wallets SET ${fields.join(', ')} WHERE id = ?`;
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        return null;
      }

      return this.getById(id) ?? null;
    });

    return update(id, { address, blockchain, label });
  }

  updateBalance(id: number, balance: string): Wallet | null {
    const stmt = this.db.prepare(
      "UPDATE wallets SET balance = ?, balance_updated_at = datetime('now') WHERE id = ?"
    );
    const result = stmt.run(balance, id);
    if (result.changes === 0) return null;
    return this.getById(id) ?? null;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM wallets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  reset(): void {
    const stmt = this.db.prepare('DELETE FROM wallets');
    stmt.run();

    const resetAutoincrement = this.db.prepare(
      "DELETE FROM sqlite_sequence WHERE name = 'wallets'"
    );
    resetAutoincrement.run();
  }
}