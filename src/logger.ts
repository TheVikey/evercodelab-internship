import config from './config';
import type { Logger, LoggerContext, LogLevel } from './types';

function createLogger(context: LoggerContext = {}): Logger {
  function log(level: LogLevel, message: string): void {
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
      case 'TRACE': console.debug(formattedMessage); break;
      default:      console.log(formattedMessage);
    }
  }

  return {
    error: (message: string) => log('ERROR', message),
    warn:  (message: string) => log('WARN', message),
    info:  (message: string) => log('INFO', message),
    debug: (message: string) => log('DEBUG', message),
    trace: (message: string) => log('TRACE', message)
  };
}

export default createLogger;