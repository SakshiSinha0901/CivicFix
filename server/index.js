const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello from the CivicFix server!');
});

// A test route to prove the server can actually talk to Postgres.
// We'll remove/replace this once we build the real API routes.
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Database connected! Current time from Postgres: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection failed: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
