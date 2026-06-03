class CurrencyRepository {
  constructor(db) {
    this.db = db;
    this._initTables();
  }

  _initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ticker TEXT NOT NULL UNIQUE
      )
    `);
  }

  getAll() {
    const stmt = this.db.prepare('SELECT id, name, ticker FROM currencies');
    return stmt.all();
  }

  getById(id) {
    const stmt = this.db.prepare('SELECT id, name, ticker FROM currencies WHERE id = ?');
    return stmt.get(id);
  }

  getByTicker(ticker) {
    const stmt = this.db.prepare('SELECT id, name, ticker FROM currencies WHERE ticker = ?');
    return stmt.get(ticker);
  }

  create({ name, ticker }) {
    const insert = this.db.transaction((name, ticker) => {
      const stmt = this.db.prepare('INSERT INTO currencies (name, ticker) VALUES (?, ?)');
      const result = stmt.run(name, ticker);
      return { id: result.lastInsertRowid, name, ticker };
    });

    return insert(name, ticker);
  }

  update(id, { name, ticker }) {
    const update = this.db.transaction((id, updates) => {
      const fields = [];
      const values = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }

      if (updates.ticker !== undefined) {
        fields.push('ticker = ?');
        values.push(updates.ticker);
      }

      if (fields.length === 0) {
        return this.getById(id);
      }

      values.push(id);
      const sql = `UPDATE currencies SET ${fields.join(', ')} WHERE id = ?`;
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        return null;
      }

      return this.getById(id);
    });

    return update(id, { name, ticker });
  }

  delete(id) {
    const stmt = this.db.prepare('DELETE FROM currencies WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  reset() {
    const stmt = this.db.prepare('DELETE FROM currencies');
    stmt.run();
    
    const resetAutoincrement = this.db.prepare(
      "DELETE FROM sqlite_sequence WHERE name = 'currencies'"
    );
    resetAutoincrement.run();
  }
}

module.exports = CurrencyRepository;