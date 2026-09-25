# 18 — Responsible AI

- **Route:** `/responsible-ai` (public, no sign-in). Ticket #26, slice V3 (parent #19). Footer link: COMPANY → "Responsible AI".
- **Device:** DESKTOP, so both layouts render (responsive web app, never a phone column on a desktop canvas).
- **Active nav item:** TELEMETRY (this page is the long-form companion to `/telemetry`).
- Prepend the **SHELL** block from `00-shell-v2.md`, with the **header override** below.
- **English only.** No Kiswahili text on this page and no language switcher. The page may *say* consent is shown in English and Kiswahili, but it does not print the Kiswahili consent.
- **Sources for every claim:** AGENTS.md non-negotiables, PRD §8, spec §2, §3, §6, §7, §9, §10, ADR-11, ADR-13 (D-14), ADR-14, ADR-19, `CONTEXT.md`. Do not add a claim that is not in those files.

---

## Signature idea and fidelity constraints

The page is an **inspection of our own AI**. Every section is an instrument readout of one real rule in the pipeline: a mono label, a plain value, nothing decorative. The one hero frame shows an EXAMPLE assessment being capped at ◐ Needs review, because that single moment explains the whole page: *the AI recommends, plain code caps doubt, a human decides.*

**Negative constraints (Stitch must obey):**
- **No numbers that measure us.** No percentages, accuracy scores, confidence scores, counters, "videos verified", uptime, latency figures, ratings, testimonials or partner logos. The only digits allowed are timestamps in the EXAMPLE frame, "10–90 seconds", "360p", "3-digit", "2B"/"8B" in model names and section numbers.
- **Never "certified"**, "certificate" or "accredited". Always "Verified by Smart Fundis".
- **Nothing looks live.** No "LIVE", "ONLINE", "SYSTEM ACTIVE", "MONITORING" chips, no blinking status lights on the page body. The frame header says "EXAMPLE".
- **Amber is punctuation only:** the scan line, the active step marker, the ◐ Needs review glyph and its label, the primary pill fill, section-label pulse dots, and at most one key word per section. Everything else is graphite and white. ✓ ticks are **white**.
- **Mono text is 12 px or larger** everywhere. Tap targets are at least 48 px. No horizontal scroll at 360 px.
- **No invented jargon** ("NEURAL AUDIT", "TRUST SCORE", "SYSTEM ID", "SYNC", "LAYER 04"). Use only the copy below.

---

## SHELL — header override (operator decision, HANDOFF §0, 2026-09-25)

Use the SHELL from `00-shell-v2.md` for tokens, components, the footer and the honesty rules, **but draw the header as the v3 header** (the one on `exports/01-landing-v3-responsive`):
- **Mobile (< 768 px):** two rows. Row 1 (48 px): the evidence-frame logo (corner reticles with an amber check) and the "SMART FUNDIS / VERIFIED SKILLS" lockup on the left, then "Sign in" (text) and a compact amber pill "JOIN" on the right. Row 2 (44 px, always visible): the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY, with TELEMETRY active. **No menu sheet and no bottom tab bar.**
- **Desktop (≥ 1024 px):** one 72 px row: logo lockup, the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY ▾ (About, Contact us), then "Sign in" and the amber pill "Join as a fundi".
- **Footer:** exactly the `00-shell-v2.md` footer ("Show your work.", the four link groups, the faint "SMART FUNDIS" wordmark, "We verify skills. NITA, KNQA and TVETs certify." and "© 2026 Smart Fundis").

---

## Image slot (one only)

`[image-slot: rai-hero, 4:3, a grayscale documentary photo of an electrician's hands at an open wall socket box, one hand holding up a small blank sheet of paper toward the camera, a screwdriver on the box edge]`

- Stitch: draw it as a generated grayscale documentary photo inside the hero evidence frame, per the SHELL imagery rules (operator decision: keep Stitch images, HANDOFF §0). **No faces, no readable text or digits on the paper, no logos, no brand hardware.**
- Frontend: localise it into `web/public/images/` as WebP under 100 KB after the faces/text/logos check (HANDOFF §4). The frame carries the tag "EXAMPLE", so it cannot be read as a real assessment.
- **No other photos on this page.** Every other section is ledgers, readouts and line diagrams.

---

## PAGE

Section spacing: about 120 px on desktop, 64 px on mobile. Each section opens with a mono label ("0N — TITLE") with a small pulsing accent dot, then a display title, then the body. Suggested `en.json` namespace: `ResponsibleAi`, one sub-key per section (given in brackets).

### 1. Hero `[ResponsibleAi.hero]`

- **Mobile:** single column. Mono label "SMART FUNDIS / RESPONSIBLE AI"; headline "AI recommends. Experts decide."; dim sub-line: "How our AI checks a video, what it is never allowed to decide, and how we test it."
- Below it, the **evidence frame** (4:3): meta row "EVIDENCE FRAME: EF-3104" on the left and "EXAMPLE · ELECTRICAL" on the right; the `rai-hero` photo; a thin amber scan line; corner-bracket reticles; three diamond ◆ step markers with mono timestamps:
  - "01 CODE ON CAMERA · 00:02"
  - "02 ISOLATE SUPPLY · SAFETY · 00:09" (this marker is the active one, amber)
  - "03 TERMINATE · 00:41"
- Directly under the frame, a 3-row **readout ledger** tagged "EXAMPLE":
  - "SAFETY STEP · Unclear"
  - "AI VERDICT · ◐ Needs review — a recommendation" (the ◐ and "Needs review" in amber)
  - "DECISION · Waiting for an Expert"
- **Desktop:** 2 columns, text in 5 columns (label, headline at display size, sub-line, and two pills: amber "How a verdict is made" anchoring to section 01, outlined "Your privacy" to `/privacy`), frame and ledger in 7 columns.
- On mobile the two pills sit under the sub-line, full width, stacked.

### 2. "01 — HOW A VERDICT IS MADE" `[ResponsibleAi.pipeline]`

- Title: "From video to Badge. One human decision."
- A **signal-flow pipeline** of six instrument blocks joined by a 1 px hairline with small arrowheads. **Mobile:** vertical. **Desktop:** horizontal, six equal columns, wrapping to 3 + 3 at 768–1023 px. Each block: a mono tag, a bold one-line title, one or two dim lines.
  1. "GUARD" — "Is the video usable?" — "10–90 seconds, at least 360p, bright enough. If not, you get a clear reason and record again."
  2. "OBSERVE · NVIDIA COSMOS REASON 2" — "Watches every step." — "Runs on Smart Fundis' GPU. For each Rubric step it answers yes, no or unclear, with a line of evidence and the moment it happens. It also reads your paper code without being told what it should be."
  3. "ASSESS · NVIDIA NEMOTRON" — "Drafts a Verdict." — "Reads the observations as text, never your video, and drafts pass, needs review or fail, with plain-language feedback for you."
  4. "RULES · PLAIN CODE" — "Caps any doubt." — "Checks the paper code and every safety step. It can lower a Verdict. It can never raise one."
  5. "EXPERT" — "A person decides." — "A skilled Expert in your trade watches the video with the AI's notes and approves, asks for a reshoot, or rejects."
  6. "BADGE" — "Only after approval." — "Verified by Smart Fundis — <Trade>: <Task> · <date>." This block ends in a small amber badge seal (the only amber in this section besides the label dot).
- Caption under the pipeline (dim): "Every AI result — pass, needs review or fail — goes to an Expert. No Badge is ever issued by AI alone."

### 3. "02 — WHAT THE AI NEVER DECIDES" `[ResponsibleAi.never]`

- Title: "A recommendation, not a decision."
- Two side-by-side ledgers (stacked on mobile, 6 + 6 columns on desktop), hairline rows, mono column headers:
  - **"THE AI DOES"**, white ✓ rows:
    - Marks each Rubric step yes, no or unclear, with a timestamp
    - Reads the paper code on camera
    - Drafts feedback for you
    - Recommends pass, needs review or fail
  - **"THE AI NEVER"**, rows led by a white — dash (not struck through, not red):
    - Issues a Badge
    - Approves or rejects you
    - Passes a safety step it is unsure about
    - Decides an appeal
    - Receives your name, phone or email (it gets the video, the Task and the Rubric only)
- One readout card under both ledgers, tag "RULE": "An Expert never reviews their own video. Only an Expert approval creates a Badge."

### 4. "03 — SAFETY CAPS" `[ResponsibleAi.caps]`

- Title: "Doubt goes to a human."
- Dim intro: "After the AI runs, plain code applies these rules. They are fixed, not learned."
- An **IF → THEN ledger**, full width, columns "IF" · "THEN" (desktop adds a third dim column "WHY"):
  - "A safety step is marked no" → "◐ Capped at Needs review" → "Getting it wrong can hurt someone."
  - "A safety step is marked unclear" → "◐ Capped at Needs review" → "Unsure is not safe."
  - "A Rubric step has no observation" → "Treated as unclear" → "Missing is not a pass."
  - "The paper code is unreadable or doesn't match" → "◐ Capped at Needs review" → "We can't prove the video was made for this check."
  - "The AI recommends fail" → "Stays fail. An Expert still reviews it." → "Rules never raise a result."
  The ◐ glyph and "Needs review" are amber; everything else is white or dim.
- **Paper code panel** beside the ledger on desktop (4 columns, ledger 8), below it on mobile. A readout card, tag "WHY PAPER":
  - "Our video AI sees but cannot hear. So you write a fresh 3-digit code on paper, show it to the camera, then do the work in one continuous shot."
  - "The AI reads the digits blind. Plain code compares them with your code."
  - A small line diagram (no photo): a paper rectangle with three empty digit boxes → an eye icon labelled "READ BLIND" → an equals sign labelled "COMPARED IN CODE".

### 5. "04 — CONSENT AND YOUR VIDEO" `[ResponsibleAi.video]`

- Title: "Your video stays yours."
- A **readout list**, hairline rows, mono label on the left and a plain value on the right (desktop: two columns of rows, 6 + 6):
  - "CONSENT · Before every upload, in English and Kiswahili. Upload stays off until you agree. We record which version you agreed to, and when."
  - "WHO SEES IT · You, Experts approved for your trade, Admins, and our AI."
  - "PUBLIC · Only your Badge. Never your video or the AI's feedback."
  - "TRAINING · Your video is not used to train AI, and never added to the Data Co-op."
  - "GPU COPY · The copy on our GPU server is deleted once it has been checked."
  - "STORAGE · Your video is kept privately until you delete it."
  - "DELETE · Remove your video once review is finished. Your Badge stays." with a mono tag "COMING SOON" on the right edge
  - "APPEAL · Rejected? Appeal once, with a reason. A different Expert decides." with a mono tag "COMING SOON" on the right edge
- The "COMING SOON" rows are plain readouts at full opacity with dim text, never buttons, never greyed out.
- Under the list, a readout card, tag "TRACES": "Our AI logs are masked. They keep ids, the trade, the verdict and the status. They drop video links, prompts and feedback text." Beside it (desktop) or below it (mobile), a second card, tag "SHOWCASE": "YouTube and TikTok links are showcase only. We never download them, and they never earn a Badge."

### 6. "05 — HOW WE TEST" `[ResponsibleAi.eval]`

- Title: "Measured before we claim."
- A **4-step method strip** (vertical on mobile, horizontal 4 columns on desktop), each a numbered mono tag and one dim line:
  - "01 CLIPS" — "Our own recordings of cornrows and socket installs, staged safety faults, and clips with a wrong or missing code, plus licensed stock clips. Never YouTube or TikTok."
  - "02 BLIND LABELS" — "People label every clip before the AI sees it."
  - "03 MEASURE" — "How often the AI agrees with the labels, and how many staged safety faults it catches."
  - "04 SPLIT" — "Results per trade and per model, split by gender and by lighting."
- An **EXAMPLE results ledger**, full width, with a meta row "EVAL RESULTS" on the left and "EXAMPLE · NOT MEASURED YET" on the right. Columns: MODEL · TRADE · AGREEMENT · SAFETY-FAULT RECALL · SPLIT BY. Two rows:
  - "Cosmos Reason 2 8B · Electrical · — · — · Gender, lighting"
  - "Cosmos Reason 2 8B · Hairdressing · — · — · Gender, lighting"
  The AGREEMENT and SAFETY-FAULT RECALL cells show a long dash "—" only. **Do not put any number, percentage, bar, gauge or sparkline in these cells.** On mobile the ledger becomes two stacked cards with the same labels (no horizontal scroll).
- Caption (white, not dim): "No accuracy numbers yet. We make no accuracy claim until the test has run."

### 7. "06 — LIMITS AND KNOWN RISKS" `[ResponsibleAi.limits]`

- Title: "What we can't promise."
- A grid of **readout cards** (1 column mobile, 2 at 768 px, 3 on desktop), each with a mono tag and one or two dim lines. No icons in amber.
  - "AI CAN BE WRONG" — "That is why every result goes to an Expert."
  - "HANDWRITTEN CODES" — "We haven't yet measured how well the AI reads handwritten digits."
  - "NO SOUND" — "The video AI only sees. Saying your code aloud is fine, but it isn't checked."
  - "VIDEO LINKS" — "If a private video link leaks, it works until the video is deleted. A fix is planned."
  - "FALLBACK MODEL" — "If our main model is down, a smaller one (Cosmos Reason 2 2B) runs, and the record notes it."
  - "WHAT A BADGE ISN'T" — "Not a qualification, licence or background check. NITA, KNQA and TVETs certify. We verify one skill, on video."

### 8. "07 — CONTACT" `[ResponsibleAi.contact]`

- A single bordered panel, 2 columns on desktop (text 7, action 5), stacked on mobile.
- Title: "Questions about a decision or your data?"
- Dim line: "Write to us. A person reads every message."
- One outlined pill "Email us" (a `mailto:` to the single contact email; draw the address as the placeholder text "contact email") and a dim text link "Read how verification works" to `/evidence`.

### 9. The shared footer (from `00-shell-v2.md`).

---

## Responsive summary

| Section | < 768 px | 768–1023 px | ≥ 1024 px |
| --- | --- | --- | --- |
| Hero | stacked: text, pills, frame, ledger | stacked, frame wider | 5 / 7 columns |
| 01 pipeline | vertical | 3 + 3 | 6 horizontal |
| 02 never | stacked ledgers | 6 / 6 | 6 / 6 |
| 03 caps | ledger, then paper panel | ledger, then paper panel | 8 / 4 |
| 04 video | one list, then 2 cards | 2-column rows | 2-column rows, 2 cards side by side |
| 05 eval | vertical steps, results as cards | 2 × 2 steps, ledger | 4 steps, full ledger |
| 06 limits | 1 column | 2 columns | 3 columns |
| 07 contact | stacked | stacked | 7 / 5 |

## Motion

- The hero scan line sweeps once and the active marker (02) pulses; the ◐ verdict row fades in after the sweep. Section reveals use the masked line split from `DESIGN.md`.
- `prefers-reduced-motion`: show the final frame (marker 02 active, verdict row visible) with no movement.

## Common mistakes to avoid

- Filling the eval ledger with numbers, bars or "98%" style readouts. It stays "—".
- A "LIVE" or "SYSTEM ONLINE" chip anywhere, or a status dot beside "GPU".
- Green ticks, red crosses or red "fail" text. ✓ is white; only ◐ Needs review is amber; there is no red.
- Printing the Kiswahili consent text on this page.
- Drawing "Delete" or "Appeal" as buttons. They are readouts with a "COMING SOON" tag.
- Saying the AI "approves", "certifies", "grades" or "scores" anyone.
- Adding photos to sections 01–07. Only the hero frame has a photo.

---

## Handoff notes for frontend (not for Stitch)

- **Nav:** add `/responsible-ai` to `BUILT_ROUTES` and point the footer `Links.responsibleAi` at it (it currently goes to `/#telemetry`; DESIGN.md's IA table maps "Responsible AI" to `/telemetry`, which this page now supersedes for that link).
- **V4 rows:** the DELETE and APPEAL rows carry "COMING SOON" until V4 ships video deletion and appeals (spec §9; both are on the cut list). When V4 ships them, drop the tag. If V4 is cut, keep the tag or remove the rows (HANDOFF C-6).
- **Eval ledger:** when `eval/results.csv` exists and the Architect approves publishing it, the dashes are replaced by the real figures and the "EXAMPLE · NOT MEASURED YET" tag goes. Until then, the copy "No accuracy numbers yet" stands (spec §9).
- **2B row:** not drawn, because 2B in the eval is on the cut list. Add it only if it is measured.
- **Contact email:** the single contact email is not in `en.json` yet; use the same value as `/contact`.
- **Links to unbuilt routes** (`/privacy`, `/evidence`) are filtered by `builtOnly()`; the hero's "Your privacy" pill and the contact text link hide until those routes ship.
