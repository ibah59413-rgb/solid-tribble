const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'A Bearer access token is required.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Access token is invalid or expired.' });
  }
}

module.exports = { requireAuth };
