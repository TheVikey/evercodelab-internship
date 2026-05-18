class NotFoundError extends Error {
  constructor(message, context = {}) {
    super(message);

    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.timestamp = new Date().toISOString();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = NotFoundError;