const config = require('./config');

function logger(message) {
  const time = new Date().toISOString();
  console.log(`[${config.appName}] [${time}] ${message}`);
}

module.exports = logger;