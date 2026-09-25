# v3-landing — Landing page from the Stitch v3 screen, redesigned header

- **Status:** landing page and header done in code; footer makeover waiting for the operator's answers (see Open issues). No ticket yet: the Architect should open one (proposed decision D-17).
- **Agent(s):** frontend
- **Date:** 2026-09-25
- **Branch:** `v3/landing-page`, cut from `v0/5-branded-shell` (#5 is not merged yet)
- **Commits:** `c128ca8`, `5596781` (Stitch exports and images), `09febe4` (landing page and header)

## What changed
- `design/stitch/exports/`: the v3 responsive screens (HTML and screenshots). They cover landing, trades, telemetry, contact, sign-in, join, find-a-fundi and privacy, and were pulled from Stitch project `6238825713575829455`. All 18 of their images are in `exports/images/v3/`.
- `web/app/page.tsx`: the nine landing sections: 01 proof of skill, 02 record, 03 check, 04 decide, 05 badge, 06 trades, 07 scope, 08 next, then the footer CTA. Each has an anchor.
  - The copy comes from `prompts/01-landing.md`.
  - Honesty fixes: every sample carries EXAMPLE, "LIVE INSPECT" became "EXAMPLE · STEP 03", and ticks are white. The invented readouts are gone: ZERO LATENCY, LIVENESS ACTIVE, TETHER VERIFIED, MAG 4.8X, the crypto and surveillance claims, JURY SIGN-OFF and EXPANDING QUARTERLY.
  - The "Become a verifier" and "See the roadmap" links are left out because those pages don't exist.
- `web/components/landing/step-inspector.tsx`: the Stitch step inspector as an ARIA tablist (arrow keys, Home and End). It drives the evidence frame's reticle, markers and caption, and marks the matching ledger row (`aria-current="step"`).
- `web/app/globals.css`: Stitch's `scan` keyframe and a `film-grain` utility. All motion is `motion-safe:`.
- `web/public/images/landing-socket-wiring.jpg` and `landing-coop-bench.jpg`: the landing images, served with `next/image`. Both were checked: hands and tools only, no faces, text or logos.
- The header (operator redesign) is split across four files:
  - `site-header.tsx`: the header layout.
  - `site-logo.tsx`: the new evidence-frame mark.
  - `header-account.tsx`: Sign in and Join at every width, and Clerk's `UserButton` when signed in, with Dashboard added to its menu.
  - `lib/site-nav.ts`: the section links: nav to landing anchors, COMPANY to `#company`.
- Removed: the mobile menu, the shadcn Sheet and the bottom tab bar.
- `web/test/`: copy tests for the landing page and the shell. Every `/#anchor` must exist on the landing page. A test for the inspector's keyboard handling and ledger sync. Scans for amber hovers, green ticks and googleusercontent links. `copy-helpers.ts` accepts ICU-filled strings and bare numbers.

## How to verify
1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. The last run gave web `81 passed`, Convex `23 passed`, and `/` static.
2. `pnpm dev`, then open http://localhost:3000 at 360, 768 and 1280 px in DevTools device mode. Check:
   - no horizontal scroll;
   - the nav row is visible on mobile;
   - the step tabs move the reticle and the ledger highlight;
   - reduced motion stops the scan line and the pulses;
   - signed in, the avatar menu offers Manage account, Dashboard and Sign out.
3. Screenshots from this session are in the session scratchpad. They weren't committed.

## Acceptance
| Criterion | Result | Evidence |
| --- | --- | --- |
| Landing matches the Stitch v3 screen at 1280 px | ✅ layout / ⏭ designer check | Full-page Playwright screenshot compared with `01-landing-v3-responsive.png` |
| 360 px, no horizontal scroll | ✅ | Playwright 360 px full page (a true 360 viewport; Chrome headless enforces 500 px) |
| All copy from en.json, never "certified" | ✅ | `home-page.test.tsx`, `site-shell.test.tsx` |
| No dead links | ✅ | Every href is a real route or an existing `/#section` |
| Easy sign in and sign out, profile and settings via Clerk | ✅ code / ⏭ operator | `UserButton` with a Dashboard link; not tried with a real session |

## Open issues / blockers
- **Footer makeover:** the operator's brief conflicts with D-9 and the English-only rule. Questions have been sent, and the work is waiting on the answers.
- **"LIVE" on Electrical and Hairdressing:** in V0 no verification flow exists yet, so this breaks "nothing looks live that isn't" until V1 ships. Don't deploy to production before V1. Owner: Architect.
- **Kiswahili headline:** "Kazi yako, sifa yako" is Kiswahili on an English-only site (HANDOFF §0). Kept as the brand line; the operator should confirm. Owner: operator.
- **Loupe readout:** Section 03 shows step 02, not the prompt's "step 03 · observed", because the ledger marks step 03 as needs review.
- **Footer labels:** the current footer group labels are dim, not the export's amber (95/5). This is superseded if the footer brief is approved.
- **Stitch key:** `STITCH_API_KEY` lives in the root `.env`. The first key was pasted in chat and should be revoked.
