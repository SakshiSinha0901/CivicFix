// A tiny one-off script -- NOT a route, nothing to do with the running
// server -- that reads schema.sql and runs it against whichever database
// your .env currently points at (via the same connection pool db.js
// already sets up). This is what "set up the database from code instead
// of by hand" actually means in practice: run this file once against a
// fresh database, and it creates all three tables for you.
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running schema.sql against the database...');

  try {
    // pool.query() with no parameters sends the whole file as one request,
    // and Postgres is fine running multiple ";"-separated statements that
    // way -- so all three CREATE TABLE statements run together.
    await pool.query(schemaSql);
    console.log('Done -- users, issues, and upvotes tables exist (created just now, or already did).');
  } catch (err) {
    console.error('Something went wrong while running the schema:', err.message);
    process.exitCode = 1;
  } finally {
    // Without this, the script would hang forever instead of exiting --
    // the connection pool stays open waiting for more queries by default.
    await pool.end();
  }
}

runSchema();
