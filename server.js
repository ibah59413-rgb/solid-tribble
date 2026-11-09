require('dotenv').config();

const app = require('./src/app');
const { initializeDatabase, closeDatabase } = require('./src/config/db');

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it in your .env file.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET is required and must be at least 32 characters.');
  }

  await initializeDatabase();
  const server = app.listen(PORT, () => {
    console.log(`Banna AI backend listening on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Backend startup failed:', error.message);
  process.exit(1);
});
