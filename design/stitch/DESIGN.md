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
