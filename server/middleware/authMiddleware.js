const jwt = require('jsonwebtoken');

// Checks that a request has a valid, logged-in user attached (via JWT).
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

// Checks that the logged-in user is specifically an admin.
// IMPORTANT: this must always run AFTER requireAuth on a route, since it
// depends on req.user already being set. It only checks the ROLE --
// requireAuth already proved WHO the user is.
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required for this action.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
