const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const uploadPhoto = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Create a new issue -- requireAuth runs first (proves who's reporting),
// then uploadPhoto runs (reads an optional "photo" file off the request,
// same idea as requireAuth reading the token -- it's middleware that
// prepares something the route handler below needs, in this case
// req.file instead of req.user).
router.post('/', requireAuth, uploadPhoto, async (req, res) => {
  // Text fields land in req.body whether the request was JSON (old clients)
  // or multipart/form-data (the Report Issue form, now that it sends a
  // real file) -- multer parses both kinds of non-file fields the same way.
  const { title, description, category, location } = req.body;

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
    // The photo is optional -- only try to upload if the form actually
    // included one. req.file.buffer is the raw image bytes multer kept in
    // memory (see uploadMiddleware.js); Cloudinary's upload() accepts a
    // "data URI" string (a base64-encoded copy of those same bytes with a
    // little header describing the file type) just as easily as a real
    // file path, which keeps this simple -- no temp files on our server.
    let photoUrl = null;
    if (req.file) {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'civicfix-issues',
      });
      photoUrl = uploadResult.secure_url;
    }

    const result = await pool.query(
      `INSERT INTO issues (user_id, title, description, category, photo_url, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, description || null, category, photoUrl, location]
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
//
// Optional filtering: ?category=Pothole and/or ?location=maple in the URL
// (req.query holds whatever comes after the "?" in the request URL). Both
// are optional -- with neither, this behaves exactly as before and returns
// every issue. We build the WHERE clause piece by piece depending on which
// filters were actually sent, so "only category" and "only location" and
// "both" and "neither" all work from the same route.
router.get('/', async (req, res) => {
  const { category, location } = req.query;

  // $1, $2, etc. are placeholders -- Postgres fills them in safely from the
  // "values" array below. We NEVER paste req.query values directly into the
  // SQL string ourselves; that's exactly the kind of mistake that lets an
  // attacker sneak their own SQL in through a search box (SQL injection).
  const conditions = [];
  const values = [];

  if (category) {
    values.push(category);
    conditions.push(`issues.category = $${values.length}`);
  }

  if (location) {
    // ILIKE is Postgres's case-insensitive LIKE. Wrapping the search term in
    // % wildcards means "contains this text anywhere," so searching "maple"
    // matches a location of "Maple Rd & 3rd St" instead of requiring an
    // exact, full match nobody would realistically type.
    values.push(`%${location}%`);
    conditions.push(`issues.location ILIKE $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT issues.*, COUNT(upvotes.user_id) AS upvote_count
       FROM issues
       LEFT JOIN upvotes ON upvotes.issue_id = issues.id
       ${whereClause}
       GROUP BY issues.id
       ORDER BY issues.created_at DESC`,
      values
    );
    res.json({ issues: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching issues.' });
  }
});

// Get only the logged-in user's own issues -- powers the "My Reports" page.
// requireAuth first, so req.user.id is always the REAL logged-in user (never
// something a client could fake by passing a different id), same pattern as
// POST / above. Placed before the "/:id" route so Express doesn't mistake
// the literal word "mine" for an :id value.
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT issues.*, COUNT(upvotes.user_id) AS upvote_count
       FROM issues
       LEFT JOIN upvotes ON upvotes.issue_id = issues.id
       WHERE issues.user_id = $1
       GROUP BY issues.id
       ORDER BY issues.created_at DESC`,
      [req.user.id]
    );
    res.json({ issues: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching your issues.' });
  }
});

// Get a single issue by its id -- also public, and now includes the same
// upvote_count calculation so the future Issue Detail page has it too.
//
// Also JOINs against users to pull in the reporter's name. This is a plain
// JOIN (not LEFT JOIN like upvotes) because every issue is required to have
// a user_id -- reporting requires being logged in -- so there's always
// exactly one matching users row, unlike upvotes where an issue can
// legitimately have zero. "users.name AS reporter_name" renames the column
// in the response so it doesn't collide with the issue's own "name"-shaped
// fields and reads clearly on the frontend.
//
// GROUP BY needs both issues.id and users.id here: Postgres only allows
// selecting a table's other columns (like users.name) without wrapping them
// in an aggregate function like COUNT() if you've grouped by that table's
// primary key -- proving each group has exactly one value for that column.
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT issues.*, users.name AS reporter_name, COUNT(upvotes.user_id) AS upvote_count
       FROM issues
       JOIN users ON users.id = issues.user_id
       LEFT JOIN upvotes ON upvotes.issue_id = issues.id
       WHERE issues.id = $1
       GROUP BY issues.id, users.id`,
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
