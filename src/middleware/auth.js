const jwt = require('jsonwebtoken');
const config = require('../config');
const ForbiddenError = require('../errors/ForbiddenError');

function createAuthMiddleware(tokenOverride) {
  return (req, res, next) => {
    const secret = tokenOverride || config.authToken;

    if (!secret) {
      throw new ForbiddenError('Server not configured');
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      throw new ForbiddenError('Forbidden');
    }

    try {
      jwt.verify(token, secret);
      next();
    } catch (err) {
      throw new ForbiddenError('Forbidden');
    }
  };
}

module.exports = createAuthMiddleware;