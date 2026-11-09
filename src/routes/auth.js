const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../config/db');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Try again later.' }
});
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name || name.length > 100 || !emailPattern.test(email) || email.length > 254 || password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: 'Provide a name (max 100 characters), valid email, and password (8–72 characters).' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await getDb().query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, passwordHash]
    );
    const user = result.rows[0];
    return res.status(201).json({ user, token: issueToken(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await getDb().query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    delete user.password_hash;
    return res.json({ user, token: issueToken(user) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
