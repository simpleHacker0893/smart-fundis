# Design: how rounds work (v2 "Instrument")

The design system is `stitch/DESIGN.md` (v2, decision D-9), and the approved reference screen is `stitch/exports/01-landing-v2.1-mobile-REFERENCE.png`. Round 1 (light and warm) is superseded. `stitch/prompts/00-header-footer.md` and `stitch/exports/01-landing-v1-mobile.png` are kept only for history.

## Stitch

- **Project:** "Smart Fundis" `6238825713575829455`.
- **Design system:** "Smart Fundis — Instrument" `assets/9016596879974394620` (dark, amber accent).

**Prompts.** Each prompt is **the SHELL block** from `stitch/prompts/00-shell-v2.md` **followed by the page's PAGE block**. Keep the tokens out of the prompts, because the design system carries them.

**Device.** Generate **MOBILE** first, and desktop once mobile is approved.

**Exports.** Save each screen as `stitch/exports/<NN>-<page>-<mobile|desktop>.{html,png}` and log it in `LOG.md`.

**Round 2 pages:**

| # | Page | Route |
| --- | --- | --- |
| 01 | Landing | `/` |
| 02 | Evidence | `/evidence` |
| 03 | Trades | `/trades` |
| 04 | Telemetry | `/telemetry` |
| 05 | About | `/about` |
| 06 | Contact | `/contact` |
| 07 | Sign in | `/sign-in` |
| 08 | Sign up | `/sign-up` |
| 09 | Signed out | `/signed-out` |
| 10 | Privacy | `/privacy` |
| 11 | Become a verifier | `/experts` |
| 12 | Roadmap | `/roadmap` |
| 13 | Find a fundi | `/fundis` |

The full page map is in `stitch/DESIGN.md` → Information architecture.

## Frontend

Convert the approved exports into `web/`, and fix the items listed under "Things in the reference to fix when coding" in `DESIGN.md`. `stitch/prompts/01-landing.md` Part A is the full build spec for the cinematic layer (GSAP and Three.js).

## Review checklist (every page)

- [ ] It matches the reference shell: the header, the tab bar (EVIDENCE · TRADES · TELEMETRY · COMPANY) and the footer.
- [ ] Amber is used only as punctuation. ✓ is white, and ◐ "needs review" is amber.
- [ ] The word "certified" never appears, and every sample badge, profile or fundi shows **EXAMPLE**.
- [ ] There are no counters, percentages, confidence scores, ratings, testimonials, logos or invented claims.
- [ ] Coming-soon items are plain readouts, never buttons and never greyed out.
- [ ] Photos appear only inside evidence frames, in grayscale, with no faces, text or logos.
- [ ] At 360 px: tap targets are at least 48 px, there is no horizontal scroll, and readable text is at least 11 px.
