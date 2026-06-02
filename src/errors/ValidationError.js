const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message, context = {}) {
    super(message, 400, context);
  }
}

module.exports = ValidationError;