# 03 — The trade catalogue

> **Current version: Part v4 (V6-0a, 2026-09-26) at the end of this file.** `/trades` is now the Client's way in. The text directly below is the V3 history (Fundi-facing catalogue); do not generate from it.

- **Device:** MOBILE (360 px).
- **Active bottom tab:** TRADES.
- Prepend the **SHELL** block from `00-shell-v2.md`.

---

## PAGE

1. **Hero:** the mono label "SMART FUNDIS / TRADES", the headline "Two trades live. Ten on the bench." and the dim line "Pick your trade, see exactly what the video must show, then record."
2. **"01 — LIVE" — two large trade evidence frames, stacked:**
   - **Electrical:**
     - Header: "TRADE 01 · ELECTRICAL" on the left, and the accent tag "LIVE" on the right.
     - A new grayscale photo of hands wiring a 13A wall socket, with a scan line.
     - The task title "Install a 13A socket".
     - A mini ledger "RUBRIC PREVIEW · EXAMPLE": "Isolate power · SAFETY", "Strip & terminate", "Earth continuity · SAFETY", "Faceplate secure". SAFETY is a small outlined mono tag.
     - A full-width accent pill "Verify now →".
   - **Hairdressing:**
     - Header: "TRADE 02 · HAIRDRESSING" and "LIVE".
     - A new grayscale photo of hands braiding cornrows.
     - The task title "Cornrows / braiding".
     - A mini ledger "RUBRIC PREVIEW · EXAMPLE": "Clean tools & hands · SAFETY", "Even parting", "Consistent tension", "Neat finish".
     - A full-width accent pill "Verify now →".
3. **"02 — ON THE BENCH":** a 2-column grid of ten plain readout cards (not buttons, not greyed out). Each has a small grayscale photo strip of that trade's tools on top, the mono tag "COMING SOON" and the trade name: Plumbing, Masonry, Carpentry, Welding, Mechanic, Tailoring, Beauty, Solar installation, Mama fua (laundry), Movers.
4. **A readout note:** "New trades open when their rubric and Experts are ready." Then the link "See the roadmap →".
5. The shared footer.

---
---

# Part v4 — `/trades`: find a fundi by trade (V6-0a, core)

- **Route:** `/trades` (public, no sign-in). Ticket V6-3, spec issue #31. Stories US-7.1 and US-7.6. Spec: `docs/superpowers/specs/2026-09-26-find-a-fundi-design.md` §2, §4, §6.1, §7, §14; ADR-22; D-24, D-25.
- **Device:** generate with **DESKTOP**, so both layouts render. It is one responsive web app, never a phone column on a desktop canvas. Design for 360 px first.
- **Base:** the built V3 page `exports/03-trades-v3-responsive.png` (on `v3/landing-page`): its header, section-label rhythm and photo tiles. Keep that look; change the job of the page.
- **Active nav item:** TRADES.
- **English only.** No Kiswahili and no language switcher.
- **The Stitch prompt is everything from "SIGNATURE IDEA" to "COMMON MISTAKES".** The "Handoff notes for frontend" at the end are not for Stitch.

---

## SIGNATURE IDEA AND FIDELITY CONSTRAINTS

The page is a **directory index laid out like an instrument's input panel**. A Client arrives needing a mechanic in Ruiru or a braider in Kisumu. The top of the page is a query (trade + county → results). Below it, every trade is an evidence frame with a documentary photo and one clear way through: **"Find a fundi →"**. A small legend teaches the three labels the Client will meet on the next page.

The page used to be for fundis ("Two trades live. Ten on the bench."). It is now for **clients first**. "Verify now" stays, but only as the secondary, fundi-facing action on the two trades that have a rubric.

**Negative constraints (Stitch must obey):**
- **Nothing looks live that isn't.** No "LIVE", "ONLINE", "ACTIVE", "SYSTEM ACTIVE", "AVAILABLE NOW", "OPEN NOW" or "BENCHMARK STATUS" chips, no pulsing status dots beside a trade, no blinking lights. "Verification coming soon" is a **plain readout**: never a button, never greyed out, never at reduced opacity.
- **No counts about fundis or activity:** no "1,240 fundis", "124 electricians in Nairobi", "2 trades available", "12 trades", "02 Live", "1 match inspected" or "results found". No view counts.
- **No ratings, stars, reviews, "top fundi", "best", "popular", "trending" or prices.**
- **Never "certified"**, "certificate", "accredited" or "licensed". The only allowed form is "NITA, KNQA and TVETs certify."
- **Never "unverified", "pending", "awaiting", "failed", "rejected" or "not approved".** The neutral wording is "Not yet verified".
- **Amber is punctuation only (95 / 5):** the section-label dots, the one amber-filled "Find fundis →" search button in the hero, the tick stroke of the ✓ in the legend, the active-nav underline and the focus ring. Everything else is graphite and white. No green anywhere, no red anywhere.
- **Mono text is 12 px or larger** everywhere (the V3 export used 9–10 px; raise it). Tap targets are at least 48 px. No horizontal scroll at 360 px.
- **No invented jargon** ("FILTER MATRIX", "DIRECTORY QUERY", "PARAM:01", "BENCH EVIDENCE FRAME", "INGRESS MONITOR", "Master Fundis", "tamper-evident log", "NEXT IN PIPELINE"). Use only the copy below.
- **Photos show hands, tools and work only.** No identifiable faces, no readable text, no logos, no brand hardware. Grayscale, high contrast, documentary.

---

## SHELL (v3, operator decision 2026-09-25; draw exactly this)

**Tokens:** background graphite `#050609`; panels `#0B0D12`; 1 px hairlines `rgba(242,244,247,.10)`; text `#f2f4f7`; secondary text `rgba(242,244,247,.55)`; the only accent is amber `#ef9a57`. Display and body font Inter (tight headlines, weight 500–600, letter-spacing −0.03em); readouts in JetBrains Mono, UPPERCASE, 0.26em tracking, 12 px minimum. Panels have a 4 px radius or none; buttons are pills at least 48 px tall; no drop shadows; a faint grain texture over the page.

**Header, mobile (< 768 px): two rows, sticky, blurred dark, a 1 px hairline under it.**
- **Row 1 (48 px):** on the left, the evidence-frame logo (four corner reticle brackets with an amber check inside) and the two-line lockup "SMART FUNDIS" over the dim mono tag "VERIFIED SKILLS"; on the right, the text link "Sign in" and a compact amber pill "JOIN" (hit area 48 px).
- **Row 2 (44 px, always visible):** the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY, spread across the width. The active item is white with a 2 px amber underline; the others are dim.
- **No menu icon, no menu sheet and no bottom tab bar.**

**Header, desktop (≥ 1024 px): one 72 px row.** The logo lockup on the left; the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY ▾ (About, Contact us) in the centre; "Sign in" and the amber pill "Join as a fundi" on the right.

**Footer (compact, the same on every page):**
- One 1 px hairline on top. **No "Show your work." band and no giant "SMART FUNDIS" wordmark.**
- Four link columns with mono amber headings (12 px, uppercase) and light-grey 14 px links; each link row is at least 44 px tall on mobile:
  - **FOR FUNDIS:** Join as a fundi · How verification works · Your privacy
  - **FOR CLIENTS:** Find a fundi · What 'verified' means
  - **FOR EXPERTS:** Become a verifier
  - **COMPANY:** About · Contact us · Pricing · Responsible AI · Roadmap
- Mobile: a 2 × 2 grid. Desktop: 4 columns in one row.
- Bottom line in small dim mono: "© 2026 Smart Fundis · We verify skills. NITA, KNQA and TVETs certify." on the left and "Email: info@smartfundis.com" on the right (stacked on mobile).

**Responsive:** below 768 px, single column with 16 px gutters; 768–1023 px, two columns where it helps; 1024 px and up, a centred container (max-width 1280 px, 32–48 px padding) on a 12-column grid with about 120 px between sections.

---

## PAGE

Each section opens with a mono label ("0N — TITLE") with a small amber dot, then a display title, then the body. Suggested `en.json` namespace `TradesPage`, one sub-key per section (in brackets).

### 1. Hero with the search bar `[TradesPage.hero]`, `[TradesPage.search]`

- **Mobile:** single column. Mono label "SMART FUNDIS / TRADES". Headline (44 px): "Find a skilled fundi." Dim sub-line: "Pick a trade and a county. Verified fundis come first."
- Directly under it, the **search bar**: one bordered instrument panel with corner reticle brackets and no status chips.
  - "TRADE": a 48 px dark select showing "All trades" (options: All trades, then the 12 trades of section 01).
  - "COUNTY": a 48 px dark select showing "All Kenya" (options: All Kenya, then all 47 counties of Kenya, for example Nairobi, Kiambu, Mombasa, Kisumu, Nakuru).
  - The page's one **amber-filled** pill: "Find fundis →", full width on mobile, graphite label.
  - Under the panel, one dim line "No account needed." and a text link "What the labels mean ↓" that jumps to section 02.
- **Desktop:** 2 columns. Text in 5 columns (label, 104 px headline over two lines "Find a skilled / fundi.", sub-line). The search panel in 7 columns, laid out as one row: TRADE select · COUNTY select · the amber "Find fundis →" pill.
- **No photo in the hero.** No status panel, no counts.

### 2. "01 — FIND BY TRADE" `[TradesPage.grid]`

- Title: "Every trade. Start here."
- Dim intro: "Tap a trade to see fundis who work in it."
- A grid of **12 equal trade tiles**: Electrical and Hairdressing first, then the other ten in the order below. **Mobile: 1 column. 768 px: 2 columns. Desktop: 3 columns.**
- **Every tile** is a bordered evidence frame (4 px radius, 1 px hairline) containing, top to bottom:
  1. A mono meta row: "TRADE 01" … "TRADE 12" on the left. On the right, plain mono text: "VERIFY NOW" in white on Electrical and Hairdressing, "COMING SOON" in dim on the other ten. No fill, no border, no dot, no amber.
  2. A **grayscale documentary photo**, 16:9, hands and tools only, with corner reticle brackets, a thin scan line and one small mono timestamp in a corner (for example "◆ 00:04"). The subject of each photo is listed below.
  3. The trade name in the display font (20 px, weight 600).
  4. The **primary action**, full width, 48 px: a **light-filled pill** (`#f2f4f7` fill, graphite `#050609` label) "Find a fundi →". It is the main action on every tile. **Do not fill it with amber**: twelve amber buttons would break the 95 / 5 rule, so the amber fill stays on the hero search button only.
  5. **Only on Electrical and Hairdressing**, under the primary pill: a dim mono caption "FOR FUNDIS", then a **secondary outlined pill** (transparent, 1 px hairline border, white label, 48 px) "Verify now →".
  6. **On the other ten tiles**, in the same place: one **plain readout line** in dim mono at full opacity, with no border and no button styling: "VERIFICATION COMING SOON". The tile is **not** greyed out and stays fully usable through "Find a fundi →".
- **The 12 tiles and their photos** (each a new grayscale documentary photo; hands and tools only; no faces, no readable text, no logos):
  1. **Electrical:** hands with a screwdriver terminating copper wires into an open 13A wall-socket box.
  2. **Hairdressing:** close-up of hands braiding neat cornrows; only the hands and the braids are visible (no face, no ear, no profile).
  3. **Plumbing:** hands tightening a pipe fitting with a wrench under a sink, tools on a bench.
  4. **Masonry:** a trowel spreading mortar on a course of blocks, a spirit level beside it.
  5. **Carpentry:** a row of hand tools (chisels, a plane, a tape measure) on a timber workbench, one hand holding a chisel.
  6. **Welding:** gloved hands and a welding torch at a steel joint on a workshop bench, a small spray of sparks.
  7. **Mechanic:** hands with a spanner in an engine bay; a work apron in frame from the chest down only.
  8. **Tailoring:** hands guiding fabric under a sewing-machine foot, a tape measure on the table.
  9. **Beauty:** hands filing and shaping nails over a small towel with tools laid out; no face.
  10. **Solar installation:** hands connecting cables at a solar-panel junction box on a rooftop frame.
  11. **Mama fua (laundry):** hands wringing washing over a basin, clothes pegs on a line.
  12. **Movers:** gloved hands strapping a wrapped wardrobe onto a hand trolley.

### 3. "02 — WHAT THE LABELS MEAN" `[TradesPage.legend]`

- Title: "Three labels. Nothing blurred."
- Dim intro: "You'll see these on every fundi card and profile."
- A **3-row legend ledger** (hairline rows; stacked on mobile; 3 equal columns on desktop). Each row shows the label **exactly as it looks on a fundi card**, then one dim explanation line:
  1. **Skill Badge:** a white ✓ glyph whose tick stroke is amber, followed by white text "Verified by Smart Fundis". Explanation: "An Expert in the trade watched this fundi's video of one task, recorded in the app, and approved it."
  2. **Expert verifier mark:** an **outlined mono tag** (1 px `#f2f4f7` border, 4 px radius, white text, no fill, not amber) holding a small 16 px line icon of an **eye inside four corner brackets** and the text "EXPERT VERIFIER · ELECTRICAL". **Never a ✓ inside this tag.** Explanation: "Smart Fundis approved this fundi to review other fundis' videos in this trade."
  3. **Not yet verified:** plain dim mono text "Not yet verified", the same size and weight as a county line, with **no icon, no border, no amber, no warning colour and no ◐**. Explanation: "This fundi hasn't earned a badge on Smart Fundis yet. It says nothing bad about their work."
- Under the ledger, one dim readout line: "Photos, videos, links and prices on a profile come from the fundi. Only ✓ is verified." and a text link "What 'verified' means →".

### 4. "03 — ARE YOU A FUNDI?" `[TradesPage.fundi]`

- One bordered readout panel, no photo. Stacked on mobile; 7 / 5 columns on desktop.
- Title: "Get found. Then get verified."
- Dim body: "Join free and clients can find you in any trade. In Electrical and Hairdressing you can also record one short video to earn a badge. More trades open when their rubric and Experts are ready."
- Actions: an outlined pill "Join as a fundi" and a dim text link "See the roadmap →".

### 5. The shared footer (from the SHELL above).

---

## RESPONSIVE SUMMARY

| Section | < 768 px | 768–1023 px | ≥ 1024 px |
| --- | --- | --- | --- |
| Hero + search | stacked: label, headline, sub-line, panel (selects stacked, pill full width) | stacked, the two selects side by side | 5 / 7 columns, search in one row |
| 01 trade grid | 1 column | 2 columns | 3 columns |
| 02 legend | 3 stacked rows | 3 stacked rows | 3 columns |
| 03 fundi panel | stacked | stacked | 7 / 5 |
| Footer | 2 × 2 | 2 × 2 | 4 columns |

## MOTION

- Section reveals use the masked line split (yPercent 118, power3.out, stagger 0.085). Each tile photo's scan line sweeps once as it enters the viewport. Nothing loops.
- `prefers-reduced-motion`: the final state, no movement.

## COMMON MISTAKES TO AVOID

- A "LIVE" chip on Electrical and Hairdressing, or "SYSTEM ACTIVE" anywhere.
- Any number about fundis or trades: "2 trades available", "124 electricians", "12 trades".
- Twelve amber buttons. "Find a fundi →" is light-filled; only the hero search button is amber.
- Drawing "Verification coming soon" as a disabled button, or fading the ten tiles.
- A green ✓, a ✓ inside the Expert verifier tag, or "Not yet verified" in amber, red or orange or with a warning icon.
- Stars, ratings, "top rated" or prices.
- Faces in any photo, including the Hairdressing and Beauty tiles.

---

## Handoff notes for frontend (not for Stitch)

- **Copy keys:** `TradesPage.hero.{label,title,body}`, `TradesPage.search.{trade,county,allTrades,allKenya,submit,noAccount,legendLink}`, `TradesPage.grid.{label,title,body,tradeNumber,verifyNowReadout,comingSoonReadout,findFundi,forFundis,verifyNow,verificationComingSoon}`, `TradesPage.legend.{label,title,body,badge,badgeBody,expert,expertBody,notYet,notYetBody,footnote,verifiedMeansLink}`, `TradesPage.fundi.{title,body,join,roadmap}`. Trade names reuse `Landing.trades.names.*`; county names come from `COUNTIES` in `convex/lib/counties.ts`.
- **Links:** "Find a fundi →" → `/fundis?trade=<slug>`. "Verify now →" → `/join?role=fundi&trade=<slug>` (prompt 14 pre-ticks the trade). Hero submit → `/fundis?trade=&county=` (drop empty params). "What 'verified' means →" → `/evidence#scope`. "Join as a fundi" → `/join?role=fundi`. "See the roadmap →" → the roadmap route.
- **Which trades get "Verify now":** from `trades.listForDiscovery` (`verifyNow: true`), not hard-coded, so a new rubric switches it on.
- **Photos: map each tile to the reviewed WebP set** (`design/stitch/exports/images/sf-*-{720,1280}.webp`, copied into `web/public/images/`), never Stitch's `lh3.googleusercontent.com` links:

  | Tile | File |
  | --- | --- |
  | Electrical | `sf-socket-terminal` |
  | Hairdressing | `sf-braiding-hands` |
  | Plumbing | `sf-plumbing-bench` |
  | Masonry | `sf-welding-bench` (reuse; no masonry photo yet) |
  | Carpentry | `sf-tools-row` |
  | Welding | `sf-welding-bench` |
  | Mechanic | `sf-mechanic-apron` |
  | Tailoring | `sf-tailoring-bench` |
  | Beauty | `sf-braiding-hands` (reuse; no beauty photo yet) |
  | Solar installation | `sf-panel-wiring` |
  | Mama fua (laundry) | `sf-tailoring-bench` (reuse; no laundry photo yet) |
  | Movers | `sf-hands-wrench` (reuse; no movers photo yet) |

  Four tiles reuse a photo. One photo per trade needs four new images (masonry, beauty, mama fua, movers); ask the designer. A Stitch-drawn photo can replace a reuse only after the HANDOFF §4 check for faces, text and logos.
- **The legend's ✓, the Expert tag and the "Not yet verified" style** are the same components as the `/fundis` card (prompt 13 Part v2). Build them once.
- **The "Pricing" footer link** has no page or copy key yet; `builtOnly()` hides it until the route exists.
