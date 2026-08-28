# CivicFix — Your Complete Learning Guide

*A plain-English walkthrough of everything we've built so far, why we built it that way, and how to explain it in an interview.*

---

## 1. The Big Picture — What Is This App, Really?

Before any code, it helps to picture CivicFix as **three separate "workers" that talk to each other over the internet**:

1. **The Frontend (React)** — this is what a person sees in their browser. Buttons, forms, pages. It cannot store anything permanently by itself.
2. **The Backend (Node.js + Express)** — this is the "brain." It receives requests like "create this issue" or "log this person in," decides if the request is allowed, and talks to the database.
3. **The Database (PostgreSQL)** — this is the permanent filing cabinet. It's the only place data survives after you close the browser or restart the server.

**Important concept: these three pieces never talk to each other directly except through defined channels.** The browser never touches the database directly — it always goes through the backend first. This is a core rule of how almost every real web app on the internet works, and it's the first thing that separates "a website" from "a full-stack application."

Think of it like a restaurant: the frontend is the dining room (what the customer sees and interacts with), the backend is the kitchen (where the real work and decisions happen, out of the customer's sight), and the database is the pantry/fridge (where ingredients — data — are permanently stored). The customer never walks into the kitchen and grabs food from the fridge themselves; they place an order (a request), and the kitchen decides what to do with it.

---

## 2. The Tech Stack — And *Why* Each Piece Was Chosen

This table is one of the most interview-relevant things in this whole document. Be ready to explain **each row's "why."**

| Layer | Choice | Why (in plain words) |
|---|---|---|
| Frontend | **React** | A library for building UI out of reusable "components" (like Lego blocks) that automatically re-render when data changes. Extremely widely used, so it's a transferable, resume-relevant skill. |
| Backend | **Node.js + Express** (not NestJS) | **Deliberately chosen over NestJS.** NestJS adds structure (decorators, dependency injection, modules) that's great for large teams but hides *how* a request actually flows, which is bad for a first project where the goal is understanding fundamentals. Express keeps "request comes in → code runs → response goes out" fully visible in a few lines you write yourself. |
| Database | **PostgreSQL** | A **relational database** — good because Users, Issues, and Upvotes are all *related* to each other (a user *owns* issues, a user *upvotes* issues). Relational databases are built exactly for data like this, using foreign keys to connect tables (explained in Section 4). |
| Image storage | **Cloudinary** (not built yet) | Databases are slow and expensive at storing large binary files like photos directly inside a table. Cloudinary stores the actual image file and hands back a short text URL — the database only ever stores that URL, not the image itself. |
| Login system | **JWT (JSON Web Token)** | Explained fully in Section 5. Short version: instead of asking the user to log in on every single click, the server gives the browser a signed "ID card" it can show on future requests. |
| Code history | **GitHub** | Every change to the code is saved with a timestamp and message, so nothing is ever truly lost, and it's also literally the link you'll put on your resume/portfolio. |
| Frontend hosting | **Vercel** (not deployed yet) | Takes the React app and gives it a real, permanent public web address instead of only working on your laptop. |
| Backend + DB hosting | **Render** (not deployed yet) | Keeps the Express server and Postgres database running 24/7, so anyone in the country can use the site — not just your own machine while it's turned on. |

**Important: "Why Express over NestJS" and "why PostgreSQL over something like MongoDB" are two of the most common interview questions for a project like this. You now have real, defensible answers above — not just "because I was told to."**

---

## 3. The Full Journey of One Request (Concrete Example: Logging In)

Reading a table of technologies doesn't teach you how they fit together — watching one request travel through the whole system does. Let's trace **exactly** what happens, file by file, when someone logs in. This is the single best story to tell in an interview when asked "walk me through your architecture."

1. **User types email + password into `Login.jsx`** and clicks "Log In." This is a **controlled input** — meaning React is tracking the exact current text of every box in a JavaScript object called `form`, updated on every keystroke via `handleChange`. Nothing is "submitted" yet; React just knows what's currently typed.
2. **The form's `onSubmit` handler fires.** It calls `fetch('http://localhost:3000/api/auth/login', { method: 'POST', body: JSON.stringify(form) })`. This is the frontend "placing an order" — sending a network request to the backend with the email/password packed as JSON (a text format for structured data).
3. **Express receives it.** In `server/index.js`, the line `app.use('/api/auth', authRoutes)` means: "any URL starting with `/api/auth` gets handed off to the code in `routes/auth.js`." This is called **routing** — matching an incoming URL + method (POST, GET, etc.) to the right block of code.
4. **`app.use(express.json())` had already run** (also in `index.js`) — this is what allows Express to read the JSON body and turn it into a normal JavaScript object at `req.body`. Without this one line, `req.body` would be `undefined` and the whole request would fail silently.
5. **Inside `routes/auth.js`, the `/login` route runs:**
   - It looks up the user by email in Postgres: `SELECT * FROM users WHERE email = $1`.
   - **Important: it uses `$1` as a placeholder, not string concatenation.** This is called a **parameterized query**, and it's a core defense against a classic attack called **SQL injection** (where a malicious person types something like `' OR '1'='1` into a form to trick the database into running commands it shouldn't). The `pg` library safely inserts the actual email value in place of `$1` instead of ever treating user input as literal code.
   - It compares the submitted password against the stored **hash** using `bcrypt.compare()`. (Section 5 explains hashing.)
   - If both checks pass, it creates a JWT with `jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })` and sends it back as JSON, along with basic (non-sensitive) user info.
6. **Back in `Login.jsx`,** the response arrives. The token gets saved into the browser's `localStorage` (a small permanent storage box built into every browser) under the key `civicfix_token`, and the user's basic info under `civicfix_user`. Then `navigate('/')` sends the user to the homepage.
7. **On every future request that needs to know "who is this,"** the browser will attach that saved token in a request header: `Authorization: Bearer <token>`. The backend's `requireAuth` middleware (Section 5) checks that header before letting the request through.

**Important: notice that the password itself never gets stored anywhere in the browser, and the real password is never even stored in the database — only its hash. This one detail is worth memorizing for interviews.**

---

## 4. Database Design — The Relational Model, Explained

### What "relational" actually means

Imagine three separate spreadsheets instead of one giant one:

- **`users`** — one row per person: `id, name, email, password_hash, role, created_at`
- **`issues`** — one row per reported problem: includes a `user_id` column that says *which user reported it*
- **`upvotes`** — one row per "this user upvoted this issue" event: has both a `user_id` and an `issue_id` column

**Important concept: this connecting column (`user_id` inside the `issues` table) is called a *foreign key*.** It doesn't duplicate the user's name or email inside every issue row — it just stores a *reference* (the user's `id` number) pointing back to the `users` table. This is the entire idea behind a relational database: instead of copying data everywhere, you store one authoritative copy and *link* to it.

Why not just use one giant table, or a NoSQL database like MongoDB? Because issues, users, and upvotes have a genuine *many-to-many* and *one-to-many* relationship (one user can report many issues; one issue can be upvoted by many users, but never twice by the same user). Relational databases like Postgres have built-in tools specifically for enforcing rules like that — for example:

- `UNIQUE(issue_id, user_id)` on the `upvotes` table — this makes it *physically impossible* at the database level for the same user to upvote the same issue twice, even if there were a bug in the backend code. When violated, Postgres itself throws error code `23505` ("unique_violation"), which `routes/issues.js` specifically catches and turns into a friendly `409 "You have already upvoted this issue."` response instead of a generic crash.

### Why `password_hash` and not `password`

We never store what someone actually typed as their password — only the output of running it through **bcrypt**, a one-way scrambling algorithm. "One-way" means there's no function to reverse a hash back into the original password — the only way to check a login is to hash the *newly typed* password the same way and compare the two scrambled results (`bcrypt.compare`). **Important: this means even if the entire database were stolen, the attacker would not have anyone's actual password** — just useless scrambled text.

### Known gap (be honest about this in interviews — it's a sign of maturity, not weakness)

Right now, the database tables were created by hand-typing SQL commands into `psql` (Postgres's command-line tool), not stored as a **migration file** — a version-controlled script that recreates the schema from scratch. This works fine solo, but before deployment (or in a team), you'd want a migration tool (like `node-pg-migrate` or Prisma) so the database structure is tracked in Git just like the code is, and can be rebuilt identically on Render's servers.

---

## 5. Authentication Deep Dive — JWT, Middleware, and Roles

### The problem JWT solves

Without any login system, the server would have no memory between requests — every single request would need to re-prove identity from scratch (e.g., re-sending a password every time you click anything). That's both insecure and annoying.

### How JWT solves it

1. On successful login, the server creates a token — a long string that's cryptographically **signed** using a secret key only the server knows (`process.env.JWT_SECRET`, stored in a `.env` file, never committed to GitHub).
2. That token contains a small amount of information (`{ id: user.id, role: user.role }`) plus an expiry (`7d` = 7 days).
3. The browser stores this token and attaches it to future requests.
4. **Important: the server never has to "remember" who's logged in.** It just re-verifies the signature on the token each time (`jwt.verify(token, process.env.JWT_SECRET)`). If the signature is valid, the server trusts the data inside it — because only the server's secret key could have produced that exact signature. This is why it's safe even though the token itself is just readable text (anyone can *decode* a JWT and see what's inside — they just can't *forge* a new valid one without the secret).

### Middleware — the concept

**Middleware is a function that runs *in between* a request arriving and your actual route logic running**, with the power to either continue (`next()`) or stop the request right there (e.g., `return res.status(401)...`). Think of it as a security checkpoint before you're allowed into a room.

`authMiddleware.js` defines two:

- **`requireAuth`** — checks for a valid token in the `Authorization` header. If missing or invalid, the request is rejected with a `401 Unauthorized` before your route code ever runs. If valid, it attaches the decoded info to `req.user` so later code can use `req.user.id`.
- **`requireAdmin`** — checks `req.user.role === 'admin'`. **Important: this must always run *after* `requireAuth`**, because it depends on `req.user` already being set. You can see this chaining directly in the status-update route:

```js
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => { ... })
```

Two middlewares in a row, left to right — `requireAuth` proves *who* you are, `requireAdmin` then checks *what you're allowed to do*. If either one fails, the actual route function never executes at all.

### Why `req.user.id` and never a `user_id` from the request body

Look closely at the "create issue" route: it reads the reporting user's id from `req.user.id` (set by the verified token), **not** from anything the browser sent in the request body. **Important: if the server trusted a `user_id` field sent by the client instead, anyone could impersonate any other user just by typing a different number into a request** — no password needed. Using the verified token instead makes that impossible, since a token can't be forged without the server's secret key. This is a genuinely good security decision to describe in an interview if asked "how did you prevent users from acting as someone else?"

---

## 6. The Frontend — React Concepts in Practice

### Components

A **component** is a self-contained, reusable chunk of UI defined as a JavaScript function that returns what looks like HTML (actually **JSX** — JavaScript XML, a syntax that lets you write markup directly inside JS). `Navbar.jsx` is written once and reused on every page just by writing `<Navbar />`.

### Routing (client-side)

`react-router-dom`'s `<BrowserRouter>` wraps the whole app in `main.jsx`, and `<Routes>`/`<Route>` in `App.jsx` map a URL path (like `/login`) to a component (`<Login />`). **Important: this is different from traditional websites where every link reloads the whole page from the server.** Here, React swaps out just the part of the page that changed — the Navbar never disappears or reloads, only the content below it changes. This is what makes it a **Single Page Application (SPA)**.

### State and controlled inputs

`useState` is a React "hook" — a special function that lets a component remember a value between renders and re-render automatically whenever that value changes. In `Login.jsx`:

```js
const [form, setForm] = useState({ email: '', password: '' })
```

Every keystroke calls `handleChange`, which updates `form`. This pattern — where React, not the browser's default HTML behavior, is the "single source of truth" for an input's value — is called a **controlled input**, and it's what lets the component read `form.email` and `form.password` later to send them to the server.

### Talking to the backend: `fetch`

`fetch()` is the browser's built-in tool for making HTTP requests. The pattern used throughout (`Login.jsx`, `Signup.jsx`) is: send the request → `await` the response → check `response.ok` (true only for 2xx status codes) → if not ok, read `data.error` from the server's JSON and show it to the user → if ok, do something (save the token, navigate elsewhere).

**Important — the `try / catch / finally` structure matters:** the `catch` block only fires if the network request itself fails entirely (e.g., server isn't running), giving a different message ("Could not reach the server") than a request that *reached* the server but got rejected (e.g., wrong password). The `finally` block always runs regardless, which is used to turn off the "submitting..." loading state either way.

### Known gap, on purpose (flagged for you to remember)

The Navbar currently has **no idea** whether someone is logged in — even after a successful login, it still shows "Log In / Sign Up" buttons. Fixing this needs a piece of **shared state** that many components can read at once — most likely **React Context**, which lets you store a value (like "current logged-in user") at the top of the app and read it from any component without manually passing it down through every layer ("prop drilling"). This was deliberately postponed as its own dedicated step rather than bundled into the Login page build, in line with the "one step at a time" approach.

---

## 7. Security Ideas Worth Remembering (High-Value Interview Material)

**Important — these four ideas show up constantly in interviews for *any* backend role, not just this project:**

1. **Never trust the client.** Any data that determines *permission* (like "who am I") must come from something the server verified itself (the JWT), never from a value the browser simply claims.
2. **Never store plaintext passwords.** Always hash with something purpose-built like bcrypt, never plain storage or reversible encryption.
3. **Parameterized queries prevent SQL injection.** Never build a SQL string by directly gluing in user input.
4. **Vague error messages for authentication failures.** Saying "Invalid email or password" (instead of "no account with that email" vs. "wrong password" as two different messages) prevents an attacker from being able to check which emails are registered on your system just by trying to log in.

---

## 8. What's Actually Built Right Now (Honest Status)

**Backend: fully complete and tested.**
- Signup and login (`/api/auth/signup`, `/api/auth/login`)
- Create, list, view-one, upvote, and admin-status-update for issues (`/api/issues/...`)
- Auth middleware (`requireAuth`, `requireAdmin`) protecting the routes that need it
- All manually tested through Postman (a tool for sending test API requests without needing a frontend) before moving on

**Frontend: in progress.**
- Shared Navbar, page routing, Signup page, and Login page are real and working end-to-end against the live backend.
- Home, Report Issue, and My Reports pages are still empty placeholders.
- The "is someone logged in" UI gap described above is the next real piece of frontend architecture to add.

**Not started yet:** Cloudinary photo uploads, and deployment (Vercel + Render) — deployment will also require writing a real database migration file and locking down CORS (currently wide open for local development convenience).

---

## 9. Likely Interview Questions — And How to Answer Them From This Project

**"Walk me through your architecture."**
→ Use the restaurant analogy from Section 1, then narrate the login flow from Section 3 as a concrete example.

**"Why Express instead of a framework like NestJS?"**
→ Beginner project, wanted every request's flow to be visible and self-written rather than hidden behind decorators/DI — a deliberate learning tradeoff, not a limitation.

**"Why PostgreSQL and not MongoDB?"**
→ The data is inherently relational (users own issues, users upvote issues) — foreign keys and a `UNIQUE` constraint let the database itself enforce rules like "no duplicate upvotes," rather than relying on application code to catch it.

**"How does your login system work?"**
→ Bcrypt-hashed passwords, JWT issued on successful login, verified via middleware on protected routes, `req.user` populated only from a cryptographically verified token — never trusted from client input.

**"How did you prevent SQL injection?"**
→ Parameterized queries (`$1`, `$2` placeholders) via the `pg` library everywhere user input touches a query.

**"What would you do differently / what's still missing?"**
→ Being honest here is a *good* sign to interviewers: no DB migration file yet, CORS wide open for local dev, no shared frontend auth state yet, no image upload yet. Shows self-awareness about production-readiness, not just "getting it working."

---

## 10. Quick Glossary (for anything above that felt fuzzy)

- **API (Application Programming Interface):** the set of URLs/rules your backend exposes for other programs (like your React app) to request data or trigger actions.
- **Endpoint:** one specific URL + method combination on your API, e.g. `POST /api/auth/login`.
- **Middleware:** code that runs in between a request arriving and your main route logic, able to block or allow it.
- **Schema:** the defined structure of a database table (which columns exist, what type each is).
- **Environment variable:** a secret or config value (like a database password or JWT secret) kept outside your code, in a `.env` file, so it's never committed to GitHub.
- **Token:** a piece of data (here, a JWT) that proves something (like "this person is logged in as user #5") without needing to re-check a password every time.
- **Repository ("repo"):** a project's folder as tracked by Git/GitHub, with full history of every change.
- **Deployment:** making your app run on a public server that's always on, instead of only your own laptop.
- **CORS (Cross-Origin Resource Sharing):** a browser security rule that blocks a webpage from one address (like `localhost:5173`) from freely talking to a server at a different address (`localhost:3000`) unless the server explicitly allows it.
- **Hook (React):** a special function (like `useState`) that lets a function-based component "hook into" React features like memory or lifecycle events.
