# Smart Fundis — Design System (v2, "Instrument")

This replaces v1 (light and warm, green `#0B5D3B` and orange `#F28C28`). It follows the structure of the "CAUSTIC — Optics as a medium" reference: a precision-instrument landing page that is **95% graphite and white, with amber used only as punctuation.** For the decision, see `planning/DECISIONS.md` D-9.

Every screen prompt includes the **DESIGN SYSTEM (REQUIRED)** block below word for word. Stitch gets the tokens from the project design system, so its prompts carry layout and content only. The coded prototype prompts carry everything.

## Reference screen (approved 2026-09-25)

The approved look is the Stitch screen **"Evidence Frame Step Inspector (Mobile)"** (`3a2e568a398e4464a1a60a90a55b2037`), exported as `exports/01-landing-v2.1-mobile-REFERENCE.{html,png}`. Where this file and that screen disagree on layout or density, **the screen wins**. The honesty rules below still apply on top of it.

What it adds to this spec:
- **A step inspector in the hero:** four step tabs (01–04, each with a timestamp and a status) drive a moving reticle on the evidence plate and highlight the matching ledger row.
- **Stitch's font mapping:** Inter for display and body, JetBrains Mono for readouts, and Public Sans for tab labels.
- **Compact mobile density:** 48 px sticky header, 16 px gutters, and a fixed bottom tab bar.

Things in the reference to fix when coding, because they break the rules below:
- ✓ is drawn in green `#10b981`. It must be white, with amber only for ◐.
- Mono text is 6.5–9 px. The floor is 11 px on mobile, and 12 px for anything a person must read.
- "Coming soon" tiles use `opacity-60`, which makes them look disabled. They should be plain readouts at full opacity with dim text.
- Invented copy ("PHYSICAL TETHER CODE", "SYNC: 254-NBO", "SYSTEM ID: SF-254", "LAYER 04: JURY SIGN-OFF") is replaced with the copy in the prompts.
- The header button "VERIFY" becomes "JOIN", and the bottom tabs become the IA below.

## Information architecture

| Tab / menu | Page | Route | Prompt |
| --- | --- | --- | --- |
| (logo) | Landing | `/` | `prompts/01-landing.md` |
| **EVIDENCE** | How verification works and what "verified" means | `/evidence` | `prompts/02-evidence.md` |
| **TRADES** | Trade catalogue (2 live, 10 coming soon) | `/trades` | `prompts/03-trades.md` |
| **TELEMETRY** | How the AI works (Responsible AI) | `/telemetry` | `prompts/04-telemetry.md` |
| **COMPANY ▾** → About | About | `/about` | `prompts/05-about.md` |
| **COMPANY ▾** → Contact us | Contact | `/contact` | `prompts/06-contact.md` |
| Menu / header | Sign in · Join (sign up) · Signed out | `/sign-in` · `/sign-up` · `/signed-out` | `prompts/07`–`09` |
| Footer | Your privacy · Become a verifier · Roadmap · Find a fundi | `/privacy` · `/experts` · `/roadmap` · `/fundis` | `prompts/10`–`13` |

Some footer links point to sections of existing pages:
- "How verification works" goes to `/evidence`.
- "What 'verified' means" goes to `/evidence#scope`.
- "Responsible AI" goes to `/telemetry`.

### Responsive rules (every page)

Every page is **one responsive web app**, never a phone column centred on a desktop canvas.

| Width | Layout |
| --- | --- |
| **< 768 px** | The approved mobile layout. Single column, 16 px gutters, a 48 px sticky header (logo, "JOIN" pill, menu) and the fixed bottom tab bar. |
| **768–1023 px** | A 2-column layout where it helps. The header and tab bar work as on mobile. |
| **≥ 1024 px** | A centred container (max-width 1280 px, 32–48 px padding) on a 12-column grid. The header is 72 px, with nav links and a COMPANY ▾ dropdown, "Sign in" and "Join as a fundi". **No bottom tab bar.** |

On desktop, each section type takes this layout:
- **Heroes:** 2 columns, with text in 5 columns and the evidence frame in 7.
- **Ledgers:** full width, and they show extra columns.
- **Card groups:** 3–5 columns.
- **Pipelines and timelines:** horizontal.
- **Forms:** beside their image.
- **Auth pages:** a split screen, with the photo on one half and the panel on the other.
- **Footer:** a CTA band, then 4 link columns, then the full-width wordmark.
- **Spacing:** about 120 px between sections.

On mobile, the bottom tab bar holds EVIDENCE · TRADES · TELEMETRY · COMPANY. COMPANY opens a small sheet with About and Contact us. On desktop, the same four items appear as header nav, with COMPANY as a dropdown. Auth pages have no tab bar. The shared shell (header, menu, tabs and footer) is in `prompts/00-shell-v2.md`.

## One signature idea: the evidence frame

Every section is an **inspection**: one frame of a fundi's video under measurement. It has timestamps, step markers, a scan line that reads the work, and a verdict that locks in. Each section should feel like a **bounded experiment** with an instrument readout: a mono label, a value and a unit. There is nothing decorative that the idea does not explain.

## DESIGN SYSTEM (REQUIRED)

- **Platform:** a responsive web PWA. Design at **360 px** first, then 768 px and 1280 px. Desktop is where the cinematic layer shows best, but mobile must still feel like an instrument, not a cut-down page.
- **Theme:** dark, precise and quiet. It is a measuring instrument, not a startup: confident, technical and human.
- **Colours (tokens):**
  - `--bg` Graphite `#050609`: the page background.
  - `--panel` `#0B0D12`: raised panels and cards. `--line` `rgba(242,244,247,.10)`: 1 px hairlines and borders.
  - `--text` `#f2f4f7`: headings and body.
  - `--dim` `rgba(242,244,247,.55)`: secondary text. It passes AA at about 5.6:1.
  - `--faint` `rgba(242,244,247,.34)`: **decorative only**, for tick marks, grid numbers and rules. It is never used for text a person needs to read, because it fails AA at about 2.7:1.
  - `--amber` `#ef9a57`: the **only accent**. It marks punctuation: the scan line, active step markers, the verdict tick, the primary button fill and one key word per section at most. The primary button is amber with graphite `#050609` text (about 9:1). Amber text on graphite is allowed for short labels (about 9:1).
  - `--pass` stays white with a ✓ glyph, and `--review` is amber with a ◐ glyph. Status is never shown by colour alone.
- **Typography:**
  - **Display:** `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Inter, sans-serif`. In Stitch this maps to **Inter**. Headlines are tight (letter-spacing −0.03em, line-height 0.95–1.05) at weight 500–600.
    - Hero: 44 px mobile and 104 px desktop. Section titles: 32 px mobile and 64 px desktop.
  - **Body:** the same family at 16–18 px, with line-height 1.55, in `--dim` or `--text`.
  - **Mono:** `ui-monospace, SFMono-Regular, Menlo, monospace`. In Stitch this maps to **JetBrains Mono**. Instrument labels are UPPERCASE with 0.26em letter-spacing, at **12 px minimum** (the reference uses 10 px, raised here for readability).
  - All numbers use `font-variant-numeric: tabular-nums`.
- **Shape:** mostly square and precise. Panels have a 4 px radius or none. Buttons are pill-shaped (fully rounded) and at least 48 px tall. Lines are 1 px hairlines. There are no drop shadows, only light: glows, edge highlights and a fixed grain overlay.
- **Grain:** a fixed full-screen canvas `#grain` at `opacity: .045` with `mix-blend-mode: overlay` and `pointer-events: none`.
- **Buttons:**
  - **Primary** ("liquid metal"): an amber fill, a graphite label and a WebGL sheen that pools toward the cursor.
  - **Secondary:** a transparent fill, a 1 px `--line` border and a `--text` label. Its border brightens on hover.
  - Both lift −2 px on hover. At 360 px they are full-width.
- **Icons:** 24 px line icons with a 1.5 px stroke in `--text`. Amber is used only on the active or verified state. Every icon has a text label.
- **Logo:** a rounded square in 70% white with an amber check stroke. It is the "evidence frame" with a verdict inside it.
  ```xml
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="6" stroke="rgba(242,244,247,.7)" stroke-width="2"/>
    <path d="M7 12.4 L10.6 15.8 L17.4 8.4" stroke="#ef9a57" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```
  The wordmark is "Smart Fundis" at weight 600, with the mono tag "VERIFIED SKILLS" in `--dim`.
- **Imagery:** mostly procedural (WebGL, SVG and Canvas). The one exception is **documentary photos of hands, tools and work, used as the "evidence" inside frames.** They are desaturated to about 20% colour, have scan lines and timestamps drawn over them, and show no identifiable faces, text or logos.
- **Motion:**
  - GSAP with ScrollTrigger drives the editorial reveals: masked line splits using `yPercent: 118`, `power3.out` and a 0.085 stagger.
  - Parallax uses scrub 0.55. Pinned sections are allowed, but there is no scroll-jacking and no sound.
  - `prefers-reduced-motion` shows the final state of every animation with no movement.
- **Accessibility:**
  - WCAG 2.2 AA.
  - Tap targets are at least 48 px.
  - The focus ring is 2 px amber with a 2 px offset.
  - `pointer-events: none` is set on every overlay.
  - Each WebGL canvas has `aria-hidden` and a text equivalent next to it.
- **Honesty rules (unchanged from v1):**
  - Always "Verified by Smart Fundis", never "certified". NITA, KNQA and TVETs certify.
  - No counters, statistics, ratings, testimonials or partner logos.
  - Post-MVP features appear only with a "Coming soon" tag.
  - Any sample Badge carries an **"EXAMPLE"** tag.
  - "AI recommends, Experts decide."

## Principles

1. **Instrument, not advert.** Every visual measures something real in the verification flow: a timestamp, a step, a code or a verdict.
2. **95 / 5.** Graphite and white carry the page. If amber appears more than once or twice per viewport, remove some.
3. **Proof over promises.** Show what verification looks like, and say exactly what we check and what we don't.
4. **Nothing looks live that isn't.** Coming-soon items are plain readouts with a tag, never disabled buttons.
5. **Heavy, but honest about it.** The cinematic layer is lazy-loaded after first paint. Text and buttons render first, and a low-power or reduced-motion device gets the static final frames.

---

## Dashboards (V2, "app mode")

**Status:** draft for operator review (V2-40 step 1, 2026-09-26). It covers every signed-in role route (`/dashboard`, `/fundi/*`, `/client/*`, `/expert/*`) and the public `/jobs` board. `/admin/*` uses plain shadcn in the dark token theme and follows only the tokens, chips, states and honesty rules here. Sources: the V2 marketplace spec §5, §7, §8.4a, §9, §11, §13 (`docs/superpowers/specs/2026-09-26-v2-marketplace-design.md`); `docs/reviews/v2-architecture.md` §2.5; D-45 to D-58; the NVIDIA fit note §1.2 and §3. **Where this section and the spec disagree, the spec wins.** Open conflicts are listed at the end of this section, not resolved here.

Every dashboard screen prompt (24 onwards) includes the **DESIGN SYSTEM (REQUIRED)** block above, then the **DASHBOARD RULES (REQUIRED)** block at the end of this section.

### D1. App mode (what changes from the landing pages)

The landing pages are a cinematic instrument, and the dashboards are the same instrument **in use**. They keep the tokens, type families, hairlines and honesty rules, and drop the heavy layer (review S1):

- **No grain, no GSAP, no WebGL, no scan-line sweeps and no parallax.** The primary button is a **flat amber pill** (CSS only, no liquid-metal sheen).
- **Budget:** about 150 KB gzipped of first-load JS per role route, tested on Slow 3G with 4× CPU throttling. No device or speed figures are claimed anywhere.
- **Motion:** only 150–200 ms opacity and transform changes for sheets, chips and row state. No staggered list reveals. `prefers-reduced-motion` removes all of it.
- **Type scale (app mode):**

| Role | Mobile (360 px) | Desktop (≥ 1024 px) |
| --- | --- | --- |
| Page title | 28 px, weight 600, −0.02em | 40 px |
| Section label | mono 12 px, UPPERCASE, 0.26em (English) / 0.08em (Kiswahili, tags and chips) | same |
| Row title | 16 px, weight 600, `--text` | 16 px |
| Body and evidence text | 16 px, line-height 1.5 | 16 px |
| Meta (place, age, band) | mono 12 px minimum, `--dim` | 12–13 px |

- **The mono floor is 12 px everywhere.** Nothing a person must read is below it. The Kiswahili hero rule from spec §5.4 applies to page titles too: `clamp(28px, 8vw, 40px)` with `overflow-wrap: anywhere`.
- **Images are never allowed** on dashboards, forms, the upload flow (including the Add video sheet) or Expert review. That means no photos, illustrations or Canva art, and no "evidence frame" photo in empty states. The only pictures on these screens are **user content**: the Fundi's own Assessment video in Expert review, a Client's Job photos on the Job detail, and a Fundi's own Portfolio thumbnails in "My public profile". Mockups of that content follow the V8 rule (problems such as a leaking pipe or a worn brake pad; never people or number plates) and are marked EXAMPLE.

### D2. The app shell

One `AppShell` serves every role. Only its nav config changes per role (V7-2).

**Header (every width):** sticky, graphite with a 1 px `--line` bottom hairline, no blur and no grain.

- **Mobile (< 1024 px), 56 px tall:** on the left, the logo mark (links to `/dashboard`) and a mono role label for the current dashboard ("FUNDI", "CLIENT", "EXPERT"). On the right, three 48 px targets:
  - the **bell** (from V8; the slot is **not drawn** in V7, because a bell with nothing to fill it would be a dead surface);
  - the **avatar** (initials, never a photo), which opens the avatar sheet;
  - the **menu** (≡), which opens the menu sheet.
- **Desktop (≥ 1024 px), 64 px tall:** the logo lockup, then the EN | SW toggle, the bell and the avatar on the right. The menu items move into the side rail's footer.

**Role bar: at most 4 items per role (D-57).**

- **< 1024 px: bottom nav.** Fixed, 64 px plus `env(safe-area-inset-bottom)`, with a 1 px top hairline. Each item has a 24 px line icon above a 12 px label (sentence case, Inter, **not** tracked mono, so Kiswahili labels fit). **Active:** white label and icon, with a 2 px amber bar on the item's top edge. **Inactive:** `--dim`. No count badges or dots on nav items; unread notices live on the bell only.
- **≥ 1024 px: side rail.** 232 px wide on the left, full height under the header, with a 1 px right hairline. Items are 48 px rows with the icon and label side by side. **Active:** a white label and a 2 px amber bar on the left edge. The rail's footer holds the role switch (for dual-role users), EN | SW, Help and Sign out. Content sits in a max-width 1040 px column, on a 12-column grid with 32 px padding.
- **768–1023 px:** keep the bottom nav, and use a 2-column content layout where it helps.
- Focus must never be hidden under the sticky header or bottom nav (WCAG 2.4.11): set `scroll-padding-top` and `scroll-padding-bottom` to the bar heights.

**Proposed items per role (confirmed in step 2's screen inventory):**

| Role | Items (V7) | Items (from V8) |
| --- | --- | --- |
| Fundi | Home · Verifications · Profile | Home · Jobs · Verifications · Profile ("Jobs" holds "Near you" and "My responses" as two tabs; "Where I work" and Pay-to live under Profile) |
| Client | — | Home (my Jobs) · Post a job · Find a fundi · Profile |
| Expert | Queue · History · Profile | same |
| Admin | plain shadcn: Ops · Reports · Jobs · Experts | same |

A role bar never shows an item for a feature that isn't shipped ("Nothing looks live that isn't").

**Role switch (users with two or more roles, US-8.18).**

- It lives in the **avatar sheet** (D-57), and only when the User holds two or more roles. With one role, the sheet shows no switch and no greyed-out roles.
- It is a list of radio rows, each 56 px tall, showing only the roles held: "Fundi dashboard", "Client dashboard", "Expert dashboard", "Admin". The current role has a filled ● and the word "Current". Selecting another role calls `users.setDashboardPref`, closes the sheet and opens that role's home. A pending state reads "Switching…".
- The header role label always names the current dashboard, so a dual-role User can tell where they are without opening the sheet.
- The switch never implies a role can be *chosen*: roles are derived (ADR-18). Offers to add a role ("I also need a fundi") go to `/onboarding`, never into the switcher.
- On desktop the same radio list sits in the rail footer.

**Sheets (avatar sheet, menu sheet, and the Add video sheet in step 2):** bottom sheets on mobile (a 4 px top radius, a drag handle **and** a 48 px "Close" button, because dragging needs a non-drag alternative under WCAG 2.5.7) and anchored popovers on desktop. The **menu sheet** holds EN | SW (a 2-segment 48 px control), Help, links to the public site (Jobs, Trades, Evidence, Company) and Sign out. **Help sits in the same place on every role** (WCAG 3.2.6).

### D3. Density rules for data views

The target is **"daily app, balanced"**: denser than the landing pages, never a cockpit.

1. **Rows before cards.** A list of more than 3 similar items (queue items, Assessments, notices, my responses) is a list of **hairline-divided rows**, not cards. Cards are only for entities with their own actions: Job cards, response cards and the Listing status card.
2. **Row anatomy:** at least 56 px tall (at least 48 px for single-line rows). Line 1: the row title in 16 px/600, clamped to 2 lines. Line 2: mono meta in 12 px `--dim` (for example "ELECTRICAL · RUIRU · 2 H AGO"). On the right: **one** status chip (D4) **or** one chevron, never both plus a button. The whole row is the tap target.
3. **Actions.** At 360 px, at most **two primary actions** per card (review S6); anything else goes in a secondary row below or in the detail view. Card actions are secondary (outlined) pills. **At most one amber fill per viewport**, reserved for the screen's single most important action ("Add video", "Post a job", the Hire confirm sheet's "Hire").
4. **Spacing:** an 8 px grid. Gutters are 16 px (mobile), 24 px (768 px) and 32 px (desktop). Sections are 32 px apart on mobile and 48 px on desktop (not the landing page's 120 px). The panel padding is 16 px on mobile and 24 px on desktop.
5. **Numbers:** every figure uses `tabular-nums`. Money is formatted per D8. Relative times ("2 h ago", "Posted 3 d ago") are computed **in the browser** from stored times (queries never read the clock), and their `title` or long-press shows the absolute date ("25 Sep 2026, 14:05"). Dates are written `25 Sep 2026`.
6. **Counts:** only the counters in spec §13 rule 7 exist:
   - the Job response bucket;
   - the owner's exact response count and "N new responses";
   - the bell's unread count;
   - the Expert's queue count by Trade;
   - the Admin tiles.

   There are no other totals, "N results", views, progress percentages, completeness percentages or streaks. **Profile completeness is a checklist of named missing fields, never a percentage or a ring** (V7 grill 4).
7. **Tables:** below 768 px, a table becomes stacked readout rows (mono label, then value). From 1024 px, Admin tables may use shadcn tables with a sticky header. There is never horizontal scroll at 360 px.
8. **Lists:** 24 items per page with a "Show more" pill (never infinite scroll). Near-me lists are **one-shot**, capped at 60, with "Showing the 60 nearest", an "Updated 14:05" readout and a **Refresh** button. They are not live subscriptions (review S11).
9. **Kiswahili length:** allow about 30% more text. Chips and labels wrap to a second line rather than truncate, and no label is ever cut off with an ellipsis. Every step-3 prompt draws one Kiswahili frame at 360 px.
10. **Above the fold at 360 px** follows spec §5.3 per role.

### D4. Status chips (Assessment, Job, Interest, Listing)

**Look:** a neutral chip, 28 px tall inside a 48 px hit area when tappable. It has a 1 px `--line` outline, a 4 px radius, mono 12 px text, 0.08em tracking, `--text` label and a glyph drawn as a 12 px SVG in `--text`. **Never amber, never green or red, never filled with colour, and never colour alone.** ✓ is reserved for Badges and never appears in a chip. The chip is keyed on the **status only**, so for example `awaiting_review` renders identically for every Verdict (D-50, spec §17 #40).

**The 8-glyph set:**

| Glyph | Meaning | Used for |
| --- | --- | --- |
| ◌ | With the system | Assessment `queued`, `analyzing` (static; **never spins or pulses**, no fake progress) |
| ◐ | Waiting for a person | Assessment `awaiting_review`, `appealed`; Interest `active` |
| ● | Open or visible | Job `open`; Listing Listed |
| ◆ | Shortlisted | Job `shortlisted`; Interest `shortlisted` |
| ■ | Settled | Assessment `approved`; Job `hired`, `done`; Interest `hired` |
| ↻ | Needs a new try | Assessment `reshoot`; Job `expired` |
| ○ | Not active | Job `draft`, `cancelled`; Assessment `rejected`; Interest `not_chosen`, `withdrawn`, `released`, `closed`; Listing off |
| ✕ | Stopped by an error or by Smart Fundis | Assessment `failed`; Job `removed`; Interest `removed`; Listing hidden |

The existing `--review` rule (◐ in amber, `DESIGN.md` tokens) applies to the landing pages only. **On dashboards ◐ is neutral** (spec §13: only the Badge uses ✓ or amber).

**Chip labels** (EN / SW draft, native-speaker check R-20). The copy keys are defined in step 2, in both `en.json` and `sw.json`.

| Entity | Status | EN | SW draft (R-20) |
| --- | --- | --- | --- |
| Assessment | `queued` | In line | Kwenye foleni |
| | `analyzing` | AI checking | AI inakagua |
| | `awaiting_review` | Awaiting expert review | Inasubiri ukaguzi wa mtaalamu |
| | `approved` | Approved | Imeidhinishwa |
| | `reshoot` | Record again | Rekodi tena |
| | `rejected` | Not approved | Haikuidhinishwa |
| | `appealed` | Appeal sent | Rufaa imetumwa |
| | `failed` | Error on our side | Hitilafu upande wetu |
| Job | `draft` | Draft | Rasimu |
| | `open` | Open | Wazi |
| | `shortlisted` | Shortlisted | Kwenye orodha fupi |
| | `hired` | Hired | Fundi ameajiriwa |
| | `done` | Done (auto-closed: "Done · closed after 30 days") | Imekamilika |
| | `expired` | Expired | Muda umeisha |
| | `cancelled` | Cancelled | Imeghairiwa |
| | `removed` | Removed by Smart Fundis | Imeondolewa na Smart Fundis |
| Interest (US-8.25) | `active` | Sent | Imetumwa |
| | `shortlisted` | Shortlisted | Kwenye orodha fupi |
| | `hired` | Hired | Umeajiriwa |
| | `not_chosen` | The client chose another fundi | Mteja amechagua fundi mwingine |
| | `withdrawn` | You withdrew | Umejiondoa |
| | `released` | Hire released | Ajira imesitishwa |
| | `closed` | Job closed | Kazi imefungwa |
| | `removed` | Removed by Smart Fundis | Imeondolewa na Smart Fundis |
| Listing (US-7.12) | Listed with a Badge | Listed | Unaonekana |
| | Listed, no Badge | Listed · Not yet verified | Unaonekana · Bado hujathibitishwa |
| | `listing_off` | Not showing | Huonekani |
| | `hidden_by_admin` | Hidden by Smart Fundis | Umefichwa na Smart Fundis |

**Rules:**
- The Fundi never sees a Verdict word, a score or a safety hint in a chip or anywhere near one before the decision (D-50).
- "Not yet verified" stays plain dim text on cards (the §13 tag table); the Listing chip above is only for the Fundi's own status card.
- A `rejected` chip is neutral ○ ("Not approved"), never ✕, which is kept for system errors and Admin removals.
- The status line under a chip carries the explanation (for example spec §11.0's "The AI is watching your video"). The chip is the short form.

**Tag table (spec §13, copied here as the review asked).** Tags label *who or what* something is, while chips give its status. The two must never look alike.

| Tag | Look | EN / SW | Where |
| --- | --- | --- | --- |
| **Badge** | white ✓ with the amber tick | "Verified by Smart Fundis — <Trade>: <Task>" | Badge lines only |
| **Expert** | solid 1 px white outline with the scan-eye icon | "Expert verifier · <Trade>" | Expert verifiers only |
| **Pro** (from V11) | dashed outline, receipt icon, the word PAID; a 48 px button | "FUNDI PRO · PAID" / "FUNDI PRO · AMELIPIA" | Pro results and `/f/[id]` |
| **Demo** | dim outline | "DEMO: NOT A REAL JOB" (Jobs), "Demo" (profiles) | Demo rows |
| **Test mode** (from V11) | full-width banner | "Test mode — no real money" | every payment surface in sandbox |
| **Not yet verified** | plain dim text, no outline | "Not yet verified in <Trade>" | unverified rows |
| **Error** | ✕ with text | the reason in words | failed states |
| **AI** | 1 px `--line` box around the mono word "AI" | "AI suggestion" / "The AI noticed…" | AI evidence only (D5) |
| **Status chip** | neutral outline plus one glyph (above) | the status in words | Job, Interest, Assessment and Listing statuses |

### D5. The AI evidence pattern

This pattern shows Cosmos Reason 2 Observations and Nemotron feedback **as evidence for a human, never as a result**. The per-audience rules come from spec §11.0–§11.1, D-50, D-51 and **D-59** (which supersedes D-52; the spec is being updated to match).

**Fixed rules (every surface):**
1. **Always labelled as AI output.** Every AI block opens with the **AI tag** and the words "AI suggestion" (feedback, Verdict) or "The AI noticed…" (Observations). Never "AI verified", "AI result", "AI score" or "AI approved".
2. **Always says who decides.** Fundi-facing and public-facing AI blocks carry the line **"An Expert decides."** In Expert review, and only there, the line is the spec's **"AI suggestion — you decide"** (D-60).
3. **Never a score as a verdict.** There is no `confidence` number, percentage, bar, gauge, ring, star or colour scale anywhere. An Expert sees the AI's Verdict **as words only** ("AI suggests: needs review") inside the AI panel, never as a chip, never with ✓, never in amber, and never before one full playback (D-51). A Fundi never sees the Verdict word at all.
4. **Never NVIDIA branding as ours.** There is no NVIDIA logo, NVIDIA green, "Powered by NVIDIA", "Cosmos" or "Nemotron" in the UI. The model names appear only in plain text on the project card (US-6.3) and `/telemetry`. The only model hint on a dashboard is "Checked with the backup model" (Expert, when `fallbackModel` is true). A Badge is never next to any NVIDIA mark.
5. **Visual separation.** AI blocks sit in their own panel: 1 px `--line` border, **no fill change, no amber, no ✓, no dashed outline** (dashed means Pro). Human content (the Expert's note, the Expert's decision) is always **above** the AI panel and heavier (16 px/600 label "EXPERT'S NOTE").

**Parts:**

- **Observation row** (Expert review, one per Rubric item; safety items first, each with a mono "SAFETY" tag):
  - The Rubric item text in 16 px.
  - The AI's answer in words: "AI: yes", "AI: no" or **"The AI couldn't tell"** (`unclear`). Each is a word, not a glyph and not a colour. "No" and "couldn't tell" look different from each other (NF §3).
  - The **evidence text**: the AI's one-line evidence in 16 px `--text`, set as a quotation from the AI (preceded by the AI tag) and clamped to 2 lines with "More".
  - The **timestamp chip** on the right (below on very narrow rows).
- **Timestamp chip:** mono 12–14 px tabular, whole seconds, `m:ss` (`h:mm:ss` past an hour), in a 48 × 48 px minimum hit area. Three states:
  - **Plain text** (the V7 default, until the eval confirms timestamp reliability without a frame overlay, NF §1.1): no border, not a button.
  - **Jump** (after the eval passes): a 1 px outlined button with a ▸ glyph and `aria-label` "Jump to 0:42".
  - **Missing:** "--:--" with the accessible label "no timestamp". It is never a fake `0:00`.
- **Jump-to-moment:** tapping a Jump chip seeks the player to `timestampS` and plays. At 360 px the player is **sticky at the top** of the review (16:9, full width) so the jump is visible without scrolling. An `aria-live="polite"` message says "Playing from 0:42". While the playhead is within ±1 s of a chip's time, that chip is drawn in its current state (a white fill with graphite text, **not amber**). Jumping never counts toward the full-playback gate (V7 grill 2 decides the exact rule).
- **Liveness block** (Expert only): "CODE SHOWN · 482", "AI READ · 482" (or "not readable"), "CHECK · yes / unclear". A mismatch is a reason to look, never an automatic reject.
- **Locked AI suggestion panel** (Expert, before full playback, D-51): a lock line icon and the line "Watch the whole video to see the AI suggestion." **No blurred or skeleton preview of the hidden content**, because its shape could hint at the Verdict.
- **Unlocked AI suggestion panel** (Expert, after playback): the AI tag, "AI suggestion — you decide", "AI suggests: <verdict in words>", then strengths and gaps as plain lists, and "Checked with the backup model" when it applies. The decision buttons (Approve / Reshoot / Reject, with a note required on the last two) sit **outside and below** the AI panel.
- **The Fundi's view after the Expert decides** (D-59 as amended by D-61; the same on `approved`, `reshoot` and `rejected`), top to bottom:
  - On `approved`, the Badge line first.
  - The Expert's note.
  - The **feedback panel**: the AI tag, "AI suggestion", **"An Expert decides."**, strengths, gaps, and the feedback paragraph in the UI language. If `feedbackSw` hasn't passed the R-20 check, the English feedback shows with "Kiswahili version coming".
  - The **"The AI noticed…" panel**: the AI tag, **"An Expert decides."**, then one Observation row per Rubric item, each with the item text and the AI's answer in words ("AI: yes", "AI: no", "The AI couldn't tell") in the UI language, and the evidence text, which stays **English in both languages** under a small dim label **"AI note in English"** (SW draft "Maelezo ya AI kwa Kiingereza", R-20; a named D-29 exception). The Liveness code never appears in the evidence (redacted server-side). **No timestamps** until the timestamp-reliability eval passes (NF §1.1); after that, the whole-second timestamp as plain text (or "--:--", labelled "no timestamp"). There are **no Jump chips**, because the Fundi has no player of their own video yet (no `videoUrl`) until the Architect decides otherwise.
  - Safety items are listed first and read "needs a closer look", never as an accusation.
  - **On `approved`, the copy is pending `rai-reviewer`** (D-61): framed as practice notes, never as doubt about the Badge. Mock it with placeholder copy marked "PENDING RAI".
  - Still never shown: a Verdict word, `confidence`, `videoUrl`, the `livenessRead` digits or a model name.
- **Before the decision (Fundi):** **no AI evidence at all.** Only the chip and the line "Awaiting expert review" (D-50), plus "Taking longer than usual — you don't need to do anything" when the pipeline is slow.
- **While `analyzing`:** "The AI is watching your video". No progress bar, percentage, countdown or animated glyph.

### D6. Location and map rules

**There is no map in V2** (D-60, D-36, spec §7.2 and §7.6). Location is always text plus a distance band, and "Jobs near me" and "find a Fundi" are lists only. Part A is the rule.

**A. The rule (lists and bands):**
- Location is always shown as **text**: "KIAMBU · RUIRU" (county · ward or area). Distance is a **band** chip: "Within 2 km", "2–5 km", "5–10 km", "10–25 km", "25–50 km", "Over 50 km" or "In <County>". Nothing below 2 km, no exact km, no pin, no coordinates, no "you are here" dot.
- A Job's band comes from its ward centroid (D-55). A Fundi picking a spot sees "Pick your usual work spot, not your home" and, after locating, "Near <ward>" with "Change".
- The near-me control shows the §7.2 geolocation states, the consent line (§7.6 rule 6, EN + SW) before the first ask, "Finding your area…" (never a page-blocking spinner), and a **Refresh** button.

**B. Post-V9 option (rejected for V2, D-60) — never drawn in V2 prompts:**
- **Never an exact pin for a Fundi.** Each Fundi or Job is an **approximate-area circle** at least 1.5 km in radius, centred on the **ward centroid** (public data), never on the stored snapped point, so no point leaves the server. The circle has a 1 px `--text` outline at 40% and a 6% fill. There is no amber, no pulsing and no clustering count badge.
- **County and area text is always shown too:** in the list, in the circle's callout ("KIAMBU · RUIRU · 2–5 km") and in the map's text alternative.
- **The list is the default and stays primary.** The map is an optional "List | Map" toggle. Every map item is also in the list, so the map can be `aria-hidden` with the list as its equivalent, and nothing needs dragging (WCAG 2.5.7).
- **Slow networks get a static image.** When `navigator.connection.saveData` is true, `effectiveType` is `2g` or `slow-2g`, or the map script hasn't loaded in 4 s, show a static WebP map image (360 × 200, under 30 KB, the same circles, no pin) with the text list below it. The interactive map is lazy-loaded outside the 150 KB route budget.
- The map style is monochrome graphite with no coloured parks, water or brand POIs. Tile attribution is visible. Never use `tile.openstreetmap.org` in production (KR I-7).

### D7. English and Kiswahili

- Every user-visible string on these screens has a key in **both** `messages/en.json` and `messages/sw.json` (D-29). No screen says "English only". The earlier prompts that do say so (00, 13, 14, 15) are fixed in step 3.
- Every Kiswahili string is a **draft until a native speaker checks it** (R-20). Consent strings need that sign-off before V8 merges. Prompts mark each one "SW draft (R-20)".
- The EN | SW toggle is in the menu sheet (mobile) and the desktop header (D-57). Switching keeps the user on the same screen and in the same state.
- Layouts must survive Kiswahili length (D3 item 9). Kiswahili tags and chips use 0.08em tracking rather than 0.26em.
- AI feedback in Kiswahili (`feedbackSw`) shows only after the R-20 check. Until then, the English feedback shows with "Kiswahili version coming" (spec §11.0).

### D8. Price labels

Every price has an owner, and the owner's label sits **in the same block as the figure** (never only in a tooltip or behind an info icon).

| Price | Label (EN / SW draft, R-20) | Where |
| --- | --- | --- |
| Rates (Fundi) | "Set by the fundi — not verified" / "Imewekwa na fundi — haijathibitishwa", plus the date set | public profile, "My public profile" |
| Budget (Client) | "Budget set by the client" / "Bajeti imewekwa na mteja" | Job card, Job detail, post-a-Job review step |
| Pay-to details (Fundi, after hire only) | "Pay to: set by the fundi — Smart Fundis doesn't check this number or handle this payment. M-Pesa shows the account name before you confirm: check it's <display name>." (spec §9.2, SW in the spec) | the hiring Client's Job view only |
| Fundi Pro fee (V11) | "Smart Fundis subscription", plus the Test mode banner in sandbox | the Spec B pay sheet only |

**Rules:**
- Money is formatted `KSh 3,000`, and ranges use an en dash: `KSh 2,000–4,000`. Figures use tabular numbers.
- **A price is never styled as a headline.** It uses the row's body size (16 px, weight 500), never display size, never amber and never the largest thing on a card.
- A Job with no budget shows the dim text "No budget given" (proposed copy). The label stays with the figure at 360 px, on its own line under it if needed.
- **Never** an average, "typical price", "from KSh", "best value", "cheapest", a comparison or a sort by price (ADR-26). The only price control is the `/jobs` filter "Budget at least KSh X", whose readout says that Jobs without a budget are hidden.
- Pay-to details are never on a card, a public page or a query result. The "Show pay-to details" action is a logged reveal.
- Payment buttons are text plus a generic line icon: **no M-Pesa or WhatsApp logo, no green.**

### D9. Empty, loading, error and offline states

Every list, card, tile and reason code has all four states drawn (review S4). **None of them uses an image.**

- **Loading:** a skeleton that matches the final layout (row heights, chip slots, card blocks) in `--panel` with 1 px hairline bars. A slow grey shimmer that is off under reduced motion, and **never amber**. The skeleton appears only after 300 ms, to avoid a flash. **Never a page-blocking spinner.** A button that is working shows its verb in the pending form ("Saving…", "Switching…", "Sending…") with `aria-busy`, and keeps its size.
- **Empty:** a bordered readout panel (no photo, no illustration) with:
  - a mono tag in `--dim` ("NOTHING HERE YET");
  - one plain sentence saying why it's empty;
  - **one** next action.

  Empty states are drawn in three variants:
  - **first use**, for example "No verifications yet. Record a video to earn your first badge." with "Add video";
  - **filtered empty**, for example "No jobs match these filters." with "Show all trades";
  - **nothing near**, for example "No open jobs near Ruiru right now." with "Widen to 25 km" or "Set where you work".

  Never fake or placeholder activity, and never "Be the first!" hype.
- **Error:** a bordered readout panel with the ✕ glyph and the mono tag "COULDN'T LOAD", the reason in plain words ("We couldn't load your jobs. Check your connection and try again."), and a secondary "Try again" pill. No red. A system error never blames the user. A failure in one tile or card stays inside that tile while the rest of the page works. **Field errors** sit under the field in 14 px `--text` with ✕, linked by `aria-describedby`. The field keeps its value, and nothing already entered is lost (WCAG 3.3.7).
- **Offline:** a 40 px strip under the header with the ✕ glyph: "You're offline. Showing what loaded at 14:05." Data already on screen stays visible with that timestamp. **Actions that need the server are disabled with the reason in words** ("Needs a connection"), never queued silently and never shown as done. When the connection returns, the strip reads "Back online" for 3 s and then goes away. An upload in progress shows "Paused — waiting for a connection" only if it really resumes. Otherwise it says "Upload stopped — try again when you're online".
- **Slow pipeline:** "Taking longer than usual — you don't need to do anything" (spec §11.1).
- **Status changes** (a chip changes, a list refreshes, a role switch finishes) are announced through an `aria-live="polite"` region, and errors through `role="alert"`.
- **Nothing looks live that isn't:** no "LIVE", "ONLINE" or "ACTIVE NOW" labels, no pulsing dots, no real-time counters. One-shot lists show "Updated 14:05".

### D10. DASHBOARD RULES (REQUIRED) — paste into every dashboard prompt

- App mode: graphite `#050609`, panels `#0B0D12`, hairlines `rgba(242,244,247,.10)`, text `#f2f4f7`, dim `rgba(242,244,247,.55)`. Amber `#ef9a57` only for the one primary pill per viewport, the active nav bar, the focus ring and the Badge tick. No grain, no WebGL, no shimmer in amber.
- 360 px first. Tap targets at least 48 px. Mono at least 12 px. No horizontal scroll.
- **No images of any kind** (no photos, illustrations or decorative art). User content only, marked EXAMPLE in mockups.
- Status chips: a neutral outline plus one glyph from ◌ ◐ ● ◆ ■ ↻ ○ ✕, with the status in words. Never colour alone. ✓ and amber belong to Badges only.
- AI output: the AI tag, "AI suggestion" or "The AI noticed…", and "An Expert decides." ("AI suggestion — you decide" on Expert review only). No score, percentage, gauge or Verdict chip. No NVIDIA logo, green or model names. The Fundi sees AI evidence only after the Expert decides; the evidence text stays English under "AI note in English", and the Fundi sees no timestamps until the timestamp eval passes (D-50, D-59, D-61).
- Location is text plus a distance band. No map, pin or km figure (D-60).
- Every price carries its owner's label: "Set by the fundi — not verified" or "Budget set by the client".
- Draw the empty, loading, error and offline frames, plus **one Kiswahili frame at 360 px**. Every string has an `en.json` and a `sw.json` key, and Kiswahili is marked for a native-speaker check (R-20).
- Never "certified", "vetted", "trusted", "top", "recommended", "best", "premium" or "AI verified". Always "Verified by Smart Fundis". No counters beyond spec §13 rule 7. Nothing that looks live when it isn't.

### D11. Open questions from this section (for the operator and the Architect)

- **Q1 — A map vs "no map". Resolved (D-60):** no map in V2. "Jobs near me" and "find a Fundi" are lists with distance bands, and D6 part B is a post-V9 option only.
- **Q2 — Is a static map image an "image on a dashboard"? Resolved (moot, D-60):** there is no map in V2.
- **Q3 — "An Expert decides" vs "AI suggestion — you decide". Resolved (D-60):** "AI suggestion — you decide" on Expert review only, and "An Expert decides." everywhere else.
- **Q4 — Jump-to-moment timing.** The brief asks for jump-to-moment. The spec and V7-8 ship the chip as **plain text** until the timestamp-reliability eval passes (NF §1.1). The pattern above draws both states. Confirm that step 3 mockups show the plain-text state as the V7 default.
- **Q5 — AI evidence for the Fundi. Resolved (D-59, supersedes D-52; amended by D-61, which makes the evidence English-only, hides timestamps until the eval passes and sends the approved-state copy to RAI review):** after every decision (approved, reshoot or rejected), the Fundi sees "The AI noticed…" with evidence text and plain-text timestamps, below the Expert's note. Before the decision, nothing changes (D-50).
- **Q6 — Role-bar items** in D2 are proposals. Confirm them in step 2.
- **Q7 — Kiswahili chip labels** in D4 are drafts that need the R-20 check. `web/messages/sw.json` doesn't exist yet (D-29 adds it).
