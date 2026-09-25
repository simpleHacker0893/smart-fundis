# 01 — Landing page (round 2, "Instrument" build spec)

This file has two parts:
- **Part A** is the full build spec in the CAUSTIC template structure. The coded prototype (`design/prototypes/landing/`) is built from it.
- **Part B** is the Stitch preview prompt. It is Part A's layout and content with no tokens, because the Stitch project design system carries those.

---

## PART A — Build spec

Build the "Smart Fundis — Kazi yako, sifa yako" landing page as a high-end technical landing page with high visual fidelity. The result must follow `design/stitch/DESIGN.md` (v2 "Instrument") exactly, not a reinterpretation of it. The aesthetic is a **95% graphite and white precision instrument, with amber as punctuation.**

### CRITICAL FIDELITY CONSTRAINTS
- **Preserve the one signature idea: the evidence frame.** Every section is a bounded experiment, one frame of a fundi's video under inspection, with a mono readout (label · value · unit).
- **Negative constraints:**
  - no background music
  - no scroll-jacking: use standard scroll with pinned sections
  - no decorative layers that the evidence-frame idea does not explain
  - no stock-photo collages
  - no counters, ratings, testimonials or logos
- **Copy is fixed:** use the strings below exactly. Never write "certified", except in "NITA, KNQA and TVETs certify".

### TECH STACK / DEPENDENCIES
- **Tailwind CSS:** `https://cdn.tailwindcss.com`
- **GSAP 3.13.0 and ScrollTrigger** (cdnjs or jsdelivr) for every editorial reveal, pin and scrub.
- **Three.js** (jsdelivr `three@0.170`) for the WebGL scenes in Sections 01, 05, 06 and 09.
- **Custom WebGL2 shaders** for the "Liquid Metal" primary button and the Section 01 scan-line field.
- Every WebGL canvas is lazy-initialised with IntersectionObserver after first paint. Text and buttons must never wait for WebGL.

### GLOBAL STYLE
- **Colours:**
  - background `#050609`, panel `#0B0D12`, hairline `rgba(242,244,247,.10)`
  - text `#f2f4f7`, dim `rgba(242,244,247,.55)`, faint `rgba(242,244,247,.34)` (decorative only)
  - amber accent `#ef9a57`
- **Typography:**
  - Display: `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Inter, sans-serif`, at weight 500–600 with −0.03em tracking.
  - Mono: `ui-monospace, SFMono-Regular, Menlo, monospace` at 12 px, 0.26em letter-spacing, uppercase.
  - Numbers use `tabular-nums`.
- **Grain:** a fixed canvas `#grain`, with `opacity: .045`, `mix-blend-mode: overlay` and `pointer-events: none`.

### ASSET MAP
- `hero-1080.webp`, `hero-720.webp` and `hero-360.webp` (from `design/canva/exports/web/`) show hands wiring a 13A socket with the paper code "482". They are the **evidence texture** on the Section 01 plate, desaturated to 20% in the shader.
- `paper-code-tip-720.webp` shows a paper code (315) held to the camera. It is used in Section 02.
- `coop-teaser-1280.webp` shows tools on a workbench. It is used in Section 08, at 30% opacity under a scan-line mask.
- Everything else is procedural (WebGL, SVG or Canvas).

### VECTOR / ICON SHAPES
- **Logo / boot icon** (the evidence frame with a verdict):
  ```xml
  <svg viewBox="0 0 24 24" fill="none">
    <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="6" stroke="rgba(242,244,247,.7)" stroke-width="2"/>
    <path d="M7 12.4 L10.6 15.8 L17.4 8.4" stroke="#ef9a57" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```
- **Step marker:** a 10 × 10 diamond (a square rotated 45°) with a 1 px `--text` outline. It fills amber when the step is checked.
- **Verdict glyphs:** ✓ pass (white) and ◐ needs review (amber), always with a text label.

### LAYER STACK / POSITIONING MAP
- **`#boot`:** `z-index: 200`, fixed.
  - It shows the logo, then the mono line "CALIBRATING · 000%" counting deterministically from 0 to 100%.
  - A 1 px amber bar grows from `inset: 0 100% 0 0` to `inset: 0 0 0 0`.
  - It fades out at 100%, and never lasts longer than 1.2 s.
- **`#top`:** `z-index: 100`, fixed, 78 px tall (64 px on mobile), with a transparent-to-graphite blur behind it after 40 px of scroll.
  - **Left:** the logo and the wordmark "Smart Fundis".
  - **Desktop:** the nav "How it works · Trades · What we check · Roadmap", then a "Sign in" text link and the primary button "Join as a fundi".
  - **Mobile:** the "Join as a fundi" button and a "Menu" button.
- **`.hero`:** `position: sticky`, `top: 0`, `height: 100vh`, inside a 190vh `.s-prime` wrapper. It stacks `.hero-bg` (z 0), `.hero-gl` (z 10) and `.hero-content` (z 30).
- **`.lm` (Liquid Metal button):** a wrapper with `isolation: isolate`. The canvas `.lm-fx` sits at `top: -86px; left: -86px`, sized `calc(100% + 172px)`, with `pointer-events: none`.

### SECTION 01 — PRIME (Hero)
- **Layout:** a sticky 100vh hero inside a 190vh wrapper.
  - **Desktop:** the text sits in the left five columns, and the WebGL evidence plate fills the right.
  - **Mobile:** the text comes first, and the plate sits below it at 4:3.
- **WebGL (`hero-gl.js`):**
  - A thin glass plate carries the hero photo, desaturated, as its texture.
  - A horizontal amber scan line sweeps down it. As scroll progress goes from 0 to 1, four step markers lock onto the plate: "01 ISOLATE POWER · 00:04", "02 STRIP & TERMINATE · 00:19", "03 EARTH CONTINUITY · 00:41", "04 FACEPLATE SECURE · 00:58".
  - At progress 1 the plate tilts 8° and the verdict chip locks in.
- **Copy:**
  - Mono label: "SMART FUNDIS / 01 — PROOF OF SKILL"
  - Headline (`data-split`): "Kazi yako,<br>sifa yako."
  - Sub-line, in dim: "Your work, your reputation. Prove your skill with one short phone video. AI checks every step. A human Expert decides. You earn a badge clients can trust."
  - Buttons: the primary "Join as a fundi" (Liquid Metal) and the secondary "Find a fundi".
- **Verdict chip:** it overlaps the plate's bottom-left corner.
  - It shows the mono tag "EXAMPLE" in an amber outline, then "✓ Verified by Smart Fundis", then "Electrical · Install a 13A socket" in dim.
  - It is a `--panel` card with a 1 px hairline.
- **Interaction:** in the Liquid Metal button the metal pools toward the cursor, with a displacement warp and slight chromatic dispersion in the fragment shader.

### SECTION 02 — CODE (Record your work)
- **Layout:** a two-column `.split`. The left is `.fx-pane` and the right is text. They stack on mobile.
- **Visual:** a bounded experiment. A fresh 3-digit code **scrambles** (`data-scramble`) through digits, then settles on "315", written in a handwritten-style SVG stroke on a paper rectangle, with `paper-code-tip` behind it at 40%. The mono readout reads "LIVENESS CODE · 315 · ISSUED 00:00:03 AGO".
- **Copy:**
  - Label: "02 — RECORD"
  - Title: "Record your work."
  - Body: "Write your code on paper, show it to the camera, then do the job in one continuous shot. A fresh code every time, so the video is really yours, really now."

### SECTION 03 — LOUPE (AI checks each step)
- **Interaction:** a real-time magnification loupe (`#loupeStage`) follows the pointer over a still frame of the work. Touch uses drag.
  - The canvas resamples the frame every frame.
  - The loupe rim has a "rim bend" and RGB fringing.
  - Inside the loupe, the step marker nearest the pointer lights amber and its mono readout appears, for example "STEP 03 · EARTH CONTINUITY · OBSERVED ✓ · 00:41".
- **Copy:**
  - Label: "03 — CHECK"
  - Title: "AI checks each step."
  - Body: "NVIDIA AI watches every step of the task and marks exactly where it happens in your video."
  - Small line, in dim: "Safety steps are never passed automatically."

### SECTION 04 — LEDGER (An Expert decides)
- **Layout:** an interactive table with the columns STEP · AI OBSERVATION · TIME · STATUS.
  - "Isolate power · Breaker off, tested dead · 00:04 · ✓ Observed"
  - "Strip & terminate · Conductors to L/N/E · 00:19 · ✓ Observed"
  - "Earth continuity · Tester reading unclear · 00:41 · ◐ Needs review"
  - "Faceplate secure · Screws seated, flush · 00:58 · ✓ Observed"
- Hovering a row updates a small WebGL specimen (`#specStep`) showing that step's frame.
- A final row, divided off with a heavier hairline, reads "EXPERT DECISION · Approved by an Electrical Expert · — · ✓ Badge issued".
- **Style:** `tabular-nums`. The "Needs review" row carries an amber ◐, and the caption beneath says: "A safety step marked unclear caps the AI at 'needs review'. AI recommends. Experts decide."
- **Copy:** the label "04 — DECIDE" and the title "An Expert decides."

### SECTION 05 — ASSEMBLY (The badge)
- **Layout:** a pinned section (`.s-assembly`, 190vh).
- **Interaction:** scroll progress drives four thin layers (VIDEO → CODE → AI CHECK → EXPERT) that fly together along Z into a single badge seal. The mono readout counts "SEPARATION 24.00 mm → 0.00 mm". At 0.00 mm it reads "SEATED · BADGE ISSUED".
- **Copy:**
  - Label: "05 — BADGE"
  - Title: "Your work, your badge."
  - Body: "Your video stays private. Only your badge is public, on a profile you can share with any client."
  - The badge face shows "EXAMPLE".

### SECTION 06 — TRADES (The specimen library)
- **Layout:** a field of floating 3D cards (`.sp-card`), 12 in total. They form a 2-column grid on mobile and 4 columns on desktop.
- **Live cards (2):** "Electrical" (plug icon) and "Hairdressing" (scissors icon).
  - Each shows the mono tag "LIVE", an amber "Verify now →" text link, and a hairline border that turns amber on hover.
  - The whole card is a link.
- **Coming-soon cards (10):** Plumbing, Masonry, Carpentry, Welding, Mechanic, Tailoring, Beauty, Solar installation, Mama fua (laundry), Movers.
  - Each shows a plain dim readout with the mono tag "COMING SOON".
  - They are not links and not disabled buttons, and they do not lean or rotate.
- **Interaction:** proximity-based rotation on live cards only. They lean toward the pointer, and the hovered card turns to face the user and raises its `envMapIntensity`.
- **Copy:** the label "06 — TRADES" and the title "Two trades live. Ten on the bench."

### SECTION 07 — SCOPE (What "verified" means)
- **SVG graphic `#scopeFig`** (640 × 300): a single white ray, labelled "VIDEO", enters a prism labelled "SMART FUNDIS".
  - It exits as **five** white rays that each end in a ✓ label: "Recorded in the app", "Fresh code on camera", "Every step checked by AI", "Safety never auto-passed", "An Expert in your trade decides".
  - Three dashed faint rays that don't pass through the prism end in dim labels: "ID or background", "Licences or insurance", "Formal qualifications".
- **Copy:**
  - Label: "07 — SCOPE"
  - Title: "One word, exactly defined."
  - Body: "What 'Verified by Smart Fundis' means, and what it doesn't. NITA, KNQA and TVETs certify qualifications. We verify a skill, on video."
- **Secondary button:** "Skilled in your trade? Become a verifier".

### SECTION 08 — ROADMAP (Coming next)
- **Component:** a draggable horizontal rail (`.notes-rail`) of four cards. **No testimonials.**
- **Cards:**
  - "Smart Fundis Data Co-op: earn from your skills, by choice"
  - "Bookings & M-Pesa payments"
  - "Fundi Pro"
  - "Training partners"
- Each card has the mono tag "COMING SOON", a one-line dim description and a small procedural shard cluster (`.tshards`) that reacts to drag momentum.
- `coop-teaser` sits behind the rail at 30% opacity under a scan-line mask.
- **Copy:** the label "08 — NEXT", the title "Coming next: earn from your skills" and the link "See the roadmap →".

### SECTION 09 — SEAL (Footer CTA)
- **Visual:** a final WebGL assembly (`#sealGL`). Fragments of the evidence frame converge into a solid badge seal as the user reaches the bottom.
- **CTA:**
  - Title: "Show your work."
  - Buttons: the primary "Join as a fundi" (Liquid Metal) and the secondary "Find a fundi".
- **Wordmark:** the huge "SMART FUNDIS" letters in the footer react individually. Pointer proximity lifts each letter on the Y axis and shifts its stroke colour from cool white to amber.
- **Footer links** (four groups):
  - **For fundis:** "Join as a fundi", "How verification works", "Your privacy"
  - **For clients:** "Find a fundi", "What 'verified' means"
  - **For Experts:** "Become a verifier"
  - **About:** "Responsible AI", "Roadmap", "Contact"
- **Bottom row:** "We verify skills. NITA, KNQA and TVETs certify." and "© 2026 Smart Fundis".

### GLOBAL ANIMATION / INTERACTION RULES
- **Editorial reveals:** `[data-split]` headlines are masked per line and animate with GSAP `from` using `yPercent: 118`, `ease: 'power3.out'` and `stagger: .085`.
- **Parallax:** `[data-par]` elements scrub their Y position with ScrollTrigger at `scrub: .55`.
- **Hover lift:** `.btn.p:hover` translates −2 px on Y.
- **Scramble:** `[data-scramble]` cycles digits and mono glyphs for 600 ms, then settles.
- **Reduced motion:** `prefers-reduced-motion: reduce` shows every final state instantly, with WebGL rendering one static frame.

### COMMON MISTAKES TO AVOID
- Using generic stock imagery, or putting photos anywhere except inside evidence frames.
- Letting amber spread. It is punctuation, so use it once or twice per viewport.
- Forgetting `tabular-nums` on timestamps, codes and the ledger.
- Leaving out `mix-blend-mode: overlay` on the grain.
- Making coming-soon trades look clickable or disabled, when they are plain readouts.
- Adding counters, star ratings, "trusted by" logos or testimonials.
- Mono text below 12 px, or `--faint` used for readable text.

### IMPLEMENTATION REQUIREMENTS
- Keep this section order: 01 → 09.
- `pointer-events: none` on every technical overlay, so buttons stay clickable.
- A deterministic `#boot` sequence from 0 to 100%.
- At 360 px there is no horizontal scroll, every tap target is at least 48 px, and the text and buttons are visible before any WebGL initialises.

---

## PART B — Stitch preview prompt (layout and content only)

- **Project:** `6238825713575829455`.
- **Design system:** "Smart Fundis — Instrument" (dark).
- **Device:** DESKTOP first, then MOBILE.

Paste everything below the line.

---

Landing page for "Smart Fundis — Kazi yako, sifa yako", a precision, instrument-grade page where Kenyan fundis (tradespeople) prove a real skill with one short phone video: AI checks every step, a human Expert decides, and the fundi earns a public badge. The aesthetic is a scientific measuring instrument: near-black, hairline rules, uppercase monospace readout labels with wide letter-spacing, huge tight display headlines, and one warm accent used only as punctuation. It is sparse, editorial and high-end. Every section is a bounded "inspection" of one video frame, with timestamps, step markers and a scan line. The page has no stock-photo collages, counters, ratings, testimonials or logos.

**PLATFORM:** Web, desktop-first (1280 px); stacks to a single column on mobile.

**PAGE STRUCTURE:**
1. **Header:** a transparent fixed bar.
   - **Left:** a logo mark (a rounded-square outline with an accent check stroke inside) and the wordmark "Smart Fundis".
   - **Centre:** the nav "How it works", "Trades", "What we check", "Roadmap".
   - **Right:** a "Sign in" text link and a pill primary button "Join as a fundi".
2. **Hero (full viewport):**
   - **Left column:** the mono label "SMART FUNDIS / 01 — PROOF OF SKILL", the giant two-line headline "Kazi yako, sifa yako.", and the dim sub-line "Your work, your reputation. Prove your skill with one short phone video. AI checks every step. A human Expert decides. You earn a badge clients can trust." Below it sit two pill buttons, the primary "Join as a fundi" and the outlined "Find a fundi".
   - **Right:** a large dark glass "evidence plate" showing a desaturated close-up photo of hands wiring a wall socket.
     - A thin accent scan line crosses the plate horizontally.
     - Four small diamond step markers with mono readouts are pinned to it: "01 ISOLATE POWER · 00:04", "02 STRIP & TERMINATE · 00:19", "03 EARTH CONTINUITY · 00:41", "04 FACEPLATE SECURE · 00:58".
     - A small dark card overlaps the plate's bottom-left corner: an outlined mono tag "EXAMPLE", then "✓ Verified by Smart Fundis", then "Electrical · Install a 13A socket".
3. **02 — RECORD:** a two-column split.
   - **Left:** a bounded panel showing a paper slip with the handwritten code "315", and the mono readout "LIVENESS CODE · 315 · ISSUED 00:00:03 AGO".
   - **Right:** the title "Record your work." and the body "Write your code on paper, show it to the camera, then do the job in one continuous shot. A fresh code every time, so the video is really yours, really now."
4. **03 — CHECK:** a wide still frame of the work with a circular magnifying loupe over one area. The loupe has a thin rim with a slight colour fringe, and inside it a lit step marker with the readout "STEP 03 · EARTH CONTINUITY · OBSERVED ✓ · 00:41". Beside it, the title "AI checks each step.", the body "NVIDIA AI watches every step of the task and marks exactly where it happens in your video." and the small dim line "Safety steps are never passed automatically."
5. **04 — DECIDE:** the title "An Expert decides." above an instrument-style data table with hairline rows and the columns STEP · AI OBSERVATION · TIME · STATUS.
   - The rows: "Isolate power · Breaker off, tested dead · 00:04 · ✓ Observed", "Strip & terminate · Conductors to L/N/E · 00:19 · ✓ Observed", "Earth continuity · Tester reading unclear · 00:41 · ◐ Needs review" (in accent), "Faceplate secure · Screws seated, flush · 00:58 · ✓ Observed".
   - A final emphasised row: "EXPERT DECISION · Approved by an Electrical Expert · — · ✓ Badge issued".
   - The caption: "A safety step marked unclear caps the AI at 'needs review'. AI recommends. Experts decide."
6. **05 — BADGE:** a centred, exploded 3D stack of four thin translucent layers labelled VIDEO, CODE, AI CHECK and EXPERT, converging into a circular badge seal marked "EXAMPLE". Beside it is the mono readout "SEPARATION 0.00 mm · SEATED · BADGE ISSUED", the title "Your work, your badge." and the body "Your video stays private. Only your badge is public, on a profile you can share with any client."
7. **06 — TRADES:** the title "Two trades live. Ten on the bench." above a 4-column grid of 12 dark cards.
   - The first two are live: "Electrical" (plug icon) and "Hairdressing" (scissors icon), each with the mono tag "LIVE", an accent "Verify now →" link and a brighter border.
   - The other ten are plain dim readouts with the mono tag "COMING SOON": Plumbing, Masonry, Carpentry, Welding, Mechanic, Tailoring, Beauty, Solar installation, Mama fua (laundry), Movers.
8. **07 — SCOPE:** the title "One word, exactly defined." A line diagram shows one ray labelled "VIDEO" entering a prism labelled "SMART FUNDIS".
   - It exits as five solid rays, each ending in a ✓ label: "Recorded in the app", "Fresh code on camera", "Every step checked by AI", "Safety never auto-passed", "An Expert in your trade decides".
   - Three dashed faint rays end in dim labels: "ID or background", "Licences or insurance", "Formal qualifications".
   - The body: "NITA, KNQA and TVETs certify qualifications. We verify a skill, on video."
   - An outlined button: "Skilled in your trade? Become a verifier".
9. **08 — NEXT:** the title "Coming next: earn from your skills" above a horizontal rail of four dark cards, each with the mono tag "COMING SOON" and small abstract glass shards: "Smart Fundis Data Co-op: earn from your skills, by choice", "Bookings & M-Pesa payments", "Fundi Pro", "Training partners". Then the link "See the roadmap →".
10. **09 — SEAL / Footer:**
    - A closing CTA: the giant headline "Show your work." with the two pill buttons "Join as a fundi" and "Find a fundi".
    - Four link columns:
      - **For fundis:** Join as a fundi, How verification works, Your privacy
      - **For clients:** Find a fundi, What 'verified' means
      - **For Experts:** Become a verifier
      - **About:** Responsible AI, Roadmap, Contact
    - A huge outlined "SMART FUNDIS" wordmark spanning the full width.
    - A bottom row: "We verify skills. NITA, KNQA and TVETs certify." and "© 2026 Smart Fundis".

**RULES:**
- Never use the word "certified".
- The sample badge always shows "EXAMPLE".
- Coming-soon items are plain readouts, not buttons.
- The accent colour appears only as punctuation (the scan line, the active markers, the primary button, the needs-review status).
- Tap targets are at least 48 px.
