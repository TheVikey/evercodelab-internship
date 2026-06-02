class AppError extends Error {
  constructor(message, statusCode, context = {}) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;