const createLogger = require('./logger');
const createScheduler = require('./scheduler');
const createApp = require('./app');
const createPriceUpdater = require('./services/priceUpdater');

const config = require('./config');
const currencyStore = require('./store/store_currencies');
const priceStore = require('./store/store_prices');
const { fetchBinancePrices } = require('./services/services_binanceClient');
const { closeDatabase } = require('./db/database');

const logger = createLogger({ requestId: 'app-1' });
const scheduler = createScheduler(logger);

scheduler.scheduleTask("heartbeat", 10000, () => {
  logger.info('running');
});

const priceUpdater = createPriceUpdater({
  logger,
  currencyStore,
  priceStore,
  fetchBinancePrices
});

scheduler.scheduleTask('price-update', 60000, () => priceUpdater.updatePrices());

const app = createApp({
  authToken: config.authToken,
  priceStore
});

const server = app.listen(config.port, () => {
  logger.info(`Server started on port ${config.port}`);
});

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  scheduler.stopAll();

  server.close(() => {
    logger.info('HTTP server closed');

    closeDatabase();
    logger.info('Database connection closed');

    logger.info('Shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));