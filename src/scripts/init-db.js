require('dotenv').config();
const { getDatabase, closeDatabase } = require('../db/database');
const CurrencyRepository = require('../repositories/CurrencyRepository');
const PriceRepository = require('../repositories/PriceRepository');

try {
  console.log('Initializing database...');

  const db = getDatabase();

  new CurrencyRepository(db);
  new PriceRepository(db);

  console.log('Database initialized successfully!');
  console.log('Tables created: currencies, prices');

  closeDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error.message);
  process.exit(1);
}