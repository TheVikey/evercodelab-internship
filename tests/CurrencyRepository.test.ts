import Database from 'better-sqlite3';
import { CurrencyRepository } from '../src/repositories/CurrencyRepository';

describe('CurrencyRepository', () => {
    let db: Database.Database;
    let repo: CurrencyRepository;

    beforeEach(() => {
        db = new Database(':memory:');
        db.pragma('foreign_keys = ON');
        repo = new CurrencyRepository(db);
    });

    afterEach(() => {
        db.close();
    });

    describe('create', () => {
        test('should create currency and return object with numeric id', () => {
            const result = repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            expect(result).toHaveProperty('id');
            expect(typeof result.id).toBe('number');
            expect(result.name).toBe('Bitcoin');
            expect(result.ticker).toBe('BTC');
        });

        test('should auto-increment id', () => {
            const first = repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            const second = repo.create({ name: 'Ethereum', ticker: 'ETH' });
            expect(second.id).toBe(first.id + 1);
        });

        test('should throw on duplicate ticker', () => {
            repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            expect(() => {
                repo.create({ name: 'Bitcoin Copy', ticker: 'BTC' });
            }).toThrow(/UNIQUE constraint failed/);
        });
    });

    describe('getAll', () => {
        test('should return empty array when no currencies', () => {
            expect(repo.getAll()).toEqual([]);
        });

        test('should return all created currencies', () => {
            repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            repo.create({ name: 'Ethereum', ticker: 'ETH' });
            expect(repo.getAll()).toHaveLength(2);
        });
    });

    describe('getById', () => {
        test('should return currency by valid id', () => {
            const created = repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            const result = repo.getById(created.id);
            expect(result?.name).toBe('Bitcoin');
        });

        test('should return undefined for non-existent id', () => {
            expect(repo.getById(99999)).toBeUndefined();
        });
    });

    describe('getByTicker', () => {
        test('should return currency by valid ticker', () => {
            repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            expect(repo.getByTicker('BTC')?.name).toBe('Bitcoin');
        });

        test('should return undefined for non-existent ticker', () => {
            expect(repo.getByTicker('NONEXISTENT')).toBeUndefined();
        });
    });

    describe('update', () => {
        test('should update name only', () => {
            const created = repo.create({ name: 'Old', ticker: 'OLD' });
            const updated = repo.update(created.id, { name: 'New' });
            expect(updated?.name).toBe('New');
            expect(updated?.ticker).toBe('OLD');
        });

        test('should return null for non-existent id', () => {
            expect(repo.update(99999, { name: 'Ghost' })).toBeNull();
        });

        test('should throw on duplicate ticker during update', () => {
            repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            const eth = repo.create({ name: 'Ethereum', ticker: 'ETH' });
            expect(() => {
                repo.update(eth.id, { ticker: 'BTC' });
            }).toThrow(/UNIQUE constraint failed/);
        });
    });

    describe('delete', () => {
        test('should delete and return true', () => {
            const created = repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            expect(repo.delete(created.id)).toBe(true);
            expect(repo.getById(created.id)).toBeUndefined();
        });

        test('should return false for non-existent id', () => {
            expect(repo.delete(99999)).toBe(false);
        });
    });

    describe('reset', () => {
        test('should remove all currencies and reset auto-increment', () => {
            repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            repo.reset();
            expect(repo.getAll()).toHaveLength(0);

            const fresh = repo.create({ name: 'Ethereum', ticker: 'ETH' });
            expect(fresh.id).toBe(1);
        });
    });

    describe('SQL injection protection', () => {
        test('getByTicker should not be vulnerable to OR injection', () => {
            repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            expect(repo.getByTicker("' OR '1'='1")).toBeUndefined();
        });

        test('create should safely store SQL-like strings', () => {
            const malicious = "'; DROP TABLE currencies; --";
            const result = repo.create({ name: 'Malicious', ticker: malicious });
            expect(result.ticker).toBe(malicious);
            expect(repo.getAll()).toHaveLength(1);
        });

        test('delete should not be vulnerable to injection', () => {
            repo.create({ name: 'Bitcoin', ticker: 'BTC' });
            repo.create({ name: 'Ethereum', ticker: 'ETH' });
            expect(repo.delete('1 OR 1=1' as any)).toBe(false);
            expect(repo.getAll()).toHaveLength(2);
        });
    });
});