const createLogger = require('./logger');

const createScheduler = require('./scheduler');

const logger = createLogger({
requestID: 'app-1'});
const scheduler = createScheduler(logger);

scheduler.scheduleTask("heartbeat", 10000, () => {
  logger.info('running');
});