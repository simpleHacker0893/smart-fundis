# 24 — App shell

- **Route:** every role route. Slice V7, ticket #45; builds #47 (V7-2).
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

SCREEN 24: APP SHELL (every signed-in dashboard)
Show the shell with a simple placeholder content area (page title "Home" and three hairline skeleton rows), so the navigation is the subject.

Frames to draw:
1. DESKTOP, Fundi: the sidebar with, from top: amber pill "Add video" (full width); OVERVIEW → Home (active); VERIFICATION → My verifications; PROFILE → Public profile, Showcase links; footer → Help, Sign out. Include the "SMART FUNDIS" group (Trades, Evidence, Company) above the footer. Header avatar "WK".
2. DESKTOP, Expert who is also a Fundi: sidebar with REVIEW → Queue (active); ACCOUNT → Profile. No amber pill at the top (Experts have no primary action). Footer: a "DASHBOARD" radio group with two 56 px rows "Expert dashboard ● Current" and "Fundi dashboard ○", then Help, Sign out.
3. MOBILE, Fundi: 56 px header (logo mark, mono "FUNDI", avatar "WK"); bottom nav Home (active) · Verifications · Profile · More.
4. MOBILE, the More sheet open over the Fundi home: a bottom sheet with a 4 px top radius, a drag handle AND a 48 px "Close" button; inside, the same grouped menu as the desktop sidebar (OVERVIEW, VERIFICATION, PROFILE, ACCOUNT), then a mono "SMART FUNDIS" group with Trades, Evidence, Company, then Help and Sign out. The current item is marked active.
5. MOBILE, the avatar sheet for the dual-role user: initials (never a photo), name "Wanjiku K." and "wanjiku@example.com" (EXAMPLE), the "DASHBOARD" radio rows (Fundi dashboard ● Current, Expert dashboard ○), a pending state line "Switching…", then "Manage account" and "Sign out".
6. MOBILE, the avatar sheet for a single-role Fundi: no "DASHBOARD" group at all (no greyed-out roles), just the name, "Manage account" and "Sign out".
7. MOBILE, role switch failed: under the radio rows "✕ We couldn't switch dashboards. Try again." with the previous role still marked Current.
8. MOBILE, loading: header and bottom nav drawn, content as hairline skeleton blocks in #0B0D12 (no spinner).
9. MOBILE, offline: a 40 px strip under the header with ✕ "You're offline. Showing what loaded at 14:05."; a server action pill disabled with the reason "Needs a connection".
10. MOBILE, back online: the strip reads "Back online" (it disappears after 3 s).
11. MOBILE, page error: a bordered panel with ✕, mono "COULDN'T LOAD", "We couldn't load this page. Check your connection and try again.", and an outlined pill "Try again".

Rules: role screens show no marketing header or footer. No bell icon (it arrives later). Bottom nav items have no count badges or dots. The header role label always names the current dashboard. No images anywhere.
```

## Handoff notes for frontend (not for Stitch)

- Role routes get their own route group without `SiteHeader` and `SiteFooter`: today `SiteHeader` is mounted in the root `web/app/layout.tsx` and `SiteFooter` in `web/app/(site)/layout.tsx`, so the shell would stack under the marketing header. The skip link and `scroll-mt` move into the shell.
- The avatar sheet is a custom initials sheet; "Manage account" opens Clerk's account page (today's `HeaderAccount` uses Clerk `UserButton`, which shows a photo).
- Sheets use native `<dialog>` (as `record-step.tsx` does) or the installed `@base-ui/react`; no gesture library. The drag handle is decorative.
- The role switch calls `users.setDashboardPref` (V7-1, #46). Expert "History" was dropped from the menu (no V7 ticket builds it).
- Every string goes in `web/messages/en.json` only (D-64).
- Reuse `pillClass` (`web/components/ui/pill.ts`) through a **glow-free app variant** (the current primary pill adds an amber shadow, which app mode forbids).
- Status chips need a new `STATUS_CHIP` (4 px radius, mono 12 px, 28 px, glyph + words). The existing `CHIP` in `web/components/ui/chip.ts` is rounded-full sans and stays for tags; chips and tags must never look alike (D4).
- ✕ errors and safety markers are white/neutral. The current code uses amber (`text-primary`, `border-primary`) for errors, the flagged chip and the upload `<progress>`; the rebuild removes that.
- 4 px radius is `rounded` / `rounded-lg` in the token scale (`--radius-sm` is 2.4 px).
