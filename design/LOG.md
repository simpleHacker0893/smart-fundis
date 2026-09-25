# Design generation log

Every Stitch and Canva generation is listed here, for the project card's "prepared in advance" disclosure.

| Date | Tool | What | Prompt source | Result |
| --- | --- | --- | --- | --- |
| 2026-09-24 | Canva create-design | Pitch deck (10 slides) | brief and outline in the session | https://canva.link/xz2iw1d6jjlmb44 |
| 2026-09-24 | Canva generate-image | Hero photo: hands, 13A socket, paper code "482" | session (now `canva/prompts/hero.md`) | media `MAHWJcU2HuM` |
| 2026-09-24 | Canva generate-image | 4 concept phone mockups (dashboard, upload, Expert review, profile) | session | media `MAHWJX6lUso`, `MAHWJaseIsE`, `MAHWJfJelSw`, `MAHWJUfUSAQ` |
| 2026-09-25 | Canva edit-design | Deck fixes, and slide 11 "Concept screens" added | session | same deck |
| 2026-09-25 | Stitch MCP | Project "Smart Fundis" `6238825713575829455`, design system `assets/4454712536998164226` | `stitch/DESIGN.md` | https://stitch.withgoogle.com (project) |
| 2026-09-25 | Stitch upload | hero + coop-teaser WebP uploaded as image screens `2138919207363093868`, `1198147874283019442` | Canva exports | Stitch-hosted image URLs |
| 2026-09-25 | Stitch generate (Gemini 3.8 Flash, MOBILE) | 00 Header & Footer Reference | `stitch/prompts/00-header-footer.md` | screen `be437f60fe0e462cb599ae8ddd567fec` → `stitch/exports/00-header-footer-mobile.{png,html}` |
| | Stitch | 01 landing (round 1) | `stitch/prompts/01-landing.md` | |
| 2026-09-25 | Canva generate-image | hero, 4:3 (paper code "482") | `canva/prompts/hero.md` | media `MAHWLBoJf7Y` → `design/canva/exports/web/hero-*.webp` |
| 2026-09-25 | Canva generate-image | coop-teaser, 16:9 | `canva/prompts/coop-teaser.md` | media `MAHWLM-teLg` → `design/canva/exports/web/coop-teaser-*.webp` |
| 2026-09-25 | Canva generate-image | paper-code-tip, 4:5 (code "315") | `canva/prompts/paper-code-tip.md` | media `MAHWLAC_qzI` → `design/canva/exports/web/paper-code-tip-*.webp` |
| 2026-09-25 | Canva generate-image | fundis-empty, 1:1 illustration | `canva/prompts/fundis-empty.md` | media `MAHWLEoeYII` → `design/canva/exports/web/fundis-empty-*.webp` |
| 2026-09-25 | Canva create-design + export | Export board holding the 4 images at full size (pages 2–5) | this pipeline | https://canva.link/b2200kqjk59wq0m → `design/canva/exports/master/*.png` |
| 2026-09-25 | Stitch design system | "Smart Fundis — Instrument" (dark, v2) `assets/9016596879974394620` | `stitch/DESIGN.md` v2 | project `6238825713575829455` |
| 2026-09-25 | Stitch generate (Gemini 3.8 Flash, DESKTOP + MOBILE) | 01 landing, round 2 (Instrument) | `stitch/prompts/01-landing.md` Part B | desktop `658b28d1d26b4083a7c49db1391121e0`, mobile `a6746f63323f4f63afe2f927d0103a9a` → `stitch/exports/01-landing-v2-{desktop,mobile}.{png,html}`. Round-1 light mobile `d406090f484242bea0d81cb6be1b8378` kept as `01-landing-v1-mobile.png` |
| 2026-09-25 | (user, Stitch UI) | Approved reference: "Evidence Frame Step Inspector (Mobile)" | refined by hand in Stitch | screen `3a2e568a398e4464a1a60a90a55b2037` → `stitch/exports/01-landing-v2.1-mobile-REFERENCE.{html,png}` |
| 2026-09-25 | Stitch generate (MOBILE prompt, 11 pages) | 02–12: evidence, trades, telemetry, about, contact, sign-in, sign-up, signed-out, privacy, become-verifier, roadmap | `stitch/prompts/00-shell-v2.md` + `02`–`12` | `stitch/exports/<NN>-<page>-mobile.{html,png}`. They rendered as phone columns on a desktop canvas, so they were superseded by the responsive edits |
| 2026-09-25 | Stitch generate | 13 find-a-fundi (mobile column) | `stitch/prompts/13-find-a-fundi.md` | screen `ecafe632283b4507a9e0ee7265b27417` → `13-find-a-fundi-mobile.{html,png}` |
| 2026-09-25 | Stitch edit → responsive (DESKTOP) | 02 evidence, 03 trades, 04 telemetry, 05 about | responsive rules in `DESIGN.md` | screens `3da7dc39d49447c6a38b26470888a1ff`, `6ff05384b50b4930a031959bf61e8d91`, `a6e30c442f044162b07e11f6238f9764`, `f5c0cf06970343b2bce553d73e1c9a69` → `<NN>-<page>-responsive.{html,png}` |
| 2026-09-25 | Stitch edit → responsive | 01 landing, 06 contact, 07–09 auth, 10 privacy, 11 verifier, 12 roadmap, 13 find-a-fundi | same | **pending**. Stitch timed out and returned no screens (it looks throttled), so retry later |
| 2026-09-25 | (designer, no generation) | HANDOFF.md written for frontend: source-of-truth order, tokens, screen inventory, images, conflicts C-1 to C-10 | `stitch/DESIGN.md`, `stitch/prompts/*`, `stitch/exports/*`, spec §7–§9 | `design/HANDOFF.md` |
