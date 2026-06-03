const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');

function setupCurrenciesRoute(app, currencyStore) {
  app.get('/currencies', (req, res) => {
    res.json(currencyStore.getCurrencies());
  });

  app.get('/currencies/:id', (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new ValidationError('Invalid currency ID');
      }

      const currency = currencyStore.getCurrencyById(id);
      if (!currency) {
        throw new NotFoundError('Currency not found');
      }
      res.json(currency);
    } catch (err) {
      next(err);
    }
  });

  app.post('/currencies', (req, res, next) => {
    try {
      const { name, ticker } = req.body || {};
      if (!name || !ticker) {
        throw new ValidationError('Fields "name" and "ticker" are required');
      }
      
      const created = currencyStore.addCurrency({ name, ticker });
      res.status(201).json(created);
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return next(new ValidationError('Currency with this ticker already exists'));
      }
      next(err);
    }
  });

  app.put('/currencies/:id', (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new ValidationError('Invalid currency ID');
      }
      
      const updated = currencyStore.updateCurrency(id, req.body);
      if (!updated) {
        throw new NotFoundError('Currency not found');
      }
      res.json(updated);
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return next(new ValidationError('Currency with this ticker already exists'));
      }
      next(err);
    }
  });

  app.delete('/currencies/:id', (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new ValidationError('Invalid currency ID');
      }
      
      const deleted = currencyStore.deleteCurrency(id);
      if (!deleted) {
        throw new NotFoundError('Currency not found');
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
}

module.exports = setupCurrenciesRoute;