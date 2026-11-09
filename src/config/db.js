const { Client } = require('pg');

let client = null;
let databaseStatus = 'disconnected';

function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    databaseStatus = 'not-configured';
    console.log('DATABASE_URL not set. Running with in-memory fallback data.');
    return null;
  }

  if (client) {
    return client;
  }

  client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  client
    .connect()
    .then(() => {
      databaseStatus = 'connected';
      console.log('PostgreSQL connected successfully.');
    })
    .catch((error) => {
      databaseStatus = 'error';
      console.error('Failed to connect to PostgreSQL:', error.message);
      client = null;
    });

  return client;
}

function getDbClient() {
  return client;
}

function getDatabaseStatus() {
  return databaseStatus;
}

module.exports = {
  initializeDatabase,
  getDbClient,
  getDatabaseStatus
};
