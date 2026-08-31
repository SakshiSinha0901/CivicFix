const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');

const app = express();
const PORT = 3000;

// cors() with no arguments allows requests from any origin -- fine for
// local development. Before deploying for real, we'll lock this down to
// only allow our actual live front-end address, instead of "anywhere."
app.use(cors());

// This lets our server understand JSON data sent in requests
// (e.g. the name/email/password someone submits when signing up).
// Without this line, req.body would be undefined and signup would break.
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the CivicFix server!');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Database connected! Current time from Postgres: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection failed: ' + err.message);
  }
});

// Any route starting with /api/auth (like /api/auth/signup) is handled
// by the router we defined in routes/auth.js.
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Catches errors passed via next(err) anywhere above -- in practice this is
// almost always the photo-upload middleware rejecting a file (too big, or
// not an image), since everything else already handles its own errors with
// try/catch. Without this, Express's default error page would send back
// HTML instead of JSON, which would break the front-end's error handling.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Something went wrong with your upload.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
