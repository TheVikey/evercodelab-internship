import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDatabase(dbPath?: string): Database.Database {
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

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}