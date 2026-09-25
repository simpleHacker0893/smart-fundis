# Design handoff for frontend

Read this page before you build any screen. It covers where every design lives, which file wins in a disagreement, and what is still missing. Owner: designer. Last updated 2026-09-25.

## 1. Source of truth

When two sources disagree, the higher one wins.

| Rank | Source | Use it for |
| --- | --- | --- |
| 1 | `design/stitch/DESIGN.md` (v2 "Instrument", decision D-9) | tokens, type, a11y, honesty rules, IA, responsive rules |
| 2 | `stitch/exports/01-landing-v2.1-mobile-REFERENCE.{html,png}` | look, density and components. DESIGN.md L9 says that on layout and density this screen wins over the text, **except** for the "fix when coding" list (DESIGN.md L16–21 and §6 below) |
| 3 | `stitch/exports/<NN>-*-responsive.{html,png}` | the 768 px and 1280 px layouts |
| 4 | `stitch/exports/<NN>-*-mobile.{html,png}` | the 360 px layout of pages that don't have a responsive export yet |
| — | `stitch/prompts/<NN>-*.md` | **exact copy.** When an export's text differs from its prompt, the prompt wins |

**Superseded parts of the spec:** architecture spec §8 still lists green `#0B5D3B`, orange `#F28C28` and Plus Jakarta Sans. **D-9 replaces all three.** Keep them out of `web/`: none of those colours or that font may appear anywhere.

**Superseded (history only, do not build from):** `00-header-footer-mobile.{html,png}` and `prompts/00-header-footer.md` (round 1, light theme), `01-landing-v1-mobile.png`, and `01-landing-v2-mobile.html`, which the REFERENCE replaces.

## 2. Tokens

Keep everything in one theme source, for example the Tailwind v4 `@theme` in `web/app/globals.css`. The values below are copied from DESIGN.md.

### Colour

| Token | Value | Role | DESIGN.md |
| --- | --- | --- | --- |
| `--bg` | `#050609` Graphite | page background | L72 |
| `--panel` | `#0B0D12` | raised panels and cards | L73 |
| `--line` | `rgba(242,244,247,.10)` | 1 px hairlines and borders | L73 |
| `--text` | `#f2f4f7` | headings and body | L74 |
| `--dim` | `rgba(242,244,247,.55)` | secondary text (AA, about 5.6:1) | L75 |
| `--faint` | `rgba(242,244,247,.34)` | **decorative only** (ticks, grid numbers, rules). Never for readable text (about 2.7:1, fails AA) | L76 |
| `--amber` | `#ef9a57` | **the only accent.** Use it for the scan line, active step marker, verdict tick, primary button fill, and at most one key word per section. Primary button text is graphite `#050609` (about 9:1). Amber text only for short labels | L77 |
| pass | white + ✓ glyph | status | L78 |
| review | amber + ◐ glyph | status. Never show a status by colour alone | L78 |

Keep amber to once or twice per viewport (Principle 2, L121).

### Type

| Role | Stack / font | Size / weight / tracking | DESIGN.md |
| --- | --- | --- | --- |
| Display | `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Inter, sans-serif`. Load **Inter** with `next/font` (Android lands on it) | weight 500–600, letter-spacing −0.03em, line-height 0.95–1.05 | L80 |
| Hero | display | 44 px mobile, 104 px desktop | L81 |
| Section title | display | 32 px mobile, 64 px desktop | L81 |
| Body | display family | 16–18 px, line-height 1.55, `--dim` or `--text` | L82 |
| Mono (readouts) | `ui-monospace, SFMono-Regular, Menlo, monospace`. Load **JetBrains Mono** with `next/font` | UPPERCASE, letter-spacing 0.26em, **12 px minimum**. 11 px is the absolute floor and only for non-essential readouts (L18) | L83, L18 |
| Numbers | — | `font-variant-numeric: tabular-nums` everywhere | L84 |

Use two families only. The reference loads Public Sans for its tab labels (L13), but the shell prompt calls for mono tab labels, so use JetBrains Mono there.

### Shape, spacing, surface

| Item | Rule | DESIGN.md |
| --- | --- | --- |
| Radius | panels 4 px or 0; buttons fully rounded (pill) | L85 |
| Buttons | at least 48 px tall and full-width at 360 px. Primary: amber fill with graphite label. Secondary: transparent with a 1 px `--line` border that brightens on hover. Both lift −2 px on hover | L85, L87–90 |
| Shadows | none. Use light instead: glows, edge highlights and grain | L85 |
| Gutters and header | 16 px gutters and a 48 px sticky header on mobile; 72 px header on desktop; max-width 1280 px with 32–48 px padding on a 12-column grid; about 120 px between desktop sections | L13, L47–49, L59 |
| Icons | 24 px line icons, 1.5 px stroke, `--text`. Amber only for the active or verified state. Every icon has a text label. Use one set (lucide-react) instead of the exports' Material, Phosphor and Lucide mix | L91 |
| Logo | the SVG at L93–98 (evidence frame with an amber check). Wordmark "Smart Fundis" at weight 600 with the mono tag "VERIFIED SKILLS" in `--dim`. The exports use a Material "verified" glyph instead; replace it | L92–99 |
| Focus | 2 px amber ring with 2 px offset | L108 |
| Grain | a fixed full-screen canvas `#grain`, `opacity: .045`, `mix-blend-mode: overlay`, `pointer-events: none` | L86 |

### Motion

| Rule | DESIGN.md |
| --- | --- |
| GSAP + ScrollTrigger reveals: masked line splits, `yPercent: 118`, `power3.out`, stagger 0.085 | L102 |
| Parallax scrub 0.55. Pinned sections are allowed; no scroll-jacking and no sound | L103 |
| `prefers-reduced-motion` shows the final state of every animation with no movement | L104 |
| The cinematic layer (GSAP, Three.js, WebGL) is lazy-loaded after first paint. Text and buttons render first, and low-power devices get static final frames | L124 |
| Each WebGL canvas gets `aria-hidden` and a text equivalent next to it; `pointer-events: none` on every overlay | L109–110 |

The full motion build spec is `prompts/01-landing.md` Part A. It uses CDN links for the prototype; in `web/`, use the npm packages.

### What V0 needs and what waits for V3

| V0, ticket #5 (branded shell) | Waits for V3 |
| --- | --- |
| colour tokens, radius, focus ring | grain canvas |
| Inter and JetBrains Mono through `next/font`, tabular nums | GSAP reveals, parallax, scramble |
| **static** header (mobile + desktop) and footer, SVG logo | Three.js/WebGL: evidence plate, Liquid Metal button, seal, wordmark hover |
| mobile bottom tab bar and menu sheet (no motion) | `#boot` sequence (see conflict C-8) |

## 3. Screen inventory

**Status key:** **final** = responsive export exists. **mobile-only** = a 360 px export only; build the wider layouts from the responsive rules in DESIGN.md L41–61. **responsive pending** = the Stitch retry timed out (LOG.md). "Not in spec" = the route isn't in spec §8 or §9; the Architect must assign a slice.

### Pages with an export

| # | Route | Prompt | Build from (in `design/stitch/exports/`) | Status | Slice / ticket |
| --- | --- | --- | --- | --- | --- |
| 00 | shell (every page) | `00-shell-v2.md` | mobile: `01-landing-v2.1-mobile-REFERENCE.html` (header L127, footer from L629, tab bar L690). Desktop 72 px header + 4-column footer: `02-evidence-responsive.html` (header L66, footer L634, mobile tabs L711) | mobile final; desktop taken from 02 | **V0 #5** static; V3 motion |
| 01 | `/` | `01-landing.md` (Part A build spec, Part B Stitch) | `01-landing-v2.1-mobile-REFERENCE.html`; desktop layout guide only: `01-landing-v2-desktop.html` | responsive pending | V3 |
| 02 | `/evidence` (+ `#chain`, `#scope`) | `02-evidence.md` | `02-evidence-responsive.html`, `02-evidence-mobile.html` | final | not in spec (propose V3) |
| 03 | `/trades` | `03-trades.md` | `03-trades-responsive.html`, `03-trades-mobile.html` | final | not in spec (propose V3) |
| 04 | `/telemetry` | `04-telemetry.md` | `04-telemetry-responsive.html`, `04-telemetry-mobile.html` | final | not in spec (propose V3) |
| 05 | `/about` | `05-about.md` | `05-about-responsive.html`, `05-about-mobile.html` | final | not in spec (propose V3) |
| 06 | `/contact` | `06-contact.md` | `06-contact-mobile.html` | mobile-only, responsive pending | not in spec. No backend (C-5) |
| 07 | `/sign-in` | `07-sign-in.md` | `07-sign-in-mobile.html` | mobile-only, responsive pending | V0 #3 functional (Clerk); V3 restyle |
| 08 | `/sign-up` | `08-sign-up.md` | `08-sign-up-mobile.html` (account step only) | mobile-only, responsive pending | V0 #3 functional; V3 onboarding |
| 09 | `/signed-out` | `09-signed-out.md` | `09-signed-out-mobile.html` | mobile-only, responsive pending | not in spec (propose V3) |
| 10 | `/privacy` | `10-privacy.md` | `10-privacy-mobile.html` | mobile-only, responsive pending | not in spec (propose V3). See C-6 |
| 11 | `/experts` | `11-become-verifier.md` | `11-become-verifier-mobile.html` | mobile-only, responsive pending | V4 (Expert application). See C-5 |
| 12 | `/roadmap` | `12-roadmap.md` | `12-roadmap-mobile.html` | mobile-only, responsive pending | V3. See C-3 |
| 13 | `/fundis` | `13-find-a-fundi.md` | `13-find-a-fundi-mobile.html` | mobile-only, responsive pending | V3. See C-7 |

### Spec screens with no export (each needs a Stitch prompt)

The rule for all of these: **no photos** on dashboards, forms, the upload flow or Expert review.

| Spec §8 screen | Route | Slice | What it must show | Partial reference |
| --- | --- | --- | --- | --- |
| Sign-up role pick + Fundi profile (onboarding) | onboarding, route TBD (`?as=`, `&trade=`) | V1 minimal, V3 full | two role checkboxes, trade pre-ticked, full profile (US-2.3), Showcase links | step readout in 08 |
| Fundi dashboard | `/fundi` | V1 unstyled, V3 styled | Assessment list with status chips, guard reshoot reasons, Co-op card with "Tell me when it launches", "Show my profile in Find a fundi" toggle | — |
| Upload flow | `/fundi` (Task pick → Rubric → Liveness code → consent → record/pick → progress) | V1 unstyled, V3 restyle | **consent in English and Kiswahili**; upload disabled until ticked | `paper-code-tip` image, 02 "chain of evidence" |
| Assessment result | `/fundi/...` detail | V1, V4 | `queued → analyzing → awaiting_review`, verdicts ✓ / ◐ / ↻, `failed` with "Record again" (V4), appeal (V4) | landing §04 ledger |
| Expert queue | `/expert` | V1 | queue list | — |
| Expert review | `/expert/...` | V1, V2 | video, Observations with timestamps (tap jumps the video), `livenessRead` next to the expected code, approve / reshoot / reject with a note | landing §04 ledger |
| Public Fundi profile | `/f/[id]` | V1 | spec §7 fields, Badges, Showcase "Showcase — not verified", Demo tag | 02-evidence §03 sample profile panel |
| Application pending | `/application-pending` | V4 | status screen | 09 signed-out layout |
| Signed-in placeholder | `/dashboard` | V0 #4 | "Signed in as <email>" only; plain shell | — |
| Admin screens | — | V4 | **plain shadcn by spec; no design needed** | — |

## 4. Images

Source files are in `design/canva/exports/web/`, with masters in `design/canva/exports/master/`. Copy them to `web/public/images/` when a slice first uses them. That folder doesn't exist yet.

| Slot | WebP files (size) | Ratio | Used in | Load |
| --- | --- | --- | --- | --- |
| `hero` | `hero-360.webp` (7.5 KB), `hero-720.webp` (20 KB), `hero-1080.webp` (38 KB) | 4:3 | landing hero evidence plate (paper code "482") | `priority` (LCP) with `sizes`/`srcSet` |
| `paper-code-tip` | `paper-code-tip-360.webp` (13 KB), `paper-code-tip-720.webp` (33 KB) | 4:5 | landing §02 RECORD (code "315"); onboarding / upload tip | lazy |
| `coop-teaser` | `coop-teaser-360.webp` (13 KB), `coop-teaser-720.webp` (40 KB), `coop-teaser-1280.webp` (65 KB) | 16:9 | landing §08 NEXT (30% opacity under a scan-line mask); `/roadmap` hero frame | lazy |
| `fundis-empty` | `fundis-empty-160.webp` (2.5 KB), `fundis-empty-320.webp` (5.7 KB) | 1:1 | **do not use yet.** It is a light-theme illustration (green shield on white) that clashes with v2. Until it is redrawn, build the `/fundis` empty state as the export's "NO SIGNAL YET" evidence frame with no photo | — |

**Rules**
- Every WebP is under 100 KB. Only the hero loads with priority.
- Show hands, tools and work only, with **no identifiable faces**, no text (except the 3-digit paper code) and no logos.
- The Canva files still carry v1 green and orange tones. Desaturate them to about 20% colour in CSS or the shader (DESIGN.md L100).
- Photos go **only inside evidence frames**, and only in these places: hero, How it works, empty states, onboarding and roadmap. **Never** on dashboards, forms, the upload flow or Expert review.
- **Never ship the exports' `lh3.googleusercontent.com` images.** They are temporary Stitch-hosted photos that nobody has reviewed. Any other evidence frame gets a procedural frame (hairlines, reticle, scan line, no photo) until the designer supplies an asset. See C-2.

## 5. Honesty and copy rules

| Rule | Source |
| --- | --- |
| Always "Verified by Smart Fundis", never "certified". The only allowed form is "NITA, KNQA and TVETs certify." | AGENTS.md, DESIGN.md L112 |
| Nothing looks live that isn't. Coming-soon items are plain readouts at full opacity with dim text: no buttons, no links, no `opacity-60` | DESIGN.md L114, L123, L18 |
| Post-MVP features appear only on `/roadmap`, tagged "Coming soon". The landing §08 teaser links there | AGENTS.md, spec §7 |
| No counters, statistics, percentages, confidence scores, ratings, testimonials or partner logos | DESIGN.md L113 |
| Static sample Badges, profiles and fundis carry **"EXAMPLE"**. Seeded Convex data carries **"Demo: not a real verification"** (spec §7). Never mix the two | DESIGN.md L115, spec §7 |
| "AI recommends, Experts decide." No badge is ever issued by AI alone | DESIGN.md L116, ADR-11 |
| No earnings figures anywhere | spec §7 |
| All copy goes through `next-intl` `messages/en.json`. No `sw.json`, and the language toggle stays hidden | AGENTS.md rule 5 |
| **Consent is the only English + Kiswahili screen.** Its text is the versioned V1 consent copy | AGENTS.md, spec §7 |
| Use copy from the prompt files, not from the exports (see §6) | this page |

## 6. Conversion notes

- **Stitch HTML is a reference, not code to paste.** Rebuild each page with Next.js App Router, Tailwind and shadcn using the §2 tokens. The exports use Tailwind CDN, ad-hoc names (`amber-brand`, `accent`, `graphite-950`, `surface-container-*`) and stray greys (`#9ca3af`, `#8e95a5`, `#1f242e`). Map every one of them to `--panel`, `--line`, `--dim` or `--faint`.
- **Mobile-first at 360 px.** No horizontal scroll. The layout changes at 768 px and 1024 px (DESIGN.md L45–61). The bottom tab bar appears below 1024 px only, and never on auth pages.
- **Tap targets are 48 px** (DESIGN.md L107; stricter than the general 44 px). The exports' header "JOIN" pill (32 px) and menu button (32–40 px) are too small. Keep the pills visually compact, but extend the hit area to 48 px.
- **Nav and footer:** use the IA in DESIGN.md L25–39 and the footer link list in `00-shell-v2.md`. When V0 lands, links to pages that don't exist yet are either left out or point at a "Coming soon" anchor (#5).
- **Fix these when you convert** (they are in the exports and break the rules):

| Found in | Problem | Fix |
| --- | --- | --- |
| REFERENCE (13×) | ✓ drawn green `#10b981` | white ✓; amber only for ◐ |
| all exports | mono text at 6.5–10 px | 12 px readable, 11 px floor |
| REFERENCE, v2-mobile | coming-soon tiles at `opacity-60` | full opacity, dim text |
| REFERENCE, v2-mobile, 05-mobile | "PHYSICAL TETHER CODE", "SYNC: 254-NBO", "SYSTEM ID: SF-254", "LAYER 04: JURY SIGN-OFF", "LIVENESS ACTIVE" | use the prompt copy |
| v2-desktop | "CONFIDENCE: 98.4%", "NAIROBI SYNC", "encrypted and offline", "Secure wrapping, load balance." | remove |
| 02-mobile, 02-resp, 04-resp, 05-mobile, 11 | "100% AUDITABLE", "100% Passed Steps", "100% Human Panel", "100% HUMAN FINAL JURY" | remove (these are statistics) |
| 04-mobile, 10 | "Encrypted direct ingress", "ENCRYPTED" | remove; the spec makes no encryption claim |
| 02-resp, 03-resp, 09, 13 | "ACTIVE", "SYSTEM ACTIVE", "ACTIVE READY", "BENCH SECURE // LOGGED" status chips | remove, or use the prompt's tag |
| 02-resp footer | extra links "Supported skills list", "How to inspect a badge", "Reviewer guidelines", "Trade benchmarks" (these pages don't exist) | use the `00-shell-v2.md` list only |
| REFERENCE header / tabs | "VERIFY" button; tabs LEDGER · EVIDENCE · SEALS · RADAR | "JOIN"; EVIDENCE · TRADES · TELEMETRY · COMPANY |
| 02-resp header | amber hairline under the header | `--line` |
| 09, 10, 13 | load Plus Jakarta Sans | remove |
| 03-resp | rubric preview is missing its "EXAMPLE" tag | add it (the mobile export has it) |

- **Opening the exports locally.** They need internet access, because they load Tailwind, fonts and images from CDNs. From the repo root, run `start "" design\stitch\exports\02-evidence-responsive.html` (Windows) or `npx serve design/stitch/exports`, then use DevTools device mode at 360, 768 and 1280 px. The `.png` next to each `.html` is the offline screenshot. For the REFERENCE, trust the PNG when the two disagree.

## 7. Conflicts that need an Architect call

| # | Conflict | Designer's recommendation |
| --- | --- | --- |
| C-1 | Ticket **#5** says to build the header and footer "from the `00-header-footer-mobile` Stitch export". That export is **round 1** (light theme, Plus Jakarta Sans, green), which breaks #5's own acceptance criteria | build #5 from `00-shell-v2.md` + REFERENCE (mobile) + `02-evidence-responsive.html` (desktop). Correct the ticket text |
| C-2 | Spec §8 says "photos only in the hero". DESIGN.md L100 allows documentary photos inside evidence frames on every page, and exports 02–13 contain Stitch-generated photos (including on forms: 06, 07, 08, 11) | ship only the Canva WebPs, in the places listed in §4. Other frames stay procedural. No photos on forms |
| C-3 | `/roadmap` content: spec §8 lists Co-op, Bookings & M-Pesa, Fundi Pro, Training partners, **Client accounts**, Trades, **Rubric editor**. Prompt 12 has **Kiswahili app** and no Client accounts or Rubric editor | follow the spec list and add "Kiswahili app" only if the Architect agrees. The designer will update prompt 12 |
| C-4 | Header nav: spec §8 has "How it works, Trades, Find a fundi, More"; `01-landing.md` Part A has "How it works · Trades · What we check · Roadmap"; DESIGN.md IA has EVIDENCE · TRADES · TELEMETRY · COMPANY | the DESIGN.md IA (D-9, and the REFERENCE shows it) |
| C-5 | The `/contact` and `/experts` forms have no backend in any slice ("Send message" would look live). The spec's V4 Expert application is a signed-in flow, while prompt 11 describes "register interest" by invitation | `/contact`: a `mailto:` link to the single contact email. `/experts`: a CTA into the V4 application once it exists; until then, a plain readout |
| C-6 | Copy that promises V4 features which may be cut: "DELETE" (04, 10), "APPEALS" (04, 11), the visibility toggle (10). `/privacy` also shows a Kiswahili consent excerpt, while consent is meant to be the only Kiswahili screen | show delete and appeal copy only if V4 ships them; otherwise remove it or tag it "Coming soon". On `/privacy`, reuse the exact consent strings or drop the Kiswahili card |
| C-7 | `/fundis` export shows a static "EXAMPLE" card; V5 seeds Demo profiles | the EXAMPLE card is design filler. Build the real list from Convex with the "Demo: not a real verification" tag, plus the empty-state frame |
| C-8 | Part A `#boot` "CALIBRATING · 000%" overlay (up to 1.2 s) goes against Principle 5 ("text and buttons render first") and the Lighthouse ≥ 90 target | leave it out, or make it non-blocking and skip it under reduced motion |
| C-9 | Pages 02–06 and 09–10 (`/evidence`, `/trades`, `/telemetry`, `/about`, `/contact`, `/signed-out`, `/privacy`) have no slice in spec §9 | assign them to V3 or cut them. The footer then drops those links |
| C-10 | Mobile header: DESIGN.md says 48 px, Part A says 64 px, and 02-responsive uses 56 px | 48 px (DESIGN.md L47) |

## 8. Pending design work (owner: designer)

| Item | Blocks | Notes |
| --- | --- | --- |
| Responsive retry: 01 landing, 06 contact, 07 sign-in, 08 sign-up, 09 signed-out, 10 privacy, 11 experts, 12 roadmap, 13 fundis | V3 desktop polish | Stitch timed out (LOG.md). Until then, build desktop from the DESIGN.md responsive rules |
| New prompts + exports: onboarding, Fundi dashboard, upload flow + consent (en/sw), Assessment result (incl. `failed`, appeal), Expert queue, Expert review, `/f/[id]`, `/application-pending` | V3 restyle of V1 screens | no photos on any of them |
| Redraw `fundis-empty` in v2 (dark, amber) or retire it | `/fundis` empty state | procedural frame in the meantime |
| Update prompt 12 to match the spec roadmap list (C-3) | V3 `/roadmap` | after the Architect's call |
| Supply reviewed Canva assets for other evidence frames, if C-2 allows them | V3 | otherwise procedural |
