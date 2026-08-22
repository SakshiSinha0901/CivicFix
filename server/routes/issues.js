const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new issue -- requireAuth runs first; if it fails, this code never executes.
router.post('/', requireAuth, async (req, res) => {
  const { title, description, category, photo_url, location } = req.body;

  // IMPORTANT: we get the user's id from req.user (set by our verified token),
  // NOT from anything the client sent in the request body. If we trusted a
  // "user_id" field in the body instead, anyone could fake being a different
  // user just by typing a different number -- using the token instead makes
  // that impossible, since the token can't be forged without our JWT_SECRET.
  const userId = req.user.id;

  if (!title || !category || !location) {
    return res.status(400).json({ error: 'Title, category, and location are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO issues (user_id, title, description, category, photo_url, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, description || null, category, photo_url || null, location]
    );
    res.status(201).json({ issue: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while creating the issue.' });
  }
});

// Get all issues -- deliberately public, no requireAuth here.
// Anyone should be able to browse reported issues, even without an account.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM issues ORDER BY created_at DESC');
    res.json({ issues: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching issues.' });
  }
});

// Get a single issue by its id -- also public.
// ":id" in the route path means "whatever value is here, make it available as req.params.id"
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    res.json({ issue: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching the issue.' });
  }
});

module.exports = router;
