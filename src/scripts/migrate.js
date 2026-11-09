require('dotenv').config();

const { initializeDatabase, closeDatabase } = require('../config/db');

initializeDatabase()
  .then(() => console.log('Database schema is up to date.'))
  .catch((error) => {
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
