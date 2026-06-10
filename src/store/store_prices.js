const { getDatabase } = require('../db/database');
const PriceRepository = require('../repositories/PriceRepository');

let repository = null;

function getRepository() {
  if (!repository) {
    const db = getDatabase();
    repository = new PriceRepository(db);
  }
  return repository;
}

function getAllPrices() {
  return getRepository().getAll();
}

function getPricesByTicker(ticker) {
  return getRepository().getByTicker(ticker);
}

function updatePrices(prices) {
  return getRepository().updatePrices(prices);
}

function clearPrices() {
  getRepository().clear();
}

module.exports = {
  getAllPrices,
  getPricesByTicker,
  updatePrices,
  clearPrices
};