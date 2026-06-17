import 'dotenv/config';
import { getDatabase, closeDatabase } from '../db/database';
import { CurrencyRepository } from '../repositories/CurrencyRepository';
import { PriceRepository } from '../repositories/PriceRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { BlockchainRepository } from '../repositories/BlockchainRepository';
import { PriceHistoryRepository } from '../repositories/PriceHistoryRepository';

try {
    console.log('Initializing database...');

    const db = getDatabase();

    new CurrencyRepository(db);
    new PriceRepository(db);
    new WalletRepository(db);
    new BlockchainRepository(db);
    new PriceHistoryRepository(db);

    console.log('Database initialized successfully!');
    console.log('Tables created: currencies, prices, wallets, block_height, price_history');

    closeDatabase();
} catch (error) {
    console.error('Failed to initialize database:', (error as Error).message);
    process.exit(1);
}