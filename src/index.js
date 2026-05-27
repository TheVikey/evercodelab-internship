const createLogger = require('./logger');
const createScheduler = require('./scheduler');
const createApp = require('./app');

const config = require('./config');

const logger = createLogger({requestID: 'app-1'});
const scheduler = createScheduler(logger);

scheduler.scheduleTask("heartbeat", 10000, () => {
  logger.info('running');
});

const app = createApp({ authToken: config.authToken });
const server = app.listen(config.port, () => {
  logger.info(`Server started on port ${config.port}`);
});