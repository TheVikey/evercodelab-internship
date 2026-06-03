require('dotenv').config();
const { getDatabase, closeDatabase } = require('../db/database');
const CurrencyRepository = require('../repositories/CurrencyRepository');

try {
  console.log('Initializing database...');
  
  const db = getDatabase();
  const repository = new CurrencyRepository(db);
  
  console.log('Database initialized successfully!');
  console.log('Tables created: currencies');
  
  closeDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error.message);
  process.exit(1);
}