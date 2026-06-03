const { getDatabase } = require('../db/database');
const CurrencyRepository = require('../repositories/CurrencyRepository');

let repository = null;

function getRepository() {
  if (!repository) {
    const db = getDatabase();
    repository = new CurrencyRepository(db);
  }
  return repository;
}

function getCurrencies() {
  return getRepository().getAll();
}

function getCurrencyById(id) {
  return getRepository().getById(id);
}

function getCurrencyByTicker(ticker) {
  return getRepository().getByTicker(ticker);
}

function addCurrency({ name, ticker }) {
  return getRepository().create({ name, ticker });
}

function updateCurrency(id, { name, ticker }) {
  return getRepository().update(id, { name, ticker });
}

function deleteCurrency(id) {
  return getRepository().delete(id);
}

function reset() {
  getRepository().reset();
}

module.exports = {
  getCurrencies,
  getCurrencyById,
  getCurrencyByTicker,
  addCurrency,
  updateCurrency,
  deleteCurrency,
  reset
};