const logger = require('./logger');

logger("Scheduler started");

function scheduleTask(name, interval, task) {
  setInterval(() => {
    logger(`Task "${name}" started`);
    task();
  }, interval);
}

module.exports = scheduleTask;