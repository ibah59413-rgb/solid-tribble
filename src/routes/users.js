const express = require('express');
const { getDb } = require('../config/db');
const { requireAuth } = require('../middleware/require-auth');

const router = express.Router();
router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const result = await getDb().query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
