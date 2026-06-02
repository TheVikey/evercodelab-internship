const config = require('./config');

function createLogger(context = {}) {

  function log(level, message) {
    const time = new Date().toISOString();

    const formattedMessage =
      `[${time}] [${level}] [${config.appName}]` +
      `${context.requestId ? ` [${context.requestId}]` : ''} ` +
      `${message}`;

    switch (level) {
      case 'ERROR': console.error(formattedMessage); break;
      case 'WARN':  console.warn(formattedMessage);  break;
      case 'INFO':  console.info(formattedMessage);  break;
      case 'DEBUG': console.debug(formattedMessage); break;
      case 'TRACE': console.trace(formattedMessage); break;
      default:      console.log(formattedMessage);
    }
  }

  return {
    error: (message) => log('ERROR', message),
    warn:  (message) => log('WARN', message),
    info:  (message) => log('INFO', message),
    debug: (message) => log('DEBUG', message),
    trace: (message) => log('TRACE', message)
  };
}

module.exports = createLogger;