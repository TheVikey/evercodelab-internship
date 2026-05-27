const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');

function setupCurrenciesRoute(app, currencyStore) {
  // GET /currencies
  app.get('/currencies', (req, res) => {
    res.json(currencyStore.getCurrencies());
  });

  // POST /currencies
  app.post('/currencies', (req, res) => {
    const { name, ticker } = req.body || {};
    if (!name || !ticker) throw new ValidationError('Fields "name" and "ticker" are required');
    const created = currencyStore.addCurrency({ name, ticker });
    res.status(201).json(created);
  });

  // PUT /currencies/:id
  app.put('/currencies/:id', (req, res) => {
    const updated = currencyStore.updateCurrency(req.params.id, req.body);
    if (!updated) throw new NotFoundError('Currency not found');
    res.json(updated);
  });

  // DELETE /currencies/:id
  app.delete('/currencies/:id', (req, res) => {
    const deleted = currencyStore.deleteCurrency(req.params.id);
    if (!deleted) throw new NotFoundError('Currency not found');
    res.status(204).send();
  });
}

module.exports = setupCurrenciesRoute;