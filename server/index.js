const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');

const app = express();
// Hosting platforms like Render assign their own port at run time and tell
// your app what it is through an environment variable named PORT -- your
// server has to listen on THAT port, not a hardcoded one, or Render won't be
// able to route traffic to it. "process.env.PORT || 3000" means: use
// whatever Render sets PORT to if it's set, otherwise (on your local
// machine, where PORT is never set) fall back to 3000 like before -- so
// nothing changes for local development.
const PORT = process.env.PORT || 3000;

// CORS ("Cross-Origin Resource Sharing") is the browser's own security rule
// that blocks a website from making requests to a DIFFERENT website's server
// unless that server explicitly says "this origin is allowed." Our own
// backend has to opt in to being called from our own frontend's address --
// cors() with no arguments used to opt in to being called from literally
// anywhere, which was fine for local development (localhost calling
// localhost) but not for a real, live backend.
//
// Now that we're deployed, we only allow requests whose Origin header
// matches this exact list -- our real Vercel frontend address, plus
// localhost so local development (running the frontend on your own machine
// against this same backend) still works. Any other website trying to call
// our API directly from a browser gets blocked by this.
const ALLOWED_ORIGINS = [
  'https://civic-fix-liart.vercel.app',
  'http://localhost:5173', // Vite's default local dev address
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
}));

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
app.use('/api/issues', issueRoutes);

// Catches errors passed via next(err) anywhere above -- in practice this is
// almost always the photo-upload middleware rejecting a file (too big, or
// not an image), since everything else already handles its own errors with
// try/catch. Without this, Express's default error page would send back
// HTML instead of JSON, which would break the front-end's error handling.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Something went wrong with your upload.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
