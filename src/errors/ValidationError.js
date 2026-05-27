class ValidationError extends Error {
  constructor(message, context = {}) {
    super(message);

    this.name = 'ValidationError';
    this.statusCode = 400;
    this.timestamp = new Date().toISOString();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ValidationError;