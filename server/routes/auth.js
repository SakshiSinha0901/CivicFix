const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Letters, spaces, hyphens, and apostrophes only -- catches a name like
// "12345" or "John123" that a well-meaning frontend check could otherwise
// be bypassed for (e.g. a request sent directly through Postman, skipping
// the browser entirely). This is the SAME rule as Signup.jsx's frontend
// check, kept here too on purpose -- never trust that validation only
// happened on the client.
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]*$/;

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are all required.' });
  }

  if (!NAME_PATTERN.test(name.trim())) {
    return res.status(400).json({ error: 'Full name can only contain letters (no numbers or symbols).' });
  }

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while creating the account.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Deliberately vague on purpose: we say "Invalid email or password" whether
    // the email doesn't exist OR the password is wrong. If we said something
    // different for each case, an attacker could use that to figure out which
    // emails are registered on our site -- so we never let on which one failed.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // bcrypt.compare re-hashes the submitted password using the same method
    // and safely checks it against the stored hash -- we never decrypt anything.
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Login succeeded -- issue a signed JWT "ID card".
    // The payload only contains non-sensitive identifying info (id, role),
    // never the password or password_hash.
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // token stops working after 7 days, forcing a fresh login
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while logging in.' });
  }
});

module.exports = router;
