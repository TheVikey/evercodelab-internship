import type Database from 'better-sqlite3';
import type { BlockHeight } from '../types';

export class BlockchainRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this._initTables();
  }

  private _initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS block_height (
        blockchain TEXT PRIMARY KEY,
        height INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  getBlockHeight(blockchain: string): BlockHeight | undefined {
    const stmt = this.db.prepare(
      'SELECT blockchain, height, updated_at FROM block_height WHERE blockchain = ?'
    );
    return stmt.get(blockchain) as BlockHeight | undefined;
  }

  updateBlockHeight(blockchain: string, height: number): BlockHeight {
    const upsert = this.db.transaction((bc: string, h: number): BlockHeight => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO block_height (blockchain, height, updated_at)
        VALUES (?, ?, datetime('now'))
      `);
      stmt.run(bc, h);
      return { blockchain: bc, height: h, updated_at: new Date().toISOString() };
    });

    return upsert(blockchain, height);
  }

  reset(): void {
    const stmt = this.db.prepare('DELETE FROM block_height');
    stmt.run();
  }
}