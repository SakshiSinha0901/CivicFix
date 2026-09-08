require('dotenv').config();
const { Pool } = require('pg');

// A "Pool" manages a small group of ready-to-use connections to Postgres,
// so our app isn't opening/closing a brand new connection for every single
// query -- it reuses connections from this pool, which is much faster.
//
// This now supports TWO ways of connecting, depending on where the code is
// running:
//
// 1. DATABASE_URL -- a single connection string ("postgresql://user:pass@host/db")
//    that hosted database providers (Neon, in our case) hand you. This is
//    what production -- the backend once it's running on Render -- will use.
//
// 2. The five separate DB_USER/DB_HOST/DB_NAME/DB_PASSWORD/DB_PORT variables --
//    what your local .env file already has, for developing on your own machine.
//
// We check for DATABASE_URL first. If it's not set (which is true on your
// local machine, since your local .env never defines it), we fall back to
// the five separate variables -- so local development keeps working exactly
// as it always has, with zero changes needed to your local .env file.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // Neon (and most hosted Postgres providers) require an encrypted
      // connection. "rejectUnauthorized: false" tells Node to skip verifying
      // the provider's SSL certificate chain -- the connection is still
      // encrypted either way, this just avoids a certificate-verification
      // error that's common when connecting from hosting platforms like Render.
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

module.exports = pool;
