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

### 4.1 Landing Hero — **new page**, logged-out visitors only

Structural reference: full-bleed hero — navbar, centered headline block, CTA row, small tagline.

- Navbar: ~72–80px tall (close to our current 20px/48px padding — keep as built), logo left, nav links, Log In/Sign Up pills right.
- Headline block vertically positioned ~45–60% down the viewport (not dead-center) — small icon glyph, then headline, then CTAs, then tagline, as one centered column, max-width ~640px, independent of the navbar's edge padding.
- Icon glyph (CivicFix pin mark): ~40px gap to headline below it.
- Headline: two lines, tight line-height (~1.1). Size to be tuned during mockup (reference scales to ~72–76px at 1920px width; Baloo 2 runs bold/wide, so CivicFix's version will likely sit ~56–64px — confirmed visually, not assumed).
- Gap headline → CTA row: ~48–56px.
- Two pill CTA buttons, ~52px tall, ~28px horizontal padding, ~16px gap between them, row centered.
- Gap CTA row → tagline: ~24px. Tagline: small (~13–14px), centered, Caveat handwritten style.
- Background: **illustration placeholder** (original artwork, not a photo) until the user supplies real illustration assets — swapped in without changing this structure. Text must stay legible against whatever art sits behind it (add a light scrim if needed once the art is in).
- Routing: `/` shows this page to logged-out visitors; logged-in visitors are routed straight to the issue feed (Home).

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

### 4.4 Navbar — refining what's already built

Already exists and works structurally (logo left, links center, actions right, login-state-aware buttons) — this is a small consistency pass, no layout changes.

- Hover transitions: add `0.15s` background/border-color/color transitions to nav links and buttons — every other interactive element in the app (form inputs, submit buttons) already animates on hover; the navbar was the one place that snapped instantly.
- Button padding: `10px 22px` → `11px 24px`; font-size `13px` → `13.5px` — a touch more comfortable to click, while staying clearly smaller-scale than the auth-page pill buttons (compact nav-button scale, not form-button scale).
- Navbar actions gap: `14px` → `16px` for slightly more breathing room between greeting/buttons.

## 5. Illustrations

**Signup / Login — done.** User-supplied character illustrations (a running figure; a figure surrounded by flying papers), recolored from their original coral-red to our accent orange (`#e8622c`) and background-stripped to transparent, replacing the earlier placeholder hand-drawn SVG doodles on those two pages. Papers illustration → Signup (top-right, 320px wide), running illustration → Login (top-left, 320px wide, mirrored layout). Each page keeps one route-doodle (SVG) and one handwritten caption alongside its character illustration. Both illustrations inherit the `.auth-doodle` hide-on-narrow-screens behavior.

**Still placeholder:**
- Landing hero background (new page, not yet built)
- Any empty/placeholder states added later

## 6. Explicitly out of scope

No mobile app or QR download page, no third-party OAuth login buttons, no wearable-device sync, no interest/preference onboarding quiz. CivicFix has none of these features, and none are being added as part of this visual redesign — if the user wants one of these as a genuinely new feature, that's a separate decision from this design system.

## 7. Pages covered by this file

1. Landing Hero (new)
2. Navbar (built)
3. Signup (built, refining)
4. Login (built, refining)
5. Home / issue feed (built)
6. Issue Detail (built — not yet revisited against this pass)
