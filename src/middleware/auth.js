const jwt = require('jsonwebtoken');
const config = require('../config');

function createAuthMiddleware() {
  return (req, res, next) => {
    const secret = config.authToken;
    
    if (!secret) {
      return res.status(403).json({ error: 'Forbidden: server not configured' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      jwt.verify(token, secret);
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  };
}

module.exports = createAuthMiddleware;