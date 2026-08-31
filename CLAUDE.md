# CLAUDE.md — CivicFix

This file briefs any AI assistant (or human) picking up this project on the stack, conventions, and decisions already made. Read this before making changes.

## About the developer

- Complete beginner at building websites/apps — this is their first full-stack project.
- Wants every technical term explained in plain English, and the *reasoning* behind decisions, not just working code — the goal is to be able to explain this project confidently in job interviews.
- Prefers to go one step at a time, not have multiple steps batched into one explanation.
- Tests every new backend route in Postman before moving on — a good habit, keep encouraging it.

## What CivicFix is

A public website for reporting local civic issues (potholes, garbage, broken streetlights, water leakage). Anyone can report an issue with a photo, category, description, and location. Other users can view nearby issues and upvote instead of filing duplicates. Each issue has a status: `reported` → `in_progress` → `resolved`. Meant to be usable nationwide, not just one city.

## Tech stack (decided — do not change without asking)

| Layer | Choice | Why |
|---|---|---|
| Front-end | React | Widely used, good for learning real front-end concepts |
| Back-end | Node.js + Express | Chosen over NestJS deliberately — NestJS's decorators/modules add structural overhead not needed for a beginner's first project |
| Database | PostgreSQL | Relational — good fit since Users, Issues, and Upvotes have real relationships |
| Image storage | Cloudinary (free tier) | Databases handle large files badly; Cloudinary stores the photo, DB stores just the URL |
| Auth | JWT | Signed "ID card" issued after login so the user doesn't need to log in on every request |
| Code hosting | GitHub | https://github.com/SakshiSinha0901/CivicFix (public) |
| Front-end hosting | Vercel (free) — not yet done | |
| Back-end + DB hosting | Render (free tier) — not yet done | |

**Explicitly not using:** NestJS.

## Frontend visual design — strict rule

`design.md` (repo root) is the single source of truth for CivicFix's visual design: color tokens, typography, spacing, and per-page component specs. Any AI assistant or contributor working on the frontend must follow `design.md` exactly and must NOT deviate from it based on its own judgment — if a change isn't covered there, or seems like it should be different, ASK THE USER FIRST rather than deciding independently. Any proposed change to `design.md` itself must be shown to the user for approval before the file is edited or before any code is changed to match a new version of it.

## Local environment

- Windows machine. Node.js v24.x, Git, VS Code, PostgreSQL 17 all installed locally.
- PostgreSQL's `bin` folder had to be manually added to the Windows PATH after install (the installer didn't do this automatically) — if `psql` isn't recognized on a fresh machine, check this first.
- Postgres superuser `postgres`, password lives only in `server/.env` (gitignored, never committed).
- Backend is run with `npm run dev` (nodemon, auto-restarts on file changes) — `npm start` still works for a plain one-off run without auto-restart.

## Cloudinary setup (photo uploads)

Signed upload, chosen deliberately over an unsigned/direct-from-browser upload so the backend can validate a file (type, size) before it reaches Cloudinary, and so the client never talks to a third-party service directly — same "server mediates everything" pattern as the rest of this app.

How it works: the Report Issue form sends the photo to `POST /api/issues` as part of a multipart form (not JSON, since JSON can't carry a raw file). `uploadMiddleware.js` (multer, memory storage) reads it into `req.file.buffer`. The route then hands that buffer to Cloudinary via `config/cloudinary.js`, gets back a URL, and saves that URL in `photo_url` — same as if the developer had typed a URL in by hand, just automated.

Three secrets are required in `server/.env` (gitignored, never committed — same file the Postgres password already lives in):
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
All three come from the Cloudinary dashboard (Settings → API Keys, after creating a free account at cloudinary.com) — never share the API secret anywhere outside this file.

**Verified working end-to-end via Postman** (real `photo_url` returned pointing to `res.cloudinary.com`). One fix made along the way: `uploadMiddleware.js`'s file-type check originally trusted `file.mimetype` alone, but some clients (Postman included, depending on how a file is picked) send the generic `application/octet-stream` label instead of a real image type — so the check now also accepts a recognized file extension (`.jpg`, `.jpeg`, `.png`, `.webp`) as a backup, and only rejects when neither the reported type nor the extension looks like a real image.

## Project structure

```
CivicFix/
├── client/              # React front-end
│   └── src/
│       ├── App.jsx      # Routes; "/" shows LandingHero (logged-out) or Home (logged-in), decided by isLoggedIn
│       ├── pages/
│       │   └── LandingHero.jsx  # Logged-out marketing page at "/" — one fixed screen; scroll crossfades hero text <-> "How it works" over a static blurred background
│       └── assets/
│           └── landing-hero-illustration.jpg  # User-generated illustration, blurred as the Landing Hero's static background
├── server/              # Express back-end
│   ├── db.js            # Postgres connection pool (reads .env)
│   ├── index.js         # App entry point; mounts routes, global error handler
│   ├── .env              # Secrets — gitignored, never commit
│   ├── db/
│   │   ├── schema.sql       # CREATE TABLE statements for users/issues/upvotes — the code version of "Database schema" below
│   │   └── runSchema.js     # One-off script: `npm run db:setup` runs schema.sql against whatever .env points at
│   ├── config/
│   │   └── cloudinary.js       # Configures the Cloudinary SDK from .env — the only file that reads those 3 secrets
│   ├── middleware/
│   │   ├── authMiddleware.js   # exports { requireAuth, requireAdmin }
│   │   └── uploadMiddleware.js # multer — reads an optional "photo" file into req.file
│   └── routes/
│       ├── auth.js      # /api/auth/signup, /api/auth/login
│       └── issues.js    # /api/issues/* (create incl. photo upload, list, mine, get, upvote, status)
├── .gitignore
├── design.md            # Frontend design system — colors, type, spacing, component specs (see "Frontend visual design" above)
└── CLAUDE.md / log.md
```

## Database schema

Originally created by hand via `psql`, now also written as code in `server/db/schema.sql` — a single idempotent SQL script (safe to run more than once, since every table uses `CREATE TABLE IF NOT EXISTS`) that can set up a brand-new database from scratch. Run it with `npm run db:setup` (from the `server` folder), which just runs `server/db/runSchema.js` — a small script that reads `schema.sql` and executes it against whatever database your `.env` currently points at.

**`users`**
- id SERIAL PRIMARY KEY
- name VARCHAR(100) NOT NULL
- email VARCHAR(255) UNIQUE NOT NULL
- password_hash TEXT NOT NULL — bcrypt hash, never the real password
- role VARCHAR(20) DEFAULT 'user' — 'user' or 'admin'
- created_at TIMESTAMP DEFAULT NOW()

**`issues`**
- id SERIAL PRIMARY KEY
- user_id INTEGER NOT NULL REFERENCES users(id) — reporting is required to be logged in, by design
- title VARCHAR(150) NOT NULL
- description TEXT
- category VARCHAR(50) NOT NULL
- photo_url TEXT — Cloudinary URL, not the image itself
- location VARCHAR(255) NOT NULL — plain text for now; real map coordinates are a future improvement
- status VARCHAR(20) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved'))
- created_at TIMESTAMP DEFAULT NOW()

**`upvotes`** (junction table)
- id SERIAL PRIMARY KEY
- issue_id INTEGER NOT NULL REFERENCES issues(id)
- user_id INTEGER NOT NULL REFERENCES users(id)
- created_at TIMESTAMP DEFAULT NOW()
- UNIQUE (issue_id, user_id) — enforces one upvote per user per issue at the database level

## API routes (all implemented and tested)

- `POST /api/auth/signup` — { name, email, password } → creates user, bcrypt-hashes password, returns user (no password_hash)
- `POST /api/auth/login` — { email, password } → verifies via bcrypt.compare, returns { token, user }. Token payload: { id, role }, 7-day expiry. Deliberately vague error ("Invalid email or password") on both wrong-email and wrong-password, to avoid leaking which emails are registered.
- `POST /api/issues` (requireAuth, then the `uploadMiddleware` multer middleware) — creates an issue. Accepts `multipart/form-data` (title, category, location, description, and an optional `photo` file). If a photo is included, it's uploaded to Cloudinary server-side and the resulting URL is saved as `photo_url`; no photo means `photo_url` stays null. `user_id` comes from the verified JWT (`req.user.id`), never from the request body, to prevent identity spoofing.
- `GET /api/issues` (public) — lists issues, newest first. Accepts optional `?category=` (exact match against the four fixed category values) and `?location=` (case-insensitive partial match via `ILIKE`) query params to filter server-side; with neither, returns everything. Powers Home's filter bar.
- `GET /api/issues/mine` (requireAuth) — lists only the logged-in user's own issues, filtered by `user_id` at the database level (never client-side); powers the My Reports page. Registered before `/:id` so Express doesn't mistake "mine" for an id.
- `GET /api/issues/:id` (public) — single issue by id. JOINs against `users` to also return `reporter_name` (the reporting user's `name`) — a plain JOIN, not LEFT JOIN, since every issue is guaranteed to have a `user_id` (reporting requires login).
- `POST /api/issues/:id/upvote` (requireAuth) — inserts an upvote; catches Postgres error code `23505` (unique_violation from the UNIQUE constraint) and returns a clean 409 instead of a crash.
- `PATCH /api/issues/:id/status` (requireAuth, requireAdmin) — updates status; validates against the three allowed values.

## Design decisions and reasoning (for interview talking points)

- **Issue reporting requires login.** Prevents spam/fake reports and keeps every report accountable to a real user.
- **user_id always comes from the verified JWT, never the request body.** Otherwise anyone could impersonate any user by editing a field.
- **Upvote duplicate-prevention is enforced at the database level** (UNIQUE constraint), not just in application code — so it can never be bypassed even if there's a bug elsewhere.
- **Login error messages are deliberately non-specific** to prevent email enumeration attacks.
- **Admin promotion is not exposed via any API route** — done manually in the database for now, matching how real systems avoid letting anyone self-promote to admin.
- **JWT payload contains only id and role**, never sensitive data, and expires after 7 days.
- **Photo uploads are signed (server-side), not unsigned (direct from browser).** The backend can reject a bad file (wrong type, too large) before it ever reaches Cloudinary, and the Cloudinary API secret never has to sit in front-end code — the client only ever talks to our own server, never a third party directly.

## Known gaps / not yet built

- `location` is plain text with no stored coordinates — no map anywhere in the app (a map on Issue Detail was tried and then deliberately backed out — see git history/CLAUDE.md if that context is ever needed again).
- Deployment (Vercel + Render) not yet done.

## Current status (as of last update)

Backend: feature-complete for the MVP (auth, issues CRUD including `/mine`, upvoting, admin status updates), all manually tested via Postman.

Front-end: Navbar, Signup, Login, Home/issue feed, Issue Detail, Report Issue, My Reports, and Landing Hero are all built and styled per `design.md`. No pages left unbuilt for the MVP — deployment is the main remaining gap.
