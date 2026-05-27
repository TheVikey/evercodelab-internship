const express = require('express');
const setupStatusRoute = require('./routes/routes_status');
const config = require('./config');
const createAuthMiddleware = require('./middleware/auth');
const setupCurrenciesRoute = require('./routes/routes_currencies');
const currencyStore = require('./store/store_currencies');
const setupPriceRoute = require('./routes/routes_price');

function createApp(options = {}) {
  const app = express();
  app.use(express.json());

  setupStatusRoute(app);

  const authMiddleware = createAuthMiddleware(options.authToken || config.authToken);
  app.use(authMiddleware);

  setupCurrenciesRoute(app, currencyStore);
  setupPriceRoute(app, currencyStore);

  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message,
      timestamp: err.timestamp || new Date().toISOString()
    });
  });

  return app;
}

module.exports = createApp;

