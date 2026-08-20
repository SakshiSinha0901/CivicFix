const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
