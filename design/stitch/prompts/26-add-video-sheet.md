# 26 — Add video sheet

- **Route:** a sheet over `/fundi`. Slice V7, ticket #45; builds #50 (V7-5).
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

SCREEN 26: "ADD VIDEO" SHEET
A sheet over the Fundi home (screen 25): a bottom sheet on MOBILE (4 px top radius, a decorative drag handle and a 48 px "Close" button), an anchored 400 px popover under the sidebar's "Add video" pill on DESKTOP.

Content:
1. Title "Add video" and the dim line "Choose how to add it."
2. Group A, a bordered panel you tap as one 48 px+ target: a line camera icon, the title "Record or upload", the line "Earns a badge once an Expert approves it.", and a chevron. Underneath, a dim note "You'll film one task with a code we give you."
3. A hairline divider with the mono word "OR".
4. Group B, a bordered panel: a line link icon, the title "Add a YouTube or TikTok link", the mono tag "SHOWCASE — NOT VERIFIED", and the line "Links never earn a badge. They show on your profile as examples of your work." Below it a 48 px text field labelled "LINK" with the placeholder "https://youtube.com/…", and an outlined pill "Add link". A dim line under the field: "Only link to videos of your own work."
No YouTube, TikTok or camera brand logos: plain line icons only.

Frames to draw:
1. MOBILE, default.
2. DESKTOP, default popover.
3. MOBILE, link filled with "https://youtu.be/EXAMPLE" and the pill enabled.
4. MOBILE, host error: the field keeps "https://facebook.com/EXAMPLE" and shows under it, linked to the field, "✕ Only YouTube or TikTok links can be added."
5. MOBILE, saving: the pill reads "Adding…" at the same size.
6. MOBILE, saved: a quiet confirmation line "Added to Showcase — not verified." with the link listed under a mono "SHOWCASE LINKS" label.
7. MOBILE, offline: Group B's pill disabled with "Needs a connection".
8. MOBILE, after "Record or upload": the existing upload flow restyled in app mode, as one frame with four stacked steps: "1 PICK A TASK" (trade and task rows), "2 YOUR CODE" (a large mono code "482" and "Write this on paper and show it in your video."), "3 RECORD" (outlined pills "Record video" and "Choose a video"), "4 CONSENT AND UPLOAD" (a consent checkbox row and the amber pill "Upload video").
9. MOBILE, uploading: a real upload progress bar (thin, white on hairline, with "Uploading… 42%") and an outlined "Cancel"; this is the only progress bar allowed because it is real.
10. MOBILE, upload stopped: "✕ Upload stopped — try again when you're online." and an outlined "Try again".

Rules: the one amber fill is not used inside the sheet; both actions are outlined, because neither is a completed verification. No images.
```

## Handoff notes for frontend (not for Stitch)

- "Record or upload" opens the existing #38 flow (`record-step.tsx`, `upload-flow.tsx`), restyled in app mode (frames 8–10). Real upload progress is the one progress bar allowed.
- The host check is server-side (`convex/lib/showcaseLinks.ts`); the link is never fetched (ADR-7).
- Desktop is an anchored popover (D2), not a centred dialog.
- Every string goes in `web/messages/en.json` only (D-64).
- Reuse `pillClass` (`web/components/ui/pill.ts`) through a **glow-free app variant** (the current primary pill adds an amber shadow, which app mode forbids).
- Status chips need a new `STATUS_CHIP` (4 px radius, mono 12 px, 28 px, glyph + words). The existing `CHIP` in `web/components/ui/chip.ts` is rounded-full sans and stays for tags; chips and tags must never look alike (D4).
- ✕ errors and safety markers are white/neutral. The current code uses amber (`text-primary`, `border-primary`) for errors, the flagged chip and the upload `<progress>`; the rebuild removes that.
- 4 px radius is `rounded` / `rounded-lg` in the token scale (`--radius-sm` is 2.4 px).
