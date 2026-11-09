const express = require('express');
const router = express.Router();

const { getDbClient } = require('../config/db');
const { getUsers, getUserById, createUser } = require('../data/store');

router.get('/', async (req, res) => {
  const db = getDbClient();

  if (db) {
    try {
      const result = await db.query('SELECT * FROM users ORDER BY id ASC');
      return res.json(result.rows);
    } catch (error) {
      console.error('User fetch failed:', error.message);
    }
  }

  return res.json(getUsers());
});

router.get('/:id', async (req, res) => {
  const db = getDbClient();
  const { id } = req.params;

  if (db) {
    try {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(result.rows[0]);
    } catch (error) {
      console.error('User lookup failed:', error.message);
    }
  }

  const user = getUserById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(user);
});

router.post('/', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  const db = getDbClient();

  if (db) {
    try {
      const result = await db.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('User creation failed:', error.message);
    }
  }

  const newUser = createUser({ name, email });
  return res.status(201).json(newUser);
});

module.exports = router;
