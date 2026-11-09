const { Pool } = require('pg');
const fs = require('node:fs/promises');
const path = require('node:path');

let pool;
let databaseStatus = 'disconnected';

function getDb() {
  if (!pool) {
    throw new Error('Database has not been initialized.');
  }
  return pool;
}

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    max: Number(process.env.DATABASE_POOL_SIZE) || 10,
    connectionTimeoutMillis: 10000
  });
  pool.on('error', (error) => {
    databaseStatus = 'error';
    console.error('Unexpected PostgreSQL pool error:', error.message);
  });

  await pool.query('SELECT 1');
  const schema = await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await pool.query(schema);
  databaseStatus = 'connected';
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
    databaseStatus = 'disconnected';
  }
}

function getDatabaseStatus() {
  return databaseStatus;
}

module.exports = { getDb, initializeDatabase, closeDatabase, getDatabaseStatus };
