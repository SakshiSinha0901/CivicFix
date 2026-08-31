# CivicFix

A public website for reporting local civic issues — potholes, overflowing garbage bins, broken streetlights, water leaks — with a photo, a category, a description, and a location. Anyone can browse and upvote an issue instead of filing a duplicate, and each issue moves through a real status: **Reported → In Progress → Resolved**.

This README explains not just *what* CivicFix does, but *how* its three main pieces — the frontend, the backend, and the database — actually work together to make that happen. It's written so that both a non-technical reader and a technical one can follow it: plain-English explanations first, with the real technical terms included and defined along the way.

> **Live demo:** not deployed yet — see [Deployment status](#deployment-status) below. For now, running it locally (see [Running this project yourself](#running-this-project-yourself)) is the way to see it in action.

---

## What CivicFix actually does

- **Anyone can browse** reported issues on the home feed — no account needed — and filter them by category or by typing part of a location.
- **Logged-in users can report a new issue**: a title, a category (pothole / garbage / broken streetlight / water leakage), a location, an optional description, and an optional photo.
- **Every issue has a status** that starts at "Reported" and can be moved forward by an admin as the real-world problem gets fixed.
- **Anyone can upvote** an issue instead of reporting the same problem twice — but only once per person per issue.
- **Logged-in users can see their own reports** in one place ("My Reports"), and open any single issue to see its full detail, including who reported it.

## The three pieces, and how they depend on each other

Think of CivicFix as three separate programs that only talk to each other over the network, never by directly sharing code or files:

1. **The frontend** — what you actually see and click on in your browser. Built with **React**, a JavaScript library for building interactive web pages out of reusable pieces called *components* (a button, a form, a whole page — each is a component). It runs entirely inside the visitor's browser.
2. **The backend** — a program that never draws anything on screen. Built with **Node.js** (a way to run JavaScript outside a browser, on a server) and **Express** (a lightweight framework for building the specific kind of program a backend needs: one that listens for incoming web requests and sends back responses). Its job is to enforce every rule that actually matters — who's allowed to do what, what data is valid, what gets permanently saved — because unlike the frontend, nobody outside CivicFix can tamper with code running on the server.
3. **The database** — where information actually lives long-term. Built with **PostgreSQL** ("Postgres" for short), a *relational database*: data is organized into tables with rows and columns, similar to a very powerful spreadsheet, with real enforced relationships between tables (e.g., "every issue must belong to a real, existing user").

Here's the key idea that ties them together: **the frontend never touches the database directly.** It can't — it doesn't even know the database exists. Every single time the frontend needs data (to show the issue feed) or needs to save data (a new signup, a new issue report), it sends a request over the network to the backend, using what's called a **REST API** — a set of URL patterns and HTTP methods (`GET` to read data, `POST` to create something, `PATCH` to update something) that the backend promises to respond to in a predictable way. The backend is the *only* thing that ever talks to Postgres. This matters for a very practical reason: it means every rule (must be logged in to report an issue, an upvote can only happen once per person) is enforced in exactly one place that a malicious visitor can't bypass by, say, editing the webpage in their browser's developer tools.

### Walking through one real example: reporting an issue

This is the clearest way to see all three pieces cooperate:

1. A logged-in visitor fills out the Report Issue form in the browser (title, category, location, description, and picks a photo file) and clicks submit. This is pure frontend — React reads the values out of the form fields.
2. The frontend sends this data to the backend as one HTTP request: `POST /api/issues`. Because it includes an actual photo file (not just text), it's sent as `multipart/form-data` — a request format built specifically for bundling files together with regular text fields, since plain JSON (JavaScript Object Notation, the usual "just text" format APIs use) can't carry raw file bytes.
3. This request also carries the visitor's **JWT** (JSON Web Token — explained in the glossary below) in a header, proving who they are without needing to look anything up yet.
4. On the backend, this request passes through a chain of **middleware** before reaching the actual route logic — small functions that each get a chance to inspect, modify, or reject the request before the next one runs. First `requireAuth` checks and decodes the JWT — if it's missing, invalid, or expired, the request is rejected right here with no changes made anywhere. Then `uploadMiddleware` (built on a library called **multer**) reads the incoming photo into memory as raw bytes.
5. If a photo was included, the backend hands those raw bytes to **Cloudinary**, a third-party service built specifically for storing and serving images (and video). Cloudinary sends back a URL pointing to the now-stored photo. This matters because databases handle huge binary files (like photos) badly — so Postgres never stores the actual image, only that short text URL pointing to where Cloudinary is hosting it.
6. The backend now runs a Postgres `INSERT` — inserting a new row into the `issues` table with the title, category, location, description, the Cloudinary photo URL, and the reporting user's real ID (taken from the verified JWT, **never** from anything the browser claimed in the request body — otherwise anyone could edit the request and claim to be a different user).
7. Postgres confirms the new row was saved and hands back its full contents (including the new auto-generated `id`). The backend forwards that back to the frontend as the response.
8. React receives the response and updates what's on screen — e.g., redirecting to the new issue's detail page — without the visitor ever reloading the browser.

Every other feature in the app (signing up, logging in, browsing the feed, upvoting, filtering, changing status) follows this same basic shape: **frontend collects input → sends an API request → backend validates and enforces the rules → backend talks to Postgres (and sometimes Cloudinary) → backend responds → frontend updates the screen.**

---

## The frontend, in more depth

- **React** renders the UI as a tree of components. **React Router** is a separate library that gives a single-page app real, bookmarkable URLs (like `/report` or `/issues/5`) without actually reloading the whole page on every click — it swaps out which component is showing based on the current URL.
- **State** is React's term for "data a component remembers and can change, which causes the screen to re-draw when it changes." Every form field, every loading spinner, every fetched list of issues is state.
- **AuthContext** (`client/src/context/AuthContext.jsx`) is a small piece of shared state available to the *entire* app at once, holding whether someone is logged in, their JWT, and their basic user info — built with React's **Context** feature, which exists specifically so deeply nested components don't have to pass data down through every single layer in between by hand. It also reads from and writes to `localStorage` (a small storage area the browser gives each website) so a visitor stays logged in even after refreshing the page or closing the tab.
- Which page shows at the root URL `/` is decided by that same auth state: logged-out visitors see a marketing "Landing Hero" page; logged-in visitors see the real issue feed.
- All visual decisions (colors, spacing, type, per-page layout) follow a single design system documented in `design.md`, kept deliberately separate from this README since it's about visual polish, not how the app runs.

## The backend, in more depth

- **Express** listens for incoming HTTP requests and routes each one to the right piece of code based on its URL and method. Routes are grouped by feature into separate files under `server/routes/` (`auth.js` for signup/login, `issues.js` for everything issue-related).
- **Middleware**, again: small functions that run *before* a route's main logic, each able to stop the request early. `requireAuth` verifies a JWT is present and valid; `requireAdmin` (used only on the status-update route) additionally checks the logged-in user's role is `admin`.
- **JWT authentication**: when someone logs in successfully, the backend creates a JWT — a signed, tamper-proof piece of text encoding just their user ID and role, set to expire after 7 days. "Signed" means it's mathematically stamped with a secret key only the server knows, so the server can always tell if anyone tried to edit it — it's the digital equivalent of an ID card with a hologram nobody can convincingly fake. The frontend stores this token and re-sends it with every request that needs to prove who's asking, so the backend never has to ask for a password more than once per session.
- **bcrypt** is the library used to turn a real password into a `password_hash` before it's ever saved — a one-way scrambling process; there's no way to reverse a hash back into the original password, even for CivicFix itself. Logging in works by hashing the *attempted* password the same way and comparing the two hashes, never by "unscrambling" anything.
- **No ORM** — CivicFix talks to Postgres using raw parameterized SQL queries (via the `pg` library) rather than an ORM (Object-Relational Mapper, a tool that lets you write database queries using regular code instead of SQL directly). This was a deliberate choice for a first project: writing real SQL means directly learning how relational databases actually work, rather than learning a tool's abstraction over it.
- **Parameterized queries** (`$1`, `$2`, ... placeholders filled in separately from the query string) are used everywhere user input reaches a query, specifically to prevent **SQL injection** — a well-known attack where an attacker crafts input designed to be misread as part of the SQL command itself. Never pasting raw user input directly into a SQL string is the core defense.
- **CORS** (Cross-Origin Resource Sharing) is a browser security rule that, by default, blocks a webpage from one address from freely talking to a server at a different address. The backend explicitly opts in to allowing the frontend's address to talk to it — currently opened to any address for local development, planned to be locked down to only the real deployed frontend's URL once deployment happens.

## The database, in more depth

Three tables, with real relationships enforced by Postgres itself rather than just hoped-for by the application code:

- **`users`** — one row per account. Stores a bcrypt password hash, never a real password, and a `role` (`user` or `admin`).
- **`issues`** — one row per reported issue. Every issue has a `user_id` column that must match a real row in `users` — this is a **foreign key**, Postgres's way of enforcing "this value must point to something that actually exists," which makes it structurally impossible to have an issue attached to a nonexistent user. Its `status` column can only ever be `'reported'`, `'in_progress'`, or `'resolved'` — also enforced by the database itself via a `CHECK` constraint, not just by frontend or backend code remembering to validate it.
- **`upvotes`** — a *junction table*, the standard relational-database pattern for representing a many-to-many relationship (many users can upvote many issues). It has its own foreign keys pointing to both `users` and `issues`, plus a `UNIQUE` constraint on the *combination* of `issue_id` and `user_id` — this is what makes "one upvote per person per issue" airtight at the database level, impossible to bypass even by a bug elsewhere in the code.
- A **JOIN** is how a single query pulls in matching data from more than one table at once — used, for example, to attach each issue's live upvote count (counted from the `upvotes` table) and its reporter's name (looked up from `users`) onto the issue data in a single trip to the database, rather than the backend making several separate queries and stitching results together itself.
- The database connects through a **connection pool** (`server/db.js`) — a small set of already-open connections to Postgres that get reused across requests, since opening a brand new connection for every single request would be much slower.
- The schema (the actual `CREATE TABLE` statements defining these three tables) lives as real code in `server/db/schema.sql`, runnable any time with `npm run db:setup` — written to be **idempotent** (safe to run more than once without error or duplication) using `CREATE TABLE IF NOT EXISTS`, so the exact same file can set up a brand-new empty database from scratch just as safely as it does nothing on a database that already has these tables.

## Third-party services used

- **Cloudinary** (free tier) stores and serves uploaded photos. CivicFix uses a *signed* upload — the backend validates a file (real image type, under 5MB) and sends it to Cloudinary itself, rather than letting the browser upload directly to Cloudinary. This keeps Cloudinary's secret API key off the frontend entirely (secrets in frontend code are visible to literally anyone, since the browser has to download and run that code) and means a bad file gets rejected before it ever leaves CivicFix's own server.

---

## Project structure

```
CivicFix/
├── client/                        # React frontend
│   └── src/
│       ├── App.jsx                # Route definitions
│       ├── context/AuthContext.jsx  # Shared login state, used app-wide
│       ├── pages/                 # One file per full page (Home, Login, ReportIssue, IssueDetail, ...)
│       └── assets/                # Images used by the frontend
├── server/                        # Express backend
│   ├── index.js                   # Entry point — starts the server, mounts routes, global error handler
│   ├── db.js                      # Postgres connection pool
│   ├── db/
│   │   ├── schema.sql             # CREATE TABLE statements — the real, runnable database schema
│   │   └── runSchema.js           # `npm run db:setup` runs schema.sql against whatever .env points at
│   ├── config/cloudinary.js       # Configures the Cloudinary SDK from secrets in .env
│   ├── middleware/
│   │   ├── authMiddleware.js      # requireAuth, requireAdmin
│   │   └── uploadMiddleware.js    # Reads an optional photo file off a request
│   └── routes/
│       ├── auth.js                # /api/auth/signup, /api/auth/login
│       └── issues.js              # Everything issue-related
├── design.md                      # Frontend visual design system (colors, type, spacing, per-page specs)
└── CLAUDE.md                      # Working notes for AI-assisted development on this project
```

## API reference (summary)

| Method & path | Who can call it | What it does |
|---|---|---|
| `POST /api/auth/signup` | anyone | Creates an account |
| `POST /api/auth/login` | anyone | Verifies credentials, returns a JWT |
| `GET /api/issues` | anyone | Lists issues, newest first; optional `?category=` and `?location=` filters |
| `GET /api/issues/mine` | logged-in users | Lists only the caller's own reported issues |
| `GET /api/issues/:id` | anyone | A single issue's full detail, including the reporter's name |
| `POST /api/issues` | logged-in users | Reports a new issue (accepts an optional photo) |
| `POST /api/issues/:id/upvote` | logged-in users | Upvotes an issue (once per person) |
| `PATCH /api/issues/:id/status` | admins only | Moves an issue's status forward |

## Running this project yourself

This project isn't deployed to a public URL yet, so running it locally is currently the only way to try it. You'll need Node.js and PostgreSQL installed, plus your own free Cloudinary account.

1. Clone the repository and install dependencies in both `client` and `server` (`npm install` in each folder).
2. Create a `server/.env` file with your own database credentials, a JWT secret of your choosing, and your own Cloudinary credentials (see the placeholder names in `CLAUDE.md`'s "Cloudinary setup" section) — this file is intentionally left out of the repository, since it holds real secrets.
3. Create an empty Postgres database, then run `npm run db:setup` from inside `server` to create all the tables.
4. Start the backend (`npm run dev` inside `server`) and the frontend (`npm run dev` inside `client`) in two separate terminals.

## Deployment status

Not yet deployed. The plan is to host the backend and database on **Render** and the frontend on **Vercel**, both free-tier services — this is the one remaining piece of this project.

## Known limitations

- Location is stored as plain typed text, with no map or real coordinates.
- Admin accounts are promoted manually in the database — there's no self-serve "become an admin" flow, matching how real systems avoid letting anyone grant themselves elevated access.

## Glossary of key terms used in this project

- **API (Application Programming Interface)** — the agreed-upon set of requests one program can make to another. CivicFix's backend exposes a REST API for the frontend to call.
- **REST** — a common style of API design built around standard HTTP methods (`GET`, `POST`, `PATCH`) and predictable URLs representing "things" (like `/api/issues/5`).
- **JWT (JSON Web Token)** — a signed, tamper-proof piece of text proving who a logged-in user is, without the server needing to look anything up in a session store.
- **bcrypt** — a one-way password-hashing library; passwords are never stored in a reversible form.
- **Middleware** — a function that runs before a request reaches its final route logic, able to inspect, modify, or reject it.
- **CORS** — a browser rule restricting which websites a server allows to talk to it.
- **SQL injection** — an attack that tricks a database into running attacker-supplied commands by sneaking them into ordinary input; prevented here with parameterized queries.
- **Foreign key** — a database-enforced rule that one table's column must reference a real row in another table.
- **JOIN** — a single database query that combines matching rows from more than one table.
- **Idempotent** — safe to run more than once without changing the outcome after the first time; used to describe `schema.sql`.
- **Connection pool** — a small set of reused, already-open database connections, faster than opening a new one per request.
- **Environment variables (`.env`)** — configuration and secrets kept outside the actual code, so they can differ between machines and are never committed to version control.
