import createLogger from './logger';
import createScheduler from './scheduler';
import { createApp } from './app';
import { createPriceUpdater } from './services/PriceUpdater';
import { createBlockchainUpdater } from './services/BlockchainUpdater';
import { createPriceHistoryUpdater } from './services/PriceHistoryUpdater';
import { fetchBinancePrices } from './services/BinanceClient';
import { getBlockHeight } from './services/BlockchainClient';
import { createWalletBalanceUpdater } from './services/WalletBalanceUpdater';
import { currencyStore } from './store/StoreCurrencies';
import { priceStore } from './store/StorePrices';
import { priceHistoryStore } from './store/StorePriceHistory';
import { blockchainStore } from './store/StoreBlockchain';
import { walletStore } from './store/StoreWallets';
import { closeDatabase } from './db/database';
import config from './config';

const logger = createLogger({ requestId: 'app-1' });
const scheduler = createScheduler(logger);

// Heartbeat task
scheduler.scheduleTask('heartbeat', 10000, () => {
    logger.info('running');
});

// Price update task (every 60 seconds)
const priceUpdater = createPriceUpdater({
    logger,
    currencyStore,
    priceStore,
    fetchBinancePrices
});

scheduler.scheduleTask('price-update', 60000, async () => {
    await priceUpdater.updatePrices();
});

const blockchainUpdater = createBlockchainUpdater({
    logger,
    blockchainStore,
    getBlockHeight
});

scheduler.scheduleTask('block-height-update', 10000, async () => {
    await blockchainUpdater.updateBlockHeight();
});

const priceHistoryUpdater = createPriceHistoryUpdater({
    logger,
    currencyStore,
    priceHistoryStore
});

const walletBalanceUpdater = createWalletBalanceUpdater({
    logger,
    walletStore
});

scheduler.scheduleTask('wallet-balance-update', 2 * 60 * 1000, async () => {
    await walletBalanceUpdater.updateBalances();
});

scheduler.scheduleTask('price-history-update', 5 * 60 * 1000, async () => {
    await priceHistoryUpdater.updatePriceHistory('1h');
});

// Start HTTP server
const app = createApp({
    authToken: config.authToken,
    priceStore,
    priceHistoryStore
});

const server = app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`);
});

// Graceful shutdown
function gracefulShutdown(signal: string): void {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    scheduler.stopAll();

    server.close(() => {
        logger.info('HTTP server closed');
        closeDatabase();
        logger.info('Database connection closed');
        logger.info('Shutdown complete');
        process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after 10 seconds');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));