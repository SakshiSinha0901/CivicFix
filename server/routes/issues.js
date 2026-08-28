const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

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
//
// This query does a LEFT JOIN against the upvotes table: think of it as
// temporarily attaching every matching upvote row to its issue, so we can
// COUNT() how many are attached to each one. LEFT JOIN (rather than a plain
// JOIN) means an issue with ZERO upvotes still shows up, just with a count
// of 0, instead of disappearing from the list entirely. GROUP BY issues.id
// tells Postgres "count per issue," not one grand total for everything.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT issues.*, COUNT(upvotes.user_id) AS upvote_count
       FROM issues
       LEFT JOIN upvotes ON upvotes.issue_id = issues.id
       GROUP BY issues.id
       ORDER BY issues.created_at DESC`
    );
    res.json({ issues: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching issues.' });
  }
});

// Get a single issue by its id -- also public, and now includes the same
// upvote_count calculation so the future Issue Detail page has it too.
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT issues.*, COUNT(upvotes.user_id) AS upvote_count
       FROM issues
       LEFT JOIN upvotes ON upvotes.issue_id = issues.id
       WHERE issues.id = $1
       GROUP BY issues.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    res.json({ issue: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching the issue.' });
  }
});

// Upvote an issue -- requires login, since we need to know WHO is upvoting
// (to enforce "one upvote per user per issue").
router.post('/:id/upvote', requireAuth, async (req, res) => {
  const issueId = req.params.id;
  const userId = req.user.id;

  try {
    // First, make sure the issue being upvoted actually exists.
    const issueCheck = await pool.query('SELECT id FROM issues WHERE id = $1', [issueId]);
    if (issueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    await pool.query(
      'INSERT INTO upvotes (issue_id, user_id) VALUES ($1, $2)',
      [issueId, userId]
    );

    res.status(201).json({ message: 'Upvoted successfully.' });
  } catch (err) {
    // Postgres error code 23505 means "unique_violation" -- this is exactly
    // our UNIQUE(issue_id, user_id) rule from the database design catching
    // an attempt to upvote the same issue twice. We turn that into a clean,
    // friendly response instead of a generic server crash message.
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already upvoted this issue.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while upvoting.' });
  }
});

// Update an issue's status -- ADMIN ONLY. Notice two middlewares chained
// in a row: requireAuth runs first (proves who you are), then requireAdmin
// runs (checks your role). If either fails, the route body never runs.
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['reported', 'in_progress', 'resolved'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: `Status must be one of: ${allowedStatuses.join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      'UPDATE issues SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    res.json({ issue: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while updating the status.' });
  }
});

module.exports = router;
