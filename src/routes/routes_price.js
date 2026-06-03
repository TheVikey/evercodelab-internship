const { fetchBinancePrices } = require('../services/services_binanceClient');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');

function setupPriceRoute(app, currencyStore) {
  app.get('/price', async (req, res, next) => {
    try {
      const { currency } = req.query;

      if (!currency || typeof currency !== 'string' || currency.trim() === '') {
        return next(new ValidationError('Query parameter "currency" is required'));
      }

      const ticker = currency.trim().toUpperCase();

      const exists = currencyStore.getCurrencyByTicker(ticker);
      if (!exists) {
        return next(new NotFoundError(`Currency "${ticker}" not found in local database`));
      }

      const allPrices = await fetchBinancePrices();
      const filtered = allPrices.filter(p => p.symbol.includes(ticker));

      res.json(filtered);
    } catch (err) {
      next(err);
    }
  });
}

module.exports = setupPriceRoute;