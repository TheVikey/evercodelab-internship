const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function getDatabase(dbPath = null) {
  if (db) return db;

  const defaultPath = path.join(process.cwd(), 'data', 'database.sqlite');
  const finalPath = dbPath || defaultPath;

  if (finalPath !== ':memory:') {
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(finalPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };