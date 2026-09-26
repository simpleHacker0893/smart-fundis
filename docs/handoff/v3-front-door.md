# V3 front door — tickets #20–#30 (spec #19)

- **Status:** done in code. The visual check at 360, 768 and 1280 px, a real Clerk sign-in, and a real `/contact` send are the operator's.
- **Agent(s):** frontend (pages, shell, fixes), convex (#29), designer (Stitch prompt 18, reviews), rai-reviewer, code-reviewer, convex-reviewer; main session (Stitch generation via the API key, merges, verification).
- **Date:** 2026-09-26
- **Branch / PR:** `v3/landing-page` → PR #34. This file supersedes `docs/handoff/v3-landing.md`.

## What changed
| Ticket | Route or area | Notes |
| --- | --- | --- |
| #20 | `/` landing and header | Built from the Stitch v3 screen. Trade tiles say "Verify now" and link to `/join?role=fundi&trade=<slug>`; the others say "Coming soon". "Kazi yako, sifa yako" appears only in the hero, with `lang="sw"`. |
| #21 | `/evidence` | Chain of evidence, what a badge says, and a sample profile tagged EXAMPLE. |
| #22 | `/trades` | Open trades vs bench trades, with the rubric tagged EXAMPLE. The V6 v4 redesign for clients comes later. |
| #23 | `/telemetry` | No invented numbers. The guard, the GPU and NVIDIA API split, and the AI outcomes are stated truthfully. |
| #24 | `/about`, `/contact` | The header COMPANY disclosure menu: About, Contact us, Pricing. |
| #25 | `/privacy` | The Stitch layout, with copy true to PRD §7–§8. The Co-op is only a "contact me" toggle, tagged Coming soon. |
| #26 | `/responsible-ai` | From the generated Stitch screen `e1d41576…`. The eval cells read "—", and delete and appeal are Coming soon. |
| #28 | `/sign-in`, `/sign-up`, `/signed-out` | Stitch chrome around Clerk's own widgets, with hex `appearance` tokens and 48 px fields. |
| #27 | footer, `/join` | A 4-column footer with `aria-current`, "Find fundis" linking to `/trades`, and a footer mailto to info@smartfundis.com. `/join?role=` redirects to `/sign-up`. |
| #30 | `/pricing` | "Free today" (KSh 0). Fundi Pro KSh 300/month and a 2.5% + 2.5% commission, each tagged "Planned · may change", with no buy buttons. |
| #29 | `/contact` form | Convex `contactMessages` and `contact.send`, with no auth. Per-contact throttle of 3 in 10 minutes, a global token bucket of 30 an hour, NFKC and zero-width stripping, a `contactKey` fold, one generic refusal and a honeypot. There is no public read path. The page falls back to mailto without Convex. |

Shared components: `PageHero`, `Tag` (Coming soon, Example), `Reticles`, `HeroCtas` and `lib/trades.ts` (one source for trades), plus `(site)` and `(auth)` route-group layouts. Every image in `web/public/images` is WebP under 100 KB and was checked for faces, text and logos. `sf-braiding-hands` was re-cropped.

## How to verify
1. `pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build` gives Convex 74 and web 243 passing.
2. `pnpm dev`, then walk every route at 360, 768 and 1280 px, comparing each against its Stitch export in `design/stitch/exports/`.
3. Sign in with Google and with an email code, then sign out and check you land on `/signed-out`.
4. Send a message from `/contact` and see it under Convex dashboard → `contactMessages` on `modest-warbler-906`. The dev row "Agent smoke test" can be deleted.

## Acceptance evidence
- Reviews:
  - RAI: 1 blocker and 3 majors, all fixed.
  - Standards: 0 blockers, and every minor is fixed.
  - Design: all findings fixed.
  - convex-reviewer on #29: 1 major (the global cap) and 6 minors, all fixed.
- Honesty is tested: there's a real-routes allow-list, "certified" is banned, and so is any "N%" figure other than the planned 2.5%. The eval cells are `—`, no Kiswahili consent text is printed, and there is no fake form.

## Decisions and risks
- D-17 is proposed (the header and footer redesign) and needs the Architect's confirmation.
- "Kazi yako, sifa yako" appears on the landing hero only.
- R-19: contact messages have no retention policy yet.

## Open for the operator
- The visual pass, a real sign-in, and a real `/contact` send.
- A native-speaker review of `web/messages/drafts/sw.footer.draft.json`, which isn't wired in yet.
- Showing the planned prices on `/pricing`: keep or drop.
