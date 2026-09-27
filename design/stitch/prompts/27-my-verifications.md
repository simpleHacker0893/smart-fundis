# 27 — My verifications (list and detail)

- **Route:** `/fundi/verifications`, `/fundi/verifications/[id]`. Slice V7, ticket #45; builds #49 (V7-4).
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

SCREEN 27: MY VERIFICATIONS (list and detail)
Inside the app shell, Fundi menu, "My verifications" active.

LIST (/fundi/verifications): page title "My verifications", and on mobile the amber pill "Add video" beside or under the title. Hairline rows, newest first, each with the task as title, mono meta "ELECTRICAL · 25 SEP 2026", and one neutral chip: ◌ In line · ◌ AI checking · ◐ Awaiting expert review · ◐ Awaiting expert review · ↻ Record again · ■ Approved · ○ Not approved · ✕ Error on our side. All EXAMPLE. A "Show more" outlined pill at the end (no infinite scroll).

DETAIL (/fundi/verifications/[id]): a back link "My verifications", the task title "Install a 13A socket", mono meta "ELECTRICAL · RECORDED 25 SEP 2026", the status chip, then the status content. Human content always sits above AI content and is heavier.

Frames to draw (MOBILE unless stated):
1. DESKTOP, the list alone in the content column (the detail opens as its own page).
2. List, MOBILE.
3. List empty: mono "NOTHING HERE YET", "No verifications yet. Record a video of one task. An Expert reviews it.", amber "Add video".
4. Detail, queued: "Waiting in line for the AI check." No progress bar.
5. Detail, analyzing: "The AI is watching your video." Static ◌, no spinner, no percentage, no countdown.
6. Detail, awaiting review, drawn TWICE side by side and IDENTICAL (one is an AI pass, one a capped needs review; they must look exactly the same): chip ◐ "Awaiting expert review" and the line "An Expert will review your video." Nothing else. The two frames must be pixel-identical.
7. Detail, awaiting review, slow: the same as 6 plus the line "Taking longer than usual — you don't need to do anything." (this depends only on time waiting, never on the AI result).
8. Detail, reshoot from the video check: "Your video was too dark — record again in daylight." and an outlined pill "Record again".
9. Detail, reshoot from the Expert: a heavier block "EXPERT'S NOTE" with "Please show the tester on each wire before you connect it." Then an AI panel: "AI" tag, "AI suggestion", "An Expert decides.", STRENGTHS (2 bullets), GAPS (1 bullet), a feedback paragraph. Then a second AI panel: "AI" tag, "The AI noticed…", "An Expert decides.", and rows, safety items first each with a mono "SAFETY" tag: item text, the answer in words ("AI: yes", "AI: no", "The AI couldn't tell"), and one line of evidence as a quotation. A safety row reads "Needs a closer look". No timestamps. Use neutral EXAMPLE text, for example: STRENGTHS "Clear view of the terminals" and "Wires connected to the right terminals"; GAPS "Show the tester on each wire before connecting"; evidence "The breaker switch isn't in view before the wires are touched." Then the pill "Record again".
10. Detail, approved: first the Badge line (white ✓ with the amber tick) "Verified by Smart Fundis — Electrical: Install a 13A socket · 25 Sep 2026". No Expert note on approved (the approve note is for the record only). Then, above both AI panels, the line "Practice notes from the AI, for your next video. An Expert approved this video and gave you the badge." Then the AI suggestion panel and "The AI noticed…" panel; on this frame a safety row reads "Show this clearly next time." instead of "Needs a closer look".
11. Detail, rejected: EXPERT'S NOTE, the two AI panels, and an outlined pill "Appeal" with the dim line "You can appeal once. A different Expert will review it."
12. Detail, failed: ✕ "Something went wrong on our side — please record again." and "Record again".
13. Detail, liveness unreadable (on the reshoot frame): an extra line "We couldn't read your code." (never the digits).
14. List error: ✕ "COULDN'T LOAD", "We couldn't load your verifications. Try again in a moment.", outlined "Try again".
15. Detail not found: "We couldn't find this verification." and a link "Back to My verifications".
16. List, loading more: the "Show more" pill reads "Loading…" at the same size.

Rules: the Fundi never sees a verdict word, score, percentage, confidence or safety hint before the Expert decides. No timestamps and no jump buttons for the Fundi. No video player here. No images.
```

## Handoff notes for frontend (not for Stitch)

- Reads `dashboard.fundiVerifications` (new in #48, ask convex). The two awaiting-review frames must be pixel-identical (D-50); "Taking longer than usual" depends on waiting time only.
- **No Expert note on `approved`:** #41 tells the Expert the approve note is for the record and not shown to the Fundi. Spec §11.0 lists the note on approved; the Architect reconciles the spec with #41.
- Approved-state intro (rai-reviewer approved this wording, D-61): "Practice notes from the AI, for your next video. An Expert approved this video and gave you the badge." It sits above both AI panels. On approved, safety rows read "Show this clearly next time." (spec §11.0 says "needs a closer look"; the Architect amends it).
- Appeal and Delete video come from MVP V4 and stay hidden until it ships.
- Every string goes in `web/messages/en.json` only (D-64).
- Reuse `pillClass` (`web/components/ui/pill.ts`) through a **glow-free app variant** (the current primary pill adds an amber shadow, which app mode forbids).
- Status chips need a new `STATUS_CHIP` (4 px radius, mono 12 px, 28 px, glyph + words). The existing `CHIP` in `web/components/ui/chip.ts` is rounded-full sans and stays for tags; chips and tags must never look alike (D4).
- ✕ errors and safety markers are white/neutral. The current code uses amber (`text-primary`, `border-primary`) for errors, the flagged chip and the upload `<progress>`; the rebuild removes that.
- 4 px radius is `rounded` / `rounded-lg` in the token scale (`--radius-sm` is 2.4 px).
