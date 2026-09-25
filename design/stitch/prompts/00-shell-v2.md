# 00 — Shared shell v2 (header, menu, bottom tabs, footer)

**Reference screen:** `3a2e568a398e4464a1a60a90a55b2037`, "Evidence Frame Step Inspector (Mobile)", exported as `exports/01-landing-v2.1-mobile-REFERENCE.{html,png}`. Every page copies its components and density.

Paste the **SHELL** block below at the top of every page prompt (02–13).

---

## SHELL (paste into every page prompt)

Match the "Evidence Frame Step Inspector (Mobile)" landing screen in this project exactly. The aesthetic is a precision instrument:
- a near-black background with 1 px hairline borders
- uppercase monospace readout labels with wide letter-spacing
- tight, extra-bold display headlines
- the warm accent used only as punctuation: status dots, active markers, the primary pill button and "needs review"
- a faint dot-grain texture

Every page is built from the same components:
- **Mono section labels** like "02 — RECORD" and "SMART FUNDIS / 01 — …", each with a small pulsing accent dot.
- **Evidence frames:** bordered panels with a meta header row ("EVIDENCE FRAME: EF-xxxx" on the left and a live status on the right), a grayscale documentary photo inside, a thin scan line, diamond ◆ step markers with mono timestamps, and corner-bracket reticles.
- **Instrument ledgers:** tables with hairline rows, mono column headers and tabular numbers.
- **Readout cards:** dark panels with a mono tag ("LIVE", "COMING SOON", "EXAMPLE") and a one-line value.
- **Pill buttons,** at least 48 px tall and full-width on mobile. The primary is an accent fill with dark text. The secondary is outlined.

**Imagery:** generate new documentary photographs for each page, shown only inside evidence frames. They are grayscale with high contrast, and show hands, tools and real Kenyan workshop and salon work (wiring, braiding, welding, carpentry). There are no identifiable faces, no readable text and no logos.

**Header (sticky, 48 px, blurred dark):**
- **Left:** a small rounded-square logo tile with an accent verified-check icon, and the wordmark "SMART FUNDIS" in wide-tracked uppercase.
- **Right:** a compact accent pill "JOIN" and a menu icon button.

**Menu sheet (opened from the menu icon):** it slides from the right, with 48 px rows:
- "EVIDENCE", "TRADES", "TELEMETRY"
- "COMPANY ▾", which expands to "About" and "Contact us"
- a hairline, then "Sign in", and a full-width accent pill "Join as a fundi"

**Bottom tab bar (fixed, 4 tabs, icon over a mono label):** EVIDENCE · TRADES · TELEMETRY · COMPANY. The active tab is in the accent colour and the others are dim. COMPANY opens a small sheet with "About" and "Contact us".

**Footer** (the same on every page):
- the giant headline "Show your work.", with the pill buttons "Join as a fundi" and "Find a fundi"
- mono accent group labels with dim links:
  - **FOR FUNDIS:** Join as a fundi · How verification works · Your privacy
  - **FOR CLIENTS:** Find a fundi · What 'verified' means
  - **FOR EXPERTS:** Become a verifier
  - **COMPANY:** About · Contact us · Responsible AI · Roadmap
- a large faint "SMART FUNDIS" mono wordmark between two hairlines
- "We verify skills. NITA, KNQA and TVETs certify." and "© 2026 Smart Fundis"

**Responsive (required):** build a responsive web app, not a phone column on a desktop canvas.
- **Below 768 px:** the mobile layout above.
- **1024 px and up:** a centred container (max-width 1280 px) on a 12-column grid, with a 72 px header. The header has the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY ▾ (About, Contact us), then "Sign in" and "Join as a fundi". There is no bottom tab bar.
- **Desktop sections:** 2-column heroes, multi-column grids, horizontal pipelines, and a 4-column footer.
- **Device:** generate with **DESKTOP** so both layouts render.

**Honesty rules (strict):**
- Never write "certified".
- Any sample badge, profile or fundi shows the tag "EXAMPLE".
- No counters, statistics, percentages, confidence scores, ratings, testimonials, partner logos or invented facts.
- Anything not built yet carries "COMING SOON" and is a plain readout, not a button.
- ✓ ticks are white. Only "needs review" (◐) uses the accent.
- Tap targets are at least 48 px, and there is no horizontal scroll at 360 px.
