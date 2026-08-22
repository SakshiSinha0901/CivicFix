const jwt = require('jsonwebtoken');

// This function runs BEFORE a route handler, whenever we attach it to a route.
// Its job: check that a valid JWT was sent, and figure out who's making the request.
function requireAuth(req, res, next) {
  // Browsers/Postman send the token in a header like: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  // "Bearer <token>" -- we only want the part after "Bearer ".
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify checks the token's signature against our secret.
    // If someone tampered with the token, or it wasn't signed by us,
    // or it has expired, this line throws an error automatically.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded info (id, role) onto the request object,
    // so any route using this middleware can access req.user afterward.
    req.user = decoded;

    next(); // Everything checked out -- let the actual route run.
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = requireAuth;
