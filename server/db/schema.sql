-- CivicFix database schema.
--
-- This is the code version of the tables that were originally created by
-- hand in psql (see CLAUDE.md's "Database schema" section, which stays the
-- source of truth for describing WHY each column exists -- this file is
-- just the runnable version of the same thing).
--
-- IF NOT EXISTS on every table means this file is safe to run more than
-- once: on a brand-new database it creates everything from scratch, and on
-- a database that already has these tables it does nothing and doesn't
-- error out. That matters because this same file gets run both by you
-- locally (where the tables already exist) and later against Render's
-- empty production database (where they don't yet).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  photo_url TEXT,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upvotes (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (issue_id, user_id)
);
