const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const priceStore = require('../store/store_prices');

function setupPriceRoute(app, currencyStore, priceStoreOverride) {
  const store = priceStoreOverride || priceStore;

  app.get('/price', (req, res, next) => {
    try {
      const { currency } = req.query;

      if (!currency || typeof currency !== 'string' || currency.trim() === '') {
        throw new ValidationError('Query parameter "currency" is required');
      }

      const ticker = currency.trim().toUpperCase();

      const exists = currencyStore.getCurrencyByTicker(ticker);
      if (!exists) {
        throw new NotFoundError(`Currency "${ticker}" not found in local database`);
      }

      const prices = store.getPricesByTicker(ticker);

      if (prices.length === 0) {
        throw new NotFoundError(
          `No prices found for "${ticker}". Prices may not have been fetched yet.`
        );
      }

      res.json(prices);
    } catch (err) {
      next(err);
    }
  });
}

module.exports = setupPriceRoute;