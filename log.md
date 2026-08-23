# CivicFix — Development Log

A dated record of what was built, in what order, and why. Useful for tracking progress and as raw material for interview talking points later.

## 2026-08-17 — Environment setup + project skeleton
- Installed Node.js, Git, VS Code (all installed cleanly). PostgreSQL installed, but `psql` wasn't recognized until its `bin` folder was manually added to the Windows System PATH — the installer doesn't do this automatically on Windows.
- Created `client/` and `server/` folders inside the project, ran `git init`, added a `.gitignore` (excluding `node_modules/`, `.env`, logs, build output).
- Created the GitHub repository (public) and pushed the first commit.

## 2026-08-18/19 — Express server + database design
- Ran `npm init -y` and installed Express in `server/`.
- Wrote a minimal "Hello World" Express server (`index.js`) on port 3000 and confirmed it worked in the browser — proved the Node → Express → browser chain before adding complexity.
- Designed and created the database in PostgreSQL via `psql`: the `civicfix` database, then the `users`, `issues`, and `upvotes` tables, matching the schema planned at project start. Discussed the reasoning behind each column and constraint (foreign keys, CHECK constraints, the UNIQUE constraint on upvotes to prevent duplicates).
- Pushed the working server code to GitHub.

## 2026-08-19/20 — Connecting the server to the database, and authentication
- Installed `pg` and `dotenv`; created `server/db.js` (a connection pool) and `server/.env` (holding DB credentials — kept out of Git).
- Added a `/test-db` route to confirm the server could actually query Postgres — confirmed working.
- Removed `PROJECT_INSTRUCTIONS.md` from the public GitHub repo per request (kept private going forward; still exists in earlier Git history).
- Installed `bcrypt` and `jsonwebtoken`; added a `JWT_SECRET` to `.env`.
- Built `POST /api/auth/signup` (validates input, checks for duplicate email, hashes password with bcrypt, inserts user, never returns password_hash). Tested successfully — created user id=1.
- Built `POST /api/auth/login` (bcrypt.compare against the stored hash, issues a signed JWT with a 7-day expiry). Tested successfully.
- Learned to use Postman (new tool for the developer) to test POST requests that a browser can't easily send on its own.

## 2026-08-20/21 — Issues API
- Built `authMiddleware.js` with `requireAuth` — a reusable gatekeeper that verifies a JWT before letting a request through to protected routes.
- Built the issues routes: `POST /api/issues` (create, tied to the logged-in user via the token, not the request body), `GET /api/issues` (list all, public), `GET /api/issues/:id` (single issue, public). All tested successfully via Postman.
- Built `POST /api/issues/:id/upvote` (requireAuth), using the database's UNIQUE constraint to reject duplicate upvotes cleanly (Postgres error code 23505 → friendly 409 response). Tested both the success case and the duplicate-rejection case.
- Extended the middleware with `requireAdmin`. Built `PATCH /api/issues/:id/status` (requireAuth + requireAdmin), letting an admin move an issue through reported → in_progress → resolved.
- Manually promoted the test account to `role = 'admin'` in the database (via `psql`) to test the admin route, since there's intentionally no public API for self-promoting to admin. Confirmed the status update worked end-to-end after re-logging in to get a fresh token reflecting the new role.
- All work committed and pushed to GitHub after each milestone.

**Backend is now feature-complete for the MVP.**

## 2026-08-23 — Documentation
- Created `CLAUDE.md` (project briefing for future AI/dev sessions) and this `log.md`, based on a full review of the project's build history.

## Next up
- React front-end: project setup, signup/login pages, issue-reporting form, issues list with upvote buttons, handling the logged-in state across the app.
- Later: Cloudinary photo upload, issues filtering by category/location, writing the DB schema as a code/migration file, deployment to Vercel + Render.
