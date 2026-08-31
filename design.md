# CivicFix Design System

## 0. How this file works

This is the single source of truth for CivicFix's visual design — colors, type, spacing, and component structure. It governs the actual code in `client/src/`.

**Rule for future work (mine and anyone else's on this project):** no visual change ships without matching this file, or updating this file first. Any proposed change to this file gets shown to the user for approval *before* the file is edited or any code is written to match it. No deviating from this file on my own judgment — if something isn't covered here, ask before deciding.

Structural measurements below were extracted from a set of reference UI screenshots (a hiking-app website) purely as layout/spacing/proportion guidance — grid math, not their branding. No colors, logos, illustrations, or copy from that reference are used anywhere in CivicFix. Everything visual (palette, type, artwork) is CivicFix's own.

---

## 1. Color tokens

| Token | Hex | Use |
|---|---|---|
| Background (cream) | `#f3f1e7` | Page background |
| Surface (white) | `#ffffff` | Cards, form panels |
| Surface border | `#eae6d8` | Card/input hairline borders |
| Input fill | `#f9f8f2` | Input backgrounds |
| Text primary | `#211f18` | Headings, body |
| Text muted | `#6f6a5c` | Subtext, meta |
| Text placeholder | `#9a927c` | Input placeholders |
| Primary (olive) | `#43541b` | Buttons, links, active states |
| Primary hover | `#384512` | Button/link hover |
| Accent (orange) | `#e8622c` | "View details", small accents |
| Status — Reported bg / text | `#f6e2d3` / `#9c4a1d` | Status pill |
| Status — In Progress bg / text | `#f4ecc9` / `#7a5c12` | Status pill |
| Status — Resolved bg / text | `#dfe8cd` / `#45571f` | Status pill |

## 2. Typography

- **Headings:** Baloo 2, weights 600/700/800
- **Body / UI:** Nunito Sans, weights 400–800
- **Handwritten accents (doodle captions only):** Caveat, weights 600/700
- Type scale in use: page h1 ≈ 30px, card title ≈ 19.5px, form heading ≈ 27px, body ≈ 14–14.5px, meta/small ≈ 12–13px. Landing hero headline is new — see 4.1.

## 3. Shape & elevation

- Buttons and inputs: fully rounded pill (`border-radius: 999px`)
- Cards: 22–26px radius
- Badges/pills (status, category): 12–14px radius (small) or fully rounded (overlay pills)
- Borders: 1px `#eae6d8` hairline. Only the auth card carries a soft shadow (`0 12px 40px rgba(33,31,24,0.08)`) — everything else stays flat/bordered, no drop shadows.

## 4. Component specs

### 4.1 Landing Hero — done (v3, interactive single-screen)

Went through three real revisions after mockup review, each shown to and approved by the user before being coded. v1 (ExpressVPN-style: headline block, single CTA, illustration as a full-width strip below the text, separate scrolling "How it works" section) is superseded by this version. The two-pill-CTA/icon-glyph/Caveat-tagline plan from the very first draft of this file was already superseded before v1 shipped — see git history / CLAUDE.md if that context is ever needed again.

- **Navbar**: unchanged — same global `Navbar` component every other page uses, no page-specific variant.
- **One fixed screen, not a scrolling page.** `Navbar` + the hero stage together fill exactly one viewport (stage height = `100vh` minus the Navbar's real measured height). There is nothing below to scroll to — this page intentionally has no footer-style continuation.
- **Background**: the user's painted illustration (neighbors on a bridge overlooking a pothole, an overflowing bin, a broken streetlight/water leak, and a community garden — see section 5 for how this art was chosen) as a **static, full-bleed background** — blurred (5px) and scaled slightly (1.08×) to hide the blur's edge softening, with a cream-toned scrim on top (`rgba(243,241,231,…)`, the same cream background token, not a generic dark overlay) so text stays legible. The image itself never moves, animates, changes, or scrubs — only the content on top of it changes.
- **Scroll/swipe drives a content swap, not the page.** Wheel and touch input over the stage never scroll the page (the browser has nothing to scroll anyway) — they're captured and converted into a 0→1 progress value in `LandingHero.jsx`. That progress crossfades two stacked layers: the hero text (badge, headline, tagline, CTA, trust line) fades out and drifts up as progress increases; the How It Works panel fades in and drifts up from below to take its place. Scrolling back up reverses it. A small "Scroll to see how it works" cue shows at progress 0, and "Scroll up to go back" shows once fully at How It Works.
- **Content, unchanged from v1**: headline "The easiest way to report what's broken.", tagline "No forms to hunt down — just snap a photo and go.", one CTA button "Sign Up for Free", trust line "See it. Snap it. Get it fixed.", badge "Free for every neighborhood". How It Works keeps its same 3 steps (Report it → Track it → See it resolved) but as a more compact overlay panel sized to fit inside one screen rather than a full page-height section.
- **Accessibility fallback**: a visitor whose OS has "reduce motion" turned on gets a plain, normally-scrolling page instead — both sections shown one after another in normal document flow, no scroll capture, no crossfade. Detected via `prefers-reduced-motion` media query, same as the technique this interaction was adapted from.
- **Routing**: `/` shows this page to logged-out visitors; logged-in visitors see the existing issue feed (Home) at the same URL — decided explicitly with the user rather than assumed.
- **Not adopted from the reference this was inspired by**: no video (the user doesn't have footage relevant to CivicFix; the reference's own demo video was an unrelated stranger's subway clip anyway), no hardcoded third-party credit/signature link, and no project-wide switch to TypeScript/Tailwind/shadcn — the reference's own suggested integration path assumed all three, none of which CivicFix uses (see Tech stack table at the top of `CLAUDE.md`).

### 4.2 Auth forms (Signup / Login) — refining what's already built

These pages already exist and work; this is a spacing/breathing-room refinement pass, not a rebuild. Login keeps its own two-field (email + password) structure — it does not adopt the reference's single-email-first flow, since our login genuinely needs both fields at once.

- Card width: ~460–480px (currently 440px — slightly wider for more breathing room).
- Icon badge: 44px circle above heading — gap badge → heading increases from 14px to ~24px.
- Heading → subheading gap: keep as-is (~8px).
- Subheading → first field gap: increase from ~28px to ~36–40px.
- Input height: increase for a more premium feel — from ~48px total to ~50–52px (padding ~16px/20px).
- Label → field gap: keep as-is (~7px).
- Gap between stacked fields: increase from 16px to ~20px.
- Error message: add a small warning icon before the text (currently text-only); keep our smaller pill radius (~14px) rather than the reference's sharper ~8px box.
- Footer link row → button gap: increase to ~24–28px for consistency.
- No "or" divider or social-login buttons — CivicFix only has email/password auth; nothing added that doesn't function.

### 4.3 Home feed / issue cards — done

CivicFix's feed is a grid of many equal issue reports, not one editorial hero-story followed by an activity list — so the reference's hero-card-then-list page pattern was **not** adopted at the page level. What *was* adopted is card-level anatomy:

- Photo proportion: increased from a fixed 160px to 210px (was ~160px, ~55–60% of card height as in the reference).
- Category label (top-left overlay) and status pill (top-right overlay): given a touch more internal padding (12/14px → 14/16px) so neither sits flush against the photo edge.
- Card corner radius: already close (22px) — no change needed.
- Footer row: kept our current 2-item layout (upvote count + "View details") — CivicFix only has one real engagement action (upvoting), so no like/comment/save/share icons were added just to look busy; that would be UI for features that don't exist.
- Description/footer internal spacing: increased (body padding 16/18px → 18/20px, divider margin 12/10px → 18/14px) for breathing room.
- **Filter bar (added)**: a white bordered card between the header and the grid — a category dropdown ("All categories" + the same four fixed values as Report Issue's form) and a location text search, plus a "Clear filters" text link that only appears once a filter is active. Filtering happens server-side (`GET /api/issues?category=...&location=...`), not by hiding cards in the browser — consistent with the "server does the filtering" pattern already used for `/mine`. Built directly from existing input/pill tokens (same rounded `#f9f8f2` field style as every other form in the app) rather than a new visual language, since this is a small, contained addition to an already-built page.

### 4.4 Navbar — refining what's already built

Already exists and works structurally (logo left, links center, actions right, login-state-aware buttons) — this is a small consistency pass, no layout changes.

- Hover transitions: add `0.15s` background/border-color/color transitions to nav links and buttons — every other interactive element in the app (form inputs, submit buttons) already animates on hover; the navbar was the one place that snapped instantly.
- Button padding: `10px 22px` → `11px 24px`; font-size `13px` → `13.5px` — a touch more comfortable to click, while staying clearly smaller-scale than the auth-page pill buttons (compact nav-button scale, not form-button scale).
- Navbar actions gap: `14px` → `16px` for slightly more breathing room between greeting/buttons.

### 4.5 Issue Detail — done

Restructured from a single stacked column into a two-column top section (photo + metadata sidebar) with a full-width description below, based on Mobbin references for the same use case (community/civic listing detail with photo, status, location, and one primary action) — structure only, no third-party branding. Two directions were mocked up; the richer one was chosen.

- **Layout**: photo on the left (~54% width, rounded 20px inset with 16px padding), metadata sidebar on the right (title, status stepper, location, reported-time, upvote). Column width grew from 720px to 900px to give the two-column section room.
- **Photo**: rounded inset with a bottom gradient overlay and a floating category chip (reuses the hazard-triangle icon from the Signup/Login doodles) — echoes the same photo-overlay pattern already used on the home feed's issue cards, so feed and detail read as one family.
- **Status stepper**: replaces the old plain status badge with a 3-step horizontal stepper (Reported → In Progress → Resolved) that reads the issue's real `status` field — completed steps olive, the current step orange with a soft glow, upcoming steps muted. This is a different visual read of the same real data, not a new feature.
- **Title accent**: a short orange underline bar beneath the title, reusing the same accent-orange already used for the active nav-link underline.
- **Corner doodle**: a small dashed-route SVG (same family as Signup/Login) tucked into the card's top-right corner at low opacity — ties this page into the same illustrated identity without competing with the content.
- **Upvote control**: split into the upvote button and a separate count pill beside it, instead of the count being inline text in the button.
- **Description**: unchanged in position (full-width below the two-column section) but now has a small uppercase "Description" label above it for structure.
- **Reported-by (added)**: a third meta item (matching the existing location/reported-time row exactly — same icon size, weight, and spacing) showing "Reported by {name}", using a person-outline icon from the same stroke-icon family already used for location/clock. Backed by a real database JOIN against `users` (no fabricated data — see `CLAUDE.md`'s "Database schema"/API routes for the query).
- **Not added**: no map (location is still plain text, no stored coordinates — a map on Issue Detail was tried and deliberately backed out; see `CLAUDE.md` known gaps).

### 4.6 Report Issue — done (v2, richer)

Was an unstyled "Coming soon" placeholder, then a single-card form (v1), then upgraded to a two-column layout after the user asked for something more eye-catching. Two directions were mocked up for the richer pass; the user chose to richen Report Issue but explicitly keep My Reports (4.7) as it already was.

- **Layout**: two-column shell (980px), the real form on the left (~56%) and a purely decorative illustrated panel on the right (~44%) — same split-panel idea as Signup/Login, applied here for the first time.
- Card layout, badge, heading, and field styles are still lifted directly from Signup/Login's existing tokens (same input pill shape, same 999px-radius submit button) so this page reads as part of the same auth-adjacent form family.
- Fields: Title, Category (select — Pothole / Garbage / Broken Streetlight / Water Leakage), Location, Description. Category and Location sit side by side in a row on wider screens.
- **Illustrated panel**: a fresh hand-drawn doodle (dashed route + a wrench-in-circle icon), same stroke style and dash pattern as the Signup/Login route-doodles, plus a Caveat-font caption ("let's get it fixed") and one supporting line of copy. No new assets required — built entirely from the existing doodle vocabulary.
- **Photo field**: now a real, working dropzone (click or drag-and-drop), labeled "optional." Selecting a photo swaps the dropzone for a small preview (thumbnail + filename + Remove button). Uploads go through the backend to Cloudinary on submit — see section 8 for the full setup.
- Requires login: a logged-out visitor sees a simple "log in to report an issue" card instead of the form, matching the tone of the upvote button's logged-out message on Issue Detail rather than a hard redirect.

### 4.7 My Reports — done (v2, richer)

Was an unstyled "Coming soon" placeholder, then a plain-pill-tabs version (v1), structurally based on Mobbin's Whop "My Submissions" pattern. A richer stat-tile direction was mocked up alongside the Report Issue v2 redesign; the user initially kept this page as v1, then changed their mind and asked for the richer version too — with one specific fix. Still reuses CivicFix's own `IssueCard` component exactly as built for the Home feed — no new card design.

- Header matches Home's header style (title + subtitle), plus a small corner doodle (same dashed-route family as Issue Detail's) near the top.
- **Status tiles** replace the plain pill tabs: All / Reported / In Progress / Resolved, each a card with an icon circle, a live count, and a label. Clicking one still filters the already-fetched list client-side — same logic as v1, only the markup/styling changed.
- **Tile color fix (explicit user request):** the first mockup gave the "All" tile a solid olive fill to show it was active, while the other three stayed white cards — the user felt this made "All" look like a mismatched color rather than part of the same set. Fixed: all four tiles now share the same white-card base. "All" gets a neutral icon-circle tint (matching the category-badge neutral, since it isn't a real status), same as how Reported/In Progress/Resolved each tint their icon circle to match that status's color elsewhere in the app (IssueCard, Issue Detail). Whichever tile is active is shown with an olive border + soft ring instead of a solid fill, so the active state no longer means "repaint the tile a solid color."
- Grid: identical 3-column `IssueCard` grid used on Home, same responsive breakpoints.
- Empty state (zero reports at all): a dashed-border illustrated panel with a pin icon, message, and a "+ Report an Issue" link — replacing the old plain text-only empty message.
- Data comes from `GET /api/issues/mine` (requireAuth, filtered by `user_id` at the database level) rather than filtering all issues in the browser — same "trust the server, not the client" pattern the rest of the backend already follows.
- Requires login, same locked-state treatment as Report Issue.

## 5. Illustrations

**Signup / Login — done.** User-supplied character illustrations (a running figure; a figure surrounded by flying papers), recolored from their original coral-red to our accent orange (`#e8622c`) and background-stripped to transparent, replacing the earlier placeholder hand-drawn SVG doodles on those two pages. Papers illustration → Signup (top-right, 320px wide), running illustration → Login (top-left, 320px wide, mirrored layout). Each page keeps one route-doodle (SVG) and one handwritten caption alongside its character illustration. Both illustrations inherit the `.auth-doodle` hide-on-narrow-screens behavior.

**Landing Hero — done.** User-generated painted illustration (see 4.1) — depicts a neighborhood scene (pothole, overflow bin, broken streetlight, community garden), regenerated once after an earlier travel-themed draft was flagged as off-topic for the app. Stored as `client/src/assets/landing-hero-illustration.jpg` and rendered full-width below the hero text.

**Still placeholder:**
- Any empty/placeholder states added later

## 6. Explicitly out of scope

No mobile app or QR download page, no third-party OAuth login buttons, no wearable-device sync, no interest/preference onboarding quiz. CivicFix has none of these features, and none are being added as part of this visual redesign — if the user wants one of these as a genuinely new feature, that's a separate decision from this design system.

## 7. Pages covered by this file

1. Landing Hero (built)
2. Navbar (built)
3. Signup (built, refining)
4. Login (built, refining)
5. Home / issue feed (built)
6. Issue Detail (built)
7. Report Issue (built)
8. My Reports (built)
