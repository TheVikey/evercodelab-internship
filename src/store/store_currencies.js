let currencies = [];

function getCurrencies() { return [...currencies]; }

function getCurrencyById(id) { return currencies.find(c => c.id === id); }

function addCurrency({ name, ticker }) {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const currency = { id, name, ticker };
  currencies.push(currency);
  return currency;
}

function updateCurrency(id, { name, ticker }) {
  const index = currencies.findIndex(c => c.id === id);
  if (index === -1) return null;
  currencies[index] = { ...currencies[index], ...(name && { name }), ...(ticker && { ticker }) };
  return currencies[index];
}

function deleteCurrency(id) {
  const index = currencies.findIndex(c => c.id === id);
  if (index === -1) return false;
  currencies.splice(index, 1);
  return true;
}

function reset() { currencies = []; }

module.exports = { getCurrencies, getCurrencyById, addCurrency, updateCurrency, deleteCurrency, reset };