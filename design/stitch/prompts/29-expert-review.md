# 29 — Expert review

- **Route:** `/expert/[assessmentId]`. Slice V7, ticket #45; builds #52 (V7-7), #53 (V7-8).
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

SCREEN 29: EXPERT REVIEW (/expert/[assessmentId])
Inside the app shell, Expert menu, "Queue" active. A back link "Review queue".

Layout: MOBILE is one column with the video player sticky at the top (16:9, full width). DESKTOP is two columns: left 7/12 the player and the decision, right 5/12 the observations and the AI panel.

Content:
1. Title "Install a 13A socket", mono meta "ELECTRICAL · WAITING 3 H".
2. Video player (16:9, a dark frame of hands wiring a wall socket with a small "EXAMPLE" tag; no faces, no children, no text, no identifiable room or address; native-looking controls, no download button).
3. "LIVENESS" readout block, mono: "CODE SHOWN · 482", "AI READ · 482", "CHECK · yes", and the dim line "A mismatch is a reason to look, not to reject."
4. "OBSERVATIONS", safety items first, each a hairline row: a mono "SAFETY" tag where it applies, the rubric item text (16 px), the AI's answer in words ("AI: yes", "AI: no", "The AI couldn't tell"), one line of evidence as a quotation after a small "AI" tag, and on the right a timestamp as plain mono text "0:42" (not a button) in a 48 px area. One row shows "--:--" labelled "no timestamp". Rubric examples: "Shows the breaker being switched off on camera before touching any wires." / "Holds the voltage tester to each wire on camera so its reading or light shows the power is off." / "Fixes the faceplate to the box straight and level, with no wires trapped."
5. AI panel (1 px outline, "AI" tag):
   - LOCKED state: a line lock icon and "Watch the whole video to see the AI suggestion." No blurred or skeleton preview of the hidden content.
   - UNLOCKED state: "AI suggestion — you decide", "AI suggests: needs review" in words only (no chip, no colour, no ✓), STRENGTHS and GAPS as plain lists, and where it applies the dim line "Checked with the backup model".
6. "YOUR DECISION", outside and below the AI panel: three 56 px radio rows "Approve", "Ask for a new video", "Reject", none pre-selected; a textarea "NOTE TO THE FUNDI" with a mono counter "0 / 1000" (required for the last two; for Approve the label reads "NOTE FOR THE RECORD — not shown to the Fundi"); the amber pill "Submit decision", disabled until a choice is made.

Frames to draw:
1. DESKTOP, before playback (AI panel locked).
2. DESKTOP, after playback (AI panel unlocked, "Ask for a new video" chosen, note filled).
3. MOBILE, before playback.
4. MOBILE, after playback with "Checked with the backup model".
5. MOBILE, liveness not readable: "AI READ · not readable", "CHECK · unclear".
6. MOBILE, note missing: "Reject" chosen, empty note, "✕ Add a note for the Fundi." under the field.
7. MOBILE, submitting: pill reads "Submitting…".
8. MOBILE, video failed to load: the player area shows ✕ "We couldn't load the video right now. Try again in a moment."; the AI panel stays locked; the decision is still available.
9. MOBILE, liveness mismatch: "CODE SHOWN · 482", "AI READ · 428", "CHECK · unclear", with the dim line "A mismatch is a reason to look, not to reject."
10. MOBILE, note too long: counter "1012 / 1000" and "✕ Keep the note under 1000 characters."
11. MOBILE, submit failed: under the pill "✕ We couldn't save your decision. Try again." with the choice and note kept.
12. MOBILE, not available: "This video has already been decided or isn't yours to review." and a link "Back to the queue". No player, no AI panel.
13. MOBILE, video deleted: the player area reads "The video has been deleted." and the AI panel stays locked.

Rules: no confidence number, percentage, score or gauge anywhere. No NVIDIA logo, green or model name. The AI's verdict appears only in words inside the unlocked panel. The decision sits below the AI panel. No images besides the user's own video.
```

## Handoff notes for frontend (not for Stitch)

- Today this reads `api.reviews.detail` and decides with `api.reviews.decide` (`NOTE_MAX_LENGTH` 1000 in `convex/reviews.ts`). V7-7 (#52) adds `expert.openReview`, `expert.markPlayedThrough` and `expert.reviewDetail` (new, ask convex).
- The AI panel unlocks on the player's first `ended` event. Timestamps stay plain text in V7. Keeps #41's fixes: no decision pre-selected, the approve note says it isn't shown to the Fundi, `controlsList="nodownload noremoteplayback"`, `disablePictureInPicture`.
- `livenessCheck` is only `yes` or `unclear` (ADR-19), so a mismatch shows as "CHECK · unclear".
- Every string goes in `web/messages/en.json` only (D-64).
- Reuse `pillClass` (`web/components/ui/pill.ts`) through a **glow-free app variant** (the current primary pill adds an amber shadow, which app mode forbids).
- Status chips need a new `STATUS_CHIP` (4 px radius, mono 12 px, 28 px, glyph + words). The existing `CHIP` in `web/components/ui/chip.ts` is rounded-full sans and stays for tags; chips and tags must never look alike (D4).
- ✕ errors and safety markers are white/neutral. The current code uses amber (`text-primary`, `border-primary`) for errors, the flagged chip and the upload `<progress>`; the rebuild removes that.
- 4 px radius is `rounded` / `rounded-lg` in the token scale (`--radius-sm` is 2.4 px).
