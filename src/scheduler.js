const ValidationError = require('./errors/ValidationError');

function createScheduler(logger) {

  logger.info('Scheduler started');

  function scheduleTask(name, interval, task) {

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Task name must be a non-empty string');
    }

    if (typeof interval !== 'number' || interval <= 0) {
      throw new ValidationError('Interval must be a positive number');
    }

    if (typeof task !== 'function') {
      throw new ValidationError('Task must be a function');
    }

    logger.info(`Task "${name}" scheduled`);

    setInterval(() => {
      logger.info(`Task "${name}" started`);
      task();
    }, interval);
  }

  return {
    scheduleTask
  };
}

module.exports = createScheduler;