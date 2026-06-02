const AppError = require('./AppError');

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', context = {}) {
    super(message, 403, context);
  }
}

module.exports = ForbiddenError;