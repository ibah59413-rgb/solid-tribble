const express = require('express');
const cors = require('cors');

const { initializeDatabase } = require('./config/db');
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

initializeDatabase();

app.get('/', (req, res) => {
  res.json({
    message: 'Solid Tribble backend is running',
    version: '1.0.0',
    docs: '/api/health'
  });
});

app.use('/api', healthRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server.'
  });
});

module.exports = app;
