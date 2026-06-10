const ValidationError = require('./errors/ValidationError');

function createScheduler(logger) {
  const intervals = [];

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

    const id = setInterval(() => {
      logger.info(`Task "${name}" started`);
      try {
        const result = task();
        if (result && typeof result.then === 'function') {
          result.catch((err) => {
            logger.error(`Task "${name}" failed: ${err.message}`);
          });
        }
      } catch (err) {
        logger.error(`Task "${name}" failed: ${err.message}`);
      }
    }, interval);

    intervals.push(id);

    return id;
  }

  function stopAll() {
    intervals.forEach(id => clearInterval(id));
    intervals.length = 0;
    logger.info('All scheduled tasks stopped');
  }

  return {
    scheduleTask,
    stopAll
  };
}

module.exports = createScheduler;