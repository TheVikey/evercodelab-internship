const config = require('./config');

function createLogger(context = {}) {

  function log(level, message) {
    const time = new Date().toISOString();

    console.log(
      `[${time}] [${level}] [${config.appName}]` +
      `${context.requestId ? ` [${context.requestId}]` : ''} ` +
      `${message}`
    );
  }

  return {
    error: (message) => log('ERROR', message),
    warn: (message) => log('WARN', message),
    info: (message) => log('INFO', message),
    debug: (message) => log('DEBUG', message),
    trace: (message) => log('TRACE', message)
  };
}

module.exports = createLogger;