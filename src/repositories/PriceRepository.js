class PriceRepository {
  constructor(db) {
    this.db = db;
    this._initTables();
  }

  _initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prices (
        symbol TEXT PRIMARY KEY,
        price TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  getAll() {
    const stmt = this.db.prepare('SELECT symbol, price, updated_at FROM prices');
    return stmt.all();
  }

  getByTicker(ticker) {
    const stmt = this.db.prepare(
      'SELECT symbol, price, updated_at FROM prices WHERE symbol LIKE ?'
    );
    return stmt.all(`%${ticker}%`);
  }

  updatePrices(prices) {
    if (!Array.isArray(prices) || prices.length === 0) {
      return 0;
    }

    const upsert = this.db.transaction((items) => {
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

  deleteBySymbol(symbol) {
    const stmt = this.db.prepare('DELETE FROM prices WHERE symbol = ?');
    const result = stmt.run(symbol);
    return result.changes > 0;
  }

  clear() {
    const stmt = this.db.prepare('DELETE FROM prices');
    stmt.run();
  }
}

module.exports = PriceRepository;