# 25 — Fundi home

- **Route:** `/fundi`. Slice V7, ticket #45; builds #49 (V7-4), #51 (V7-6).
- **Device:** DESKTOP generation so both frames render; export mobile (360 px) and responsive (1280 px).
- **Rules:** `DESIGN.md` "Dashboards (V2, app mode)" D1–D10, D-65 (categorized sidebar, proposed) and D-64 (English only). Inventory: `V7-inventory.md`.
- **Stitch:** project `6238825713575829455`, design system `assets/9016596879974394620` ("Instrument").
- **Reviews:** frontend buildability check and rai-reviewer copy check applied (2026-09-27).
- **Status:** draft, waiting for the operator's approval before generation.

## Stitch prompt (paste as is)

```text
APP MODE DESIGN SYSTEM (Smart Fundis "Instrument", dashboards)
- Responsive web app. Draw two frames: MOBILE 360 px and DESKTOP 1280 px.
- Clean, professional, calm: a precision instrument in daily use. Quiet chrome, the user's content reads first.
- Colours: page #050609 (graphite); panels #0B0D12; 1 px hairlines rgba(242,244,247,.10); text #f2f4f7; secondary text rgba(242,244,247,.55). Amber #ef9a57 ONLY for: the one primary pill per viewport (graphite label), the 2 px active-nav bar, the focus ring, and the Badge tick. No other colours: no green, no red, no gradients, no glows, no drop shadows, no grain, no photos.
- Type: the system UI stack (render as Inter) for UI; JetBrains Mono for labels and metadata. Page title 28 px mobile / 40 px desktop, weight 600, -0.02em. Section label mono 12 px UPPERCASE, 0.26em tracking, secondary colour. Row title 16 px/600. Body 16 px, line-height 1.5. Meta mono 12 px secondary. Nothing below 12 px. Numbers tabular.
- Shape: panels square or 4 px radius; buttons are pills at least 48 px tall with UPPERCASE bold 12 px tracked labels and no glow; 1 px hairlines. 8 px grid; gutters 16 px mobile, 32 px desktop; sections 32 px apart mobile, 48 px desktop.
- Lists are hairline-divided rows (min 56 px), not cards. Each row: title, mono meta line, and ONE status chip or ONE chevron on the right.
- Status chip: 28 px tall, 1 px neutral outline, 4 px radius, mono 12 px, one glyph + words: ◌ in line / AI checking, ◐ awaiting a person, ● listed, ■ approved, ↻ record again, ○ not active / not approved, ✕ error. Never coloured, never amber, never ✓ (✓ belongs to Badges only).
- Role screens have NO marketing site header or footer: the app shell's own header replaces them.
- Errors, ✕ glyphs and safety markers are white/neutral, never amber.
- Navigation (all role screens): DESKTOP = 248 px left sidebar on #0B0D12 with a right hairline; the role's primary amber pill at the top (Fundi: "Add video"); menu items grouped under mono 12 px UPPERCASE category labels; items are 48 px rows (20 px line icon + 16 px label); active item = white label, 2 px amber bar on its left edge, 4% white fill; a small "SMART FUNDIS" group with Trades, Evidence, Company; footer pinned at the bottom with Help and Sign out. Header 64 px: logo lockup left, initials avatar right. MOBILE = 56 px header (logo mark + mono role label "FUNDI" or "EXPERT" left, initials avatar right) and a fixed 64 px bottom nav of at most 4 slots ending in "More" (24 px icon over a 12 px label; active = white with a 2 px amber bar on top).
- Logo: a rounded square outline in 70% white with an amber check stroke; wordmark "Smart Fundis" with the mono tag "VERIFIED SKILLS".
- English only. No language toggle. Labels must still fit if 30% longer.
- Sheets: bottom sheets on mobile (the drag handle is decorative; a 48 px "Close" button and the backdrop dismiss); anchored popovers on desktop.
- Honesty: always "Verified by Smart Fundis", never "certified", "vetted", "trusted", "top", "best" or "AI verified". No ratings, scores, percentages, progress bars (except real upload progress), streaks or live counters. Nothing that looks live when it isn't. Sample data carries a small "EXAMPLE" tag.
- AI output always sits in its own 1 px outlined panel (no fill change, no amber, no ✓) that opens with a small outlined "AI" tag. No confidence numbers, gauges, NVIDIA logos, green, or model names.
- Accessibility: WCAG 2.2 AA, tap targets at least 48 px, visible 2 px amber focus ring, status never shown by colour alone.

SCREEN 25: FUNDI HOME (/fundi)
Inside the app shell (screen 24), Fundi menu, "Home" active.

Content, top to bottom (mobile order; desktop uses a two-column grid: left column 1–3, right column 4–5):
1. Page title "Get your work verified." and the dim line "Record a video of one task. The AI checks it, then an Expert decides." On MOBILE only, a full-width amber pill "Add video" right under it (on desktop the sidebar pill is the one amber fill).
2. Section "MY VERIFICATIONS" with a "See all" text link: three hairline rows, each with the task as title, mono meta "ELECTRICAL · 2 H AGO", and one neutral chip on the right:
   - "Install a 13A socket" · ◐ Awaiting expert review
   - "Cornrows" (meta "HAIRDRESSING · 1 H AGO") · ◌ AI checking
   - "Install a 13A socket" · ↻ Record again
   All tagged EXAMPLE.
3. Section "YOUR BADGES": if none, plain dim text "Not yet verified". In the verified frame, one Badge line: a white ✓ with an amber tick, "Verified by Smart Fundis — Electrical: Install a 13A socket · 25 Sep 2026" (EXAMPLE).
4. Card "LISTING STATUS": a chip "● Listed · Not yet verified", the line "Clients can find your profile. A badge shows once an Expert approves a video.", and an outlined pill "View my public profile".
5. Card "FINISH YOUR PROFILE": the line "Still to add:" and then only the named missing items as 48 px rows with a chevron: "Photo of your work" with the dim line "Clients look at these first", and "About your work". No count, number, bar or ring.

Frames to draw:
1. DESKTOP, busy Fundi (as above).
2. MOBILE, busy Fundi (as above, single column).
3. MOBILE, new Fundi: MY VERIFICATIONS is an empty-state panel (mono "NOTHING HERE YET", "No verifications yet. Record a video of one task. An Expert reviews it.", and the amber "Add video" is the only action); FINISH YOUR PROFILE lists five missing items by name.
4. MOBILE, verified Fundi: the Badge line under YOUR BADGES and the chip "● Listed".
5. MOBILE, loading: skeleton rows and card blocks matching the layout.
6. MOBILE, one card failed: LISTING STATUS shows ✕ "COULDN'T LOAD" with "Try again" while the rest of the page works.
7. MOBILE, listing states: the LISTING STATUS card drawn three ways, stacked: "○ Not showing" with "Your profile is hidden from clients." and an outlined pill "Show my profile"; "✕ Hidden by Smart Fundis" with "Contact info@smartfundis.com to ask why."; and "● Listed" with a Badge.

Rules: no percentages, rings or progress bars. No images or photo placeholders. Only the Badge uses ✓ or amber. No "Jobs near you" section (it arrives later).
```

## Handoff notes for frontend (not for Stitch)

- Completeness is a list of **named missing items only** (DESIGN.md D3.6, rai-reviewer). This overrides #44's "4 of 6 done" wording: the Architect updates #44.
- The Listing card depends on V6-1 `listings`; until it ships the card is gated off in code (no frame drawn for a placeholder).
- Every string goes in `web/messages/en.json` only (D-64).
- Reuse `pillClass` (`web/components/ui/pill.ts`) through a **glow-free app variant** (the current primary pill adds an amber shadow, which app mode forbids).
- Status chips need a new `STATUS_CHIP` (4 px radius, mono 12 px, 28 px, glyph + words). The existing `CHIP` in `web/components/ui/chip.ts` is rounded-full sans and stays for tags; chips and tags must never look alike (D4).
- ✕ errors and safety markers are white/neutral. The current code uses amber (`text-primary`, `border-primary`) for errors, the flagged chip and the upload `<progress>`; the rebuild removes that.
- 4 px radius is `rounded` / `rounded-lg` in the token scale (`--radius-sm` is 2.4 px).
