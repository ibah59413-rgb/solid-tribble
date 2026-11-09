const express = require('express');
const router = express.Router();

const { getDatabaseStatus, getDbClient } = require('../config/db');
const { getUsers, getUserById, createUser } = require('../data/store');

router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
