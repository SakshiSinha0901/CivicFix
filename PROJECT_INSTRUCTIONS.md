# Project: Local Civic Issue Reporter

## About the developer (read this first, every time)

- I am a **complete beginner** at building websites/apps — this is my first full-stack project.
- I find complex/technical words hard to follow. **Always explain any technical term in plain, layman's English** the first time you use it (e.g. "API — this just means...").
- I don't just want working code — I want to **understand the reasoning/logic** behind every decision, so I can confidently explain this project in job interviews.
- Walk me through things **step by step**, one concept at a time. Don't dump everything at once.
- Explain *why* we're doing something, not just *how*, especially for:
  - database design decisions
  - why an API is structured a certain way
  - what could go wrong (edge cases) and how we handle it
  - how this would behave with many users (basic scaling thinking)
- Goal: I should be able to explain this project's data flow, logic, and trade-offs clearly to a technical interviewer, not just say "AI built it for me."

## The problem this project solves

Local civic issues — potholes, garbage not collected, broken streetlights, water leakage — are usually only complained about informally (WhatsApp groups, word of mouth) and nothing tracks whether they get fixed. This project is a public website where:
- Any user can **report** a civic issue with a photo, category, description, and location.
- Other users can see existing nearby issues and **upvote** instead of creating duplicates.
- Each issue has a **status**: Reported → In Progress → Resolved.
- It's meant to be usable by anyone in the country, not just one city/college.

## Tech stack (decided, do not change without asking)

| Layer | Choice | Why |
|---|---|---|
| Front-end | **React** | Standard, widely used, good for learning real front-end concepts |
| Back-end | **Node.js + Express** | Chose Express over NestJS deliberately — NestJS adds structural complexity (decorators, modules, mandatory TypeScript patterns) that isn't needed for a beginner's first project. Express keeps every request/response step visible and understandable. |
| Database | **PostgreSQL** | Relational database — good fit since Users, Issues, and Upvotes have real relationships between them |
| Image storage | **Cloudinary** (free tier) | Databases are bad at storing large images directly — Cloudinary stores the photo, the database just stores a link (URL) to it |
| Auth | **JWT (JSON Web Token)** | After login, the server gives the browser a signed "ID card" (token) so the user doesn't have to log in again on every request |
| Code hosting | **GitHub** | Version history + what goes on the resume |
| Front-end hosting | **Vercel** (free) | Puts the React app on a real public URL |
| Back-end + DB hosting | **Render** (free tier) | Keeps the Express server and Postgres database running so anyone in the country can use the site |

**Explicitly NOT using:** NestJS (considered, decided against — see reasoning above). Keep the back-end in plain Express + JavaScript/TypeScript-light style, not NestJS's decorator/module structure.

## Database design (planned)

**`users`**
- id, name, email, password_hash, role (`user` or `admin`), created_at

**`issues`**
- id, user_id (who reported it), title, description, category, photo_url, location, status (`reported` / `in_progress` / `resolved`), created_at

**`upvotes`**
- id, issue_id, user_id
- This is a junction/relationship table — its whole purpose is to prevent the same user upvoting the same issue twice, and to link users and issues in a many-to-many way. Good talking point for interviews about relational database design.

## Front-end requirements
- Sign up / log in
- Report a new issue (photo, category, description, location)
- View list/map of nearby issues
- Upvote an issue (instead of creating a duplicate)
- See status of each issue

## Back-end requirements
- Secure signup/login (passwords hashed, never stored in plain text)
- Create/save a new issue
- Return issues, filterable by location/category
- Upvote endpoint (must prevent duplicate upvotes per user per issue)
- Admin-only endpoint to update issue status

## Division of responsibility (established earlier in planning)
- **Claude writes the code, explains every concept in plain language, designs the database, and helps debug.**
- **The developer (me) installs software locally (Node.js, VS Code, Git), creates accounts (GitHub, Render, Vercel, Cloudinary), runs commands in their own terminal, pushes to GitHub, and clicks deploy.**
- Claude should always be explicit about which of these two categories a given step falls into.

## Planned build order
1. Local dev environment setup (Node.js, VS Code, Git, GitHub account)
2. Database design and creation (explain why each table/column exists)
3. Back-end (Express API) — build and test before any front-end exists
4. Front-end (React) — connect to the back-end
5. Add authentication (JWT)
6. Add image upload (Cloudinary)
7. Deployment (Vercel + Render)
8. Write a clear project explanation for interviews (problem, data flow, edge cases, what I'd improve next)

## Current status
- Tech stack and problem decided.
- Developer is about to complete local environment setup (Node.js, VS Code, Git, GitHub account) before starting Step 2 (database design).
