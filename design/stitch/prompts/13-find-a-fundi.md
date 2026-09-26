# 13 — Find a fundi (footer: For clients)

> **Current version: Part v2 (V6-0a, 2026-09-26) at the end of this file.** Every Listed Fundi appears; verification is shown, not required (D-24). The text directly below is history (verified-only directory); do not generate from it.

- **Device:** MOBILE (360 px).
- **Active bottom tab:** EVIDENCE.
- Prepend the **SHELL** block from `00-shell-v2.md`.

---

## PAGE

1. **Hero:** the mono label "SMART FUNDIS / DIRECTORY", the headline "Find a verified fundi." and the dim sub-line "Only fundis with an Expert-approved badge appear here."
2. **A filter bar** styled as instrument controls, with two 48 px selects: "TRADE" (Electrical, Hairdressing) and "COUNTY", plus an accent pill "Show fundis".
3. **"01 — RESULTS":** first, one sample fundi card tagged "EXAMPLE":
   - a grayscale photo of hands at work (no face)
   - "Example Fundi · Kiambu County"
   - badge rows "✓ Electrical: Install a 13A socket"
   - an outlined pill "View profile"
4. **Then an empty-state evidence frame** ("NO SIGNAL YET") with a new grayscale photo of an empty workbench under a lamp. It reads "No verified fundis here yet. New badges appear as Experts approve them."
5. The shared footer.

---
---

# Part v2 — `/fundis`: results (V6-0a, core)

- **Route:** `/fundis?trade=&county=&area=&verified=1` (public, no sign-in; the URL is the state). Ticket V6-2, spec issue #31. Stories US-7.2, US-7.3, US-7.6, US-7.17. Spec: `docs/superpowers/specs/2026-09-26-find-a-fundi-design.md` §4, §5, §6.1, §7, §8.4; ADR-21, ADR-22; D-24, D-25.
- **Device:** generate with **DESKTOP**, so both layouts render. One responsive web app, never a phone column on a desktop canvas. Design for 360 px first.
- **Base:** the built V3 look (`exports/03-trades-v3-responsive.png` and `exports/13-find-a-fundi-v3-responsive.png`, on `v3/landing-page`) for the header, section labels and panels. Drop the V3 page's copy, its "EXAMPLE" single card, its "ACTIVE READY" / "ACTIVE" chips, its warning-triangle empty state and its "RADAR STATUS" line.
- **Active nav item:** TRADES (the Client reaches this page from TRADES).
- **English only.** No Kiswahili and no language switcher.
- **The Stitch prompt is everything from "SIGNATURE IDEA" to "COMMON MISTAKES".** The "Handoff notes for frontend" are not for Stitch.

---

## SIGNATURE IDEA AND FIDELITY CONSTRAINTS

The page is a **readout of a query**: the filters are the instrument's controls, one mono line states how the results are ordered, and each fundi is a card that says exactly one true thing about verification. Three kinds of label appear, and they must never look alike:

- **Skill Badge** — a white ✓ with an amber tick stroke, then "<Trade>: <Task>". The only amber on a card.
- **Expert verifier mark** — an outlined white mono tag with its own line icon (an eye inside four corner brackets). No ✓, no amber. It must not read as a second skill Badge.
- **Not yet verified** — plain dim mono text, exactly like the county line. No icon, no border, no amber, no warning colour.

Every listed fundi appears. **Verified fundis come first**, and one chip, "Verified only", hides the rest.

**Negative constraints (Stitch must obey):**
- **Cards never show a phone number, a call or WhatsApp button, rates or prices, a bio, an email, videos or links.** Those belong on the profile only.
- **Nothing looks live that isn't.** No "LIVE", "ONLINE", "ACTIVE", "AVAILABLE NOW", "OPEN NOW", "RESPONDS FAST" or "LAST SEEN" chips, no green or pulsing presence dots on cards or avatars.
- **No counts:** no "124 fundis found", "showing 24 of 130", "1 match inspected", no review, view or contact counts.
- **No ratings, stars, reviews, "top fundi", "best", "recommended" or "popular"**, and no sorting by price or rating. The only sort is "Verified first".
- **No "Book now", "Hire", "Message", "Chat", "Pay with M-Pesa", "Save" or heart icons.** None of these exist.
- **Never "certified"**, "accredited" or "licensed". **Never "unverified", "pending", "awaiting review", "failed", "rejected" or "not approved".**
- **Amber is punctuation only (95 / 5):** section-label dots, the ✓ tick strokes on skill Badges, the active-nav underline, the one amber "Show fundis" button, and the focus ring. No green, no red. "Not yet verified" is never amber.
- **Mono text is 12 px or larger.** Tap targets are at least 48 px. No horizontal scroll at 360 px.
- **No invented jargon** ("FILTER MATRIX", "DIRECTORY QUERY", "PARAM:01", "AUDITED SINGLE TAKE", "VERIFIED ARTISAN PROFILE", "BOUNDARY RADAR", "INGRESS MONITOR"). Use only the copy below.
- **Photos show hands, tools and work only.** No identifiable faces, no readable text, no logos. Grayscale, documentary.

---

## SHELL (v3, operator decision 2026-09-25; draw exactly this)

**Tokens:** background graphite `#050609`; panels `#0B0D12`; 1 px hairlines `rgba(242,244,247,.10)`; text `#f2f4f7`; secondary text `rgba(242,244,247,.55)`; the only accent is amber `#ef9a57`. Display and body font Inter (tight headlines, weight 500–600, letter-spacing −0.03em); readouts in JetBrains Mono, UPPERCASE, 0.26em tracking, 12 px minimum. Panels have a 4 px radius or none; buttons are pills at least 48 px tall; no drop shadows; a faint grain texture over the page.

**Header, mobile (< 768 px): two rows, sticky, blurred dark, a 1 px hairline under it.**
- **Row 1 (48 px):** on the left, the evidence-frame logo (four corner reticle brackets with an amber check inside) and the two-line lockup "SMART FUNDIS" over the dim mono tag "VERIFIED SKILLS"; on the right, the text link "Sign in" and a compact amber pill "JOIN" (hit area 48 px).
- **Row 2 (44 px, always visible):** the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY, spread across the width. **TRADES is active:** white with a 2 px amber underline; the others are dim.
- **No menu icon, no menu sheet and no bottom tab bar.**

**Header, desktop (≥ 1024 px): one 72 px row.** The logo lockup on the left; the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY ▾ (About, Contact us) in the centre, TRADES active; "Sign in" and the amber pill "Join as a fundi" on the right.

**Footer (compact, the same on every page):**
- One 1 px hairline on top. **No "Show your work." band and no giant "SMART FUNDIS" wordmark.**
- Four link columns with mono amber headings (12 px, uppercase) and light-grey 14 px links; each link row is at least 44 px tall on mobile:
  - **FOR FUNDIS:** Join as a fundi · How verification works · Your privacy
  - **FOR CLIENTS:** Find a fundi (current page: white with an amber underline) · What 'verified' means
  - **FOR EXPERTS:** Become a verifier
  - **COMPANY:** About · Contact us · Pricing · Responsible AI · Roadmap
- Mobile: a 2 × 2 grid. Desktop: 4 columns in one row.
- Bottom line in small dim mono: "© 2026 Smart Fundis · We verify skills. NITA, KNQA and TVETs certify." on the left and "Email: info@smartfundis.com" on the right (stacked on mobile).

**Responsive:** below 768 px, single column with 16 px gutters; 768–1023 px, two columns; 1024 px and up, a centred container (max-width 1280 px, 32–48 px padding) on a 12-column grid.

---

## PAGE

The main frame shows the page **after a Client tapped Electrical on `/trades` and picked Kiambu**: TRADE = Electrical, COUNTY = Kiambu, AREA empty, "Verified only" off. Suggested `en.json` namespace `FundisPage` (sub-keys in brackets).

### 1. Hero `[FundisPage.hero]`

- Mono label "SMART FUNDIS / FIND A FUNDI". Headline (44 px mobile, 64 px desktop — this is a working page, not a landing hero): "Find a fundi." Dim sub-line: "Every listed fundi is here. Verified fundis come first."
- Desktop: the headline and sub-line in 7 columns; nothing on the right. No photo.

### 2. Filters `[FundisPage.filters]`

One bordered instrument panel with corner reticle brackets, no status chip.

- **"TRADE"** — a 48 px dark select showing "Electrical" (options: All trades, then Electrical, Hairdressing, Plumbing, Masonry, Carpentry, Welding, Mechanic, Tailoring, Beauty, Solar installation, Mama fua (laundry), Movers). No "(Live)" suffix.
- **"COUNTY"** — a 48 px dark select showing "Kiambu" (options: All Kenya, then all 47 counties).
- **"AREA"** — a 48 px dark text input with the dim placeholder "Estate or town, e.g. Ruiru" and a small "×" clear button inside the right edge (48 px hit area) that shows only when the field has text.
- **"Verified only"** — a 48 px toggle chip, pill-shaped. **Off (drawn in the main frame):** transparent, 1 px hairline border, white label "Verified only". **On (drawn in state frame A):** `#f2f4f7` fill with a graphite label and a small filled square indicator before the text. **Do not use a ✓ in the chip** (✓ is reserved for skill Badges).
- **"Show fundis"** — the page's one amber-filled pill, graphite label.
- **Mobile:** TRADE, COUNTY and AREA stacked full width; the chip and "Show fundis" share the last row (chip left, pill right), both 48 px.
- **Desktop:** one row across 12 columns: TRADE (3) · COUNTY (3) · AREA (3) · chip (1–2) · "Show fundis" (1–2).

### 3. "01 — FUNDIS" results header `[FundisPage.results]`

- The mono section label "01 — FUNDIS" with the amber dot. On the right of the same row, the **order readout** in dim mono: "VERIFIED FIRST". (In state frame A it reads "BEST MATCH FOR 'RUIRU'".) No count of results.
- Under it, the **active filter line** in mono: "ELECTRICAL · KIAMBU" (in frame A: "ELECTRICAL · KIAMBU · RUIRU · VERIFIED ONLY").
- Under it, a one-line **inline legend** in 12 px: the white ✓ (amber tick) "Verified by Smart Fundis" · the outlined Expert tag icon "Expert verifier" · dim "Not yet verified", then a text link "What these mean →".
- One small mono tag at the far right of the header row, outlined dim: "EXAMPLE DATA" (the names below are samples for this design only).

### 4. The card grid `[FundisPage.card]`

**Mobile: 1 column. 768 px: 2 columns. Desktop: 3 columns.** 16 px gaps on mobile, 24 px on desktop. Every card is one 4 px-radius panel (`#0B0D12`, 1 px hairline border), and the whole card is one link to the profile.

**Card anatomy, top to bottom (the only things a card may show):**
1. **Cover, 4:3.** Either a grayscale documentary photo of the fundi's own work (hands and tools only) with corner reticle brackets, **or** an **initials tile**: the panel colour with a faint grid, the fundi's initials in large white mono (48 px), corner brackets. No avatar circles, no faces, no presence dots.
2. **Display name** — display font, 20 px, weight 600, white.
3. **Place** — dim mono, 12–13 px: "KIAMBU · RUIRU".
4. **Verification block** — exactly one of these:
   - **Skill Badge lines** (up to 3), each: a white ✓ glyph with an amber tick stroke, then white text "Electrical: Install a 13A socket". If there are more than 3, a fourth dim line "+2 more".
   - **"Not yet verified in Electrical"** (only in a Trade filter, for a fundi who declared the trade but holds no Badge in it) — plain dim mono, same size and weight as the place line. No icon, no border.
   - **"Not yet verified"** (no Trade filter) — the same plain dim style.
5. **Expert verifier marks** (up to 2, then "+N more"), if any: each an **outlined mono tag** (1 px white border, 4 px radius, white text, no fill), 32 px tall, with a 16 px line icon of an **eye inside four corner brackets** and the text "EXPERT VERIFIER · ELECTRICAL". Never a ✓, never amber.
6. **Demo tag** (Demo profiles only): an outlined dim mono tag "DEMO: NOT A REAL VERIFICATION", on its own line above the name.
7. **"View profile →"** — a secondary outlined pill, full width, 48 px.

**The six cards in the main frame, in this order** (verified first, then Demo, then not yet verified):
1. **Achieng Otieno** — cover photo: close-up of hands with a screwdriver seating a 13A socket faceplate. "KIAMBU · RUIRU". Badge line "✓ Electrical: Install a 13A socket".
2. **Kamau Mwangi** — cover photo: hands routing cables into a distribution board. "KIAMBU · THIKA". Badge line "✓ Electrical: Install a 13A socket". Then the Expert tag "EXPERT VERIFIER · ELECTRICAL".
3. **Njeri Wanjiku** — initials tile "NW". "KIAMBU · JUJA". No badge line; only the Expert tag "EXPERT VERIFIER · ELECTRICAL".
4. **Demo card: Baraka Ochieng** — initials tile "BO" (Demo profiles never have photos). The tag "DEMO: NOT A REAL VERIFICATION" above the name. "KIAMBU · KIKUYU". Badge line "✓ Electrical: Install a 13A socket".
5. **Wambui Kariuki** — cover photo: hands holding a voltage tester on a workbench with coiled cable. "KIAMBU · RUIRU". Dim line "Not yet verified in Electrical".
6. **Mutua Kioko** — initials tile "MK". "KIAMBU · LIMURU". Dim line "Not yet verified in Electrical".

### 5. Under the grid `[FundisPage.more]`

- A centred secondary outlined pill "Show more" (48 px, full width on mobile, 240 px on desktop). No "24 of N" text.
- One dim readout line under it: "Smart Fundis verifies only the tasks shown with ✓. Agree the price and the work directly with the fundi."

### 6. The shared footer (from the SHELL above).

---

## STATE FRAMES (draw as extra frames below the main one, each with a small mono caption)

**A. "VERIFIED ONLY · AREA"** — the filter panel with AREA = "Ruiru" (clear "×" visible) and the "Verified only" chip **on**. Readout "BEST MATCH FOR 'RUIRU'"; filter line "ELECTRICAL · KIAMBU · RUIRU · VERIFIED ONLY". Two cards only: Achieng Otieno and Kamau Mwangi as above. No Demo or "Not yet verified" cards.

**B. "EMPTY"** `[FundisPage.empty]` — the filters: TRADE = Welding, COUNTY = Kisumu, AREA = "Nyalenda", chip on. In place of the grid, one evidence frame:
- meta row "EVIDENCE FRAME: EF-0404" left and dim mono "NO SIGNAL YET" right (no amber fill, no warning icon);
- a 16:9 grayscale documentary photo of an empty workbench under a single hanging lamp, tools resting, no people;
- the display line "No fundis match yet."
- the dim line "Try a wider search."
- three secondary outlined pills (48 px, stacked on mobile, in a row on desktop): "Clear area" · "All Kenya" · "Include not yet verified".
- **No triangle or warning glyph, no "radar status" line.**

**C. "LOADING"** — the grid as six skeleton cards: panel blocks for the cover, two hairline bars for the text, no shimmer in amber (a slow grey shimmer, off under reduced motion). The "Show more" pill in its loading state reads "Loading…".

**D. "ERROR"** — in place of the grid, a bordered readout panel: mono tag "COULDN'T LOAD", the line "We couldn't load fundis. Check your connection and try again." and a secondary outlined pill "Try again". No red.

---

## RESPONSIVE SUMMARY

| Part | < 768 px | 768–1023 px | ≥ 1024 px |
| --- | --- | --- | --- |
| Filters | stacked fields; chip + "Show fundis" on one row | TRADE + COUNTY on one row, AREA below, then chip + button | one row, 3 · 3 · 3 · chip · button |
| Results header | label, then readout, filter line, legend stacked | same | label left, readout and "EXAMPLE DATA" right; legend on one line |
| Card grid | 1 column | 2 columns | 3 columns |
| Empty frame | stacked pills | pills in a row | photo 7 / text and pills 5 |

## MOTION

- Cards fade up once as they enter (stagger 0.06), no hover wobble; on hover the border brightens and the card lifts −2 px. The cover photo's scan line sweeps once.
- `prefers-reduced-motion`: no movement.

## COMMON MISTAKES TO AVOID

- A phone number, a "Call" / "WhatsApp" button, a price or a bio on a card.
- Stars, a rating, "top rated", a review count or a result count.
- An "ONLINE" / "AVAILABLE" dot or chip on a card.
- A ✓ inside the Expert verifier tag, or the Expert tag in amber or filled like a badge.
- "Not yet verified" in amber, red or orange, with a warning icon, a ◐, a border or a lower opacity than the place line.
- "Unverified", "pending" or "awaiting review" anywhere.
- A ✓ in the "Verified only" chip.
- A photo on the Demo card, or a Demo card without its tag.
- Faces in any cover photo.

---

## Handoff notes for frontend (not for Stitch)

- **Copy keys:** `FundisPage.hero.{label,title,body}`, `FundisPage.filters.{trade,allTrades,county,allKenya,area,areaPlaceholder,clearArea,verifiedOnly,submit}`, `FundisPage.results.{label,orderVerifiedFirst,orderBestMatch,legendBadge,legendExpert,legendNotYet,legendLink}`, `FundisPage.card.{badgeLine,moreBadges,notYetVerified,notYetVerifiedIn,expertMark,moreExpert,demo,viewProfile}`, `FundisPage.more.{showMore,loading,disclaimer}`, `FundisPage.empty.{frame,signal,title,body,clearArea,allKenya,includeNotYet}`, `FundisPage.error.{tag,body,retry}`.
- **Drop the "EXAMPLE DATA" tag and the sample names** in the build: cards come from `listings.search` (`ListingCard`, spec §11). Demo cards carry `FundisPage.card.demo`.
- **Label rules (spec §6.1):** `badges.length > 0` → Badge lines (≤ 3, `moreBadges` → "+N more"); else if `expert` → Expert tags only; else `notYetVerifiedIn ? "Not yet verified in <Trade>" : "Not yet verified"`. The Expert tags show alongside Badge lines when both exist. "Not yet verified" uses `--dim`; Playwright asserts it is not amber.
- **Empty-state suggestions:** "Clear area" only when `area` is set; "All Kenya" only when `county` is set; "Include not yet verified" only when `verified=1`. Each rewrites the URL.
- **Filters are URL state** (`?trade=&county=&area=&verified=1`). On JS, changes can apply without "Show fundis"; keep the button for no-JS and for the area field on mobile.
- **Photos:** cover photos in the build are the Fundi's own chosen public Portfolio photo (V6-6); until then, every real card uses the initials tile. For any placeholder or static mock, use the reviewed set: card 1 `sf-socket-terminal`, card 2 `sf-panel-wiring`, card 5 `sf-electrical-bench`; empty state `sf-empty-bench-lamp`. Never ship Stitch's `lh3.googleusercontent.com` links.
- **Expert tag icon:** lucide `scan-eye` matches "an eye inside four corner brackets".
- **The "Pricing" footer link** has no page or copy key yet; `builtOnly()` hides it.
