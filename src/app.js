const express = require('express');
const cors = require('cors');
const { getDatabaseStatus } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : [];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS.'));
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ app: 'Banna AI API', status: 'running', health: '/api/health' });
});
app.get('/api/health', (req, res) => {
  const database = getDatabaseStatus();
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'unavailable',
    database,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }
  if (error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ message: error.message });
  }
  console.error('Request error:', error.message);
  return res.status(500).json({ message: 'Internal server error.' });
});

module.exports = app;
