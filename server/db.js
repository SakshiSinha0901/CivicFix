require('dotenv').config();
const { Pool } = require('pg');

// A "Pool" manages a small group of ready-to-use connections to Postgres,
// so our app isn't opening/closing a brand new connection for every single
// query -- it reuses connections from this pool, which is much faster.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
