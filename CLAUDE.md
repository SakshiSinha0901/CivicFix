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

## Project structure

```
CivicFix/
├── client/              # React front-end (not yet built)
├── server/              # Express back-end
│   ├── db.js            # Postgres connection pool (reads .env)
│   ├── index.js         # App entry point; mounts routes
│   ├── .env              # Secrets — gitignored, never commit
│   ├── middleware/
│   │   └── authMiddleware.js   # exports { requireAuth, requireAdmin }
│   └── routes/
│       ├── auth.js      # /api/auth/signup, /api/auth/login
│       └── issues.js    # /api/issues/* (create, list, get, upvote, status)
├── .gitignore
├── design.md            # Frontend design system — colors, type, spacing, component specs (see "Frontend visual design" above)
└── CLAUDE.md / log.md
```

## Database schema

Created manually via `psql` so far (not yet written as a code/migration file — see "Known gaps" below).

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
- `POST /api/issues` (requireAuth) — creates an issue. `user_id` comes from the verified JWT (`req.user.id`), never from the request body, to prevent identity spoofing.
- `GET /api/issues` (public) — lists all issues, newest first.
- `GET /api/issues/:id` (public) — single issue by id.
- `POST /api/issues/:id/upvote` (requireAuth) — inserts an upvote; catches Postgres error code `23505` (unique_violation from the UNIQUE constraint) and returns a clean 409 instead of a crash.
- `PATCH /api/issues/:id/status` (requireAuth, requireAdmin) — updates status; validates against the three allowed values.

## Design decisions and reasoning (for interview talking points)

- **Issue reporting requires login.** Prevents spam/fake reports and keeps every report accountable to a real user.
- **user_id always comes from the verified JWT, never the request body.** Otherwise anyone could impersonate any user by editing a field.
- **Upvote duplicate-prevention is enforced at the database level** (UNIQUE constraint), not just in application code — so it can never be bypassed even if there's a bug elsewhere.
- **Login error messages are deliberately non-specific** to prevent email enumeration attacks.
- **Admin promotion is not exposed via any API route** — done manually in the database for now, matching how real systems avoid letting anyone self-promote to admin.
- **JWT payload contains only id and role**, never sensitive data, and expires after 7 days.

## Known gaps / not yet built

- No filtering of issues by category/location yet (mentioned in original requirements).
- Database schema exists only as manually-run `psql` commands, not as a code/migration file — this needs to happen before deployment, since Render's production database will need to be set up from code, not by hand.
- Front-end (React) not started yet.
- Cloudinary photo upload not yet wired in (photo_url column exists but nothing populates it yet).
- Deployment (Vercel + Render) not yet done.

## Current status (as of this file's creation)

Backend is feature-complete for the MVP: auth, issues CRUD, upvoting, admin status updates — all built and manually tested via Postman. Next phase: React front-end.
