# Smart Fundis — Find a Fundi (client discovery) design

- **Status:** operator-reviewed, 26 Sep 2026. Operator decisions OD-1 to OD-4 and the answers to Q-1 to Q-7 (§16) are binding.
- **Slice:** V6, "Find a Fundi" (`planning/slices/V6.md`, spec issue #31). The discovery core (V6-1 projection, V6-2 `/fundis`, V6-3 `/trades`, V6-8 Demo Listings) runs **right after V1, before the V5 demo**. The rest of V6 follows (D-27).
- **Extends:** `docs/superpowers/specs/2026-09-25-architecture-design.md` (the "architecture spec"). Every change to an earlier rule is listed in §14 and recorded as D-18 to D-28 in `planning/DECISIONS.md`.
- **ADRs:** ADR-20 (public Portfolio separate from Assessment video), ADR-21 (opt-in contact, revealed on tap), ADR-22 (Listings are a derived projection; every listed Fundi appears, verification is shown, not required).
- **Glossary:** `CONTEXT.md`, with the new terms **Listing**, **Not yet verified**, **Expert verifier mark**, **Portfolio item**, **Portfolio publish consent**, **Showcase**, **Rates**, **Contact reveal** and **Report**.
- **Package manager:** pnpm (D-12). Every command in this spec is `pnpm …` / `pnpm exec …` / `pnpm dlx …`.

---

## 1. Problem

A Client in Kenya who needs a mechanic in Ruiru or a braider in Kisumu has no trustworthy place to look. The MVP proves skills (the Badge) but gives the Client almost nothing to act on: the public profile hides the phone, shows no photos of real work, lists only verified Fundis in two Trades, and has no way to narrow by place or Trade. A Fundi who cannot be found or reached earns nothing from being on Smart Fundis.

## 2. Solution

A Client, with no account, goes **`/trades` → `/fundis?trade=&county=&area=&verified=1` → `/f/[id]`**:

1. **`/trades`** becomes the Client's way in: every Trade with a real photo and a "Find a fundi →" link. "Verify now" stays as the secondary Fundi action on Trades that have a Rubric.
2. **`/fundis`** shows a grid of **Fundi cards** for **every Listed Fundi** (§5), filtered by Trade, county (all 47) and free-text area. **Verified Fundis come first**, and a **"Verified only"** chip hides the rest. Unverified Fundis carry a plain, neutral **"Not yet verified"** label.
3. **`/f/[id]`** is the full profile: skill Badges (verified work) and the **Expert verifier** mark if they have them, **Recent work** from the Fundi's opt-in **Portfolio** (photos and videos, "Not verified"), **Showcase links**, opted-in LinkedIn/CV/portfolio links, self-declared **Rates**, and, only if the Fundi opted in, **Call** and **WhatsApp** buttons that reveal the number on tap.

The Fundi controls all of it from a new **"My public profile"** editor on the Fundi dashboard (`/fundi/profile`, behind the existing `/fundi` sign-in guard).

### Operator decisions (2026-09-26, binding)

| # | Decision |
| --- | --- |
| OD-1 | **Videos: opt-in Portfolio.** A Fundi uploads separate work-showcase photos and videos and marks each one public. **Assessment videos stay private** (the verification consent promise). YouTube/TikTok links show as "Showcase — not verified" (ADR-7). Only verified work carries the Badge. |
| OD-2 | **Contact: opt-in.** "Show my phone to clients". On: Call + WhatsApp buttons with tap-to-reveal. Off: no contact button at all. No Client account. |
| OD-3 | **Location:** county (all 47) + free-text area/estate, plus Trade. No maps and no geohash (ADR-6 stays post-MVP). |
| OD-4 | **Timing:** design now; build after V1. Demo seed profiles are tagged Demo per the `isDemo` rule. |
| Q-1 | **All Fundis appear** (listing on, not hidden). "Verified should have badges. Experts have badges." Verified first, a "Verified only" chip, a neutral "Not yet verified" label, and a distinct **Expert verifier · <Trade>** mark. |
| Q-2 | The Portfolio publish consent is **bilingual** (English and Kiswahili). |
| Q-4 | LinkedIn, CV and personal-portfolio links are public **only with a per-link opt-in**, with a warning when switched on. |
| Q-7 | The discovery core (projection, `/fundis`, `/trades`, Demo Listings) comes **right after V1, before the V5 demo**. |
| Q-3, Q-5, Q-6 | No Turnstile in V6 (a logged risk); index real profiles, `noindex` Demo ones; a Fundi disputes an Admin hide by email to **info@smartfundis.com**. |

---

## 3. User stories

IDs continue the PRD scheme under a new group 7.

| ID | Story | Acceptance criteria (checked by QA) |
| --- | --- | --- |
| US-7.1 | As a **Client**, I want to start from the Trade I need, so I don't have to know how the site works. | `/trades` shows all 12 Trades with a photo, each with "Find a fundi →" to `/fundis?trade=<slug>`. Trades with a Rubric also show "Verify now" (a Fundi action, secondary). Trades without one show the readout "Verification coming soon". A legend explains the **Verified** Badge, the **Expert verifier** mark and **Not yet verified**. No counts of fundis anywhere. |
| US-7.2 | As a **Client**, I want to filter by Trade, county and area, so I see fundis near me. | `/fundis` has a Trade select (all 12 Trades + "All trades"), a county select with all 47 counties + "All Kenya", a free-text area field, and a **"Verified only"** chip. The filters are in the URL (`?trade=&county=&area=&verified=1`), so a link can be shared. No account needed. |
| US-7.3 | As a **Client**, I want a grid of cards, so I can compare fundis quickly. | Each card shows only the card fields in §6.1. Verified Fundis first. No phone, no rates, no bio on a card. 24 cards per page, then "Show more". An empty result shows the "No fundis match yet" frame with "Clear area" / "All Kenya" / "Include not yet verified" suggestions. |
| US-7.4 | As a **Client**, I want the full profile after I tap a card, so I can decide. | `/f/[id]` shows the profile fields in §6.2. Unknown, unlisted or Admin-hidden ids return the not-found page. |
| US-7.5 | As a **Client**, I want to call or WhatsApp a fundi, so I can hire them. | If and only if the Fundi opted in: Call and WhatsApp buttons. The number is **not** in the page HTML or in any query result; only `contact.reveal` returns it, after a tap. Over the rate limit, the button says "Try again in a few minutes". If the Fundi opted out, there's no contact button and no placeholder implying one exists. |
| US-7.6 | As a **Client**, I want to see what is verified and what is not, so I'm not misled. | Skill Badges read "Verified by Smart Fundis — <Trade>: <Task> · <date>". A Fundi with no Badge (and no Expert mark) shows **"Not yet verified"** in neutral dim text: not amber, not a warning glyph, and no wording that suggests a failed or pending review. In a Trade filter, a Trade the Fundi declared without a Badge shows "Not yet verified in <Trade>". The Expert mark reads "Expert verifier · <Trade>". Every Portfolio item and link carries "Not verified" / "Showcase — not verified". Rates carry "Set by the fundi — not verified". Demo profiles carry "Demo: not a real verification". |
| US-7.7 | As a **Client**, I want to report a profile or a photo, so abuse gets removed. | A "Report" link on the profile and on each Portfolio item opens a short form (a reason + an optional note). Submitting shows "Thanks — an Admin will look at this". Rate limited. |
| US-7.8 | As a **Fundi**, I want to upload photos and videos of my work and choose which are public, so clients see what I do. | Upload a photo (≤ 5 MB, JPEG/PNG/WebP) or a video (≤ 50 MB, MP4/WebM/QuickTime). Items are **private by default**. Making an item public needs the bilingual Portfolio publish consent (§8.2) and the "people in this agreed" confirmation. At most 12 items, of which at most 4 videos. |
| US-7.9 | As a **Fundi**, I want to delete or unpublish any Portfolio item at any time, so I stay in control. | Unpublishing removes the item from `/f/[id]` immediately. Deleting removes the file(s) from storage and the row. Both work in any state, including hidden by an Admin. |
| US-7.10 | As a **Fundi**, I want to choose whether clients see my phone, so I decide who can call me. | "Show my phone to clients" switch, **off by default**. A second switch, "This number is on WhatsApp", is off by default and only enabled when the first is on. The switch is disabled with a hint if no valid Kenyan phone is on file. |
| US-7.11 | As a **Fundi**, I want to state my rates, so clients know roughly what I charge. | Up to 5 rate lines (label, amount in KSh, unit) plus an optional note. Shown with "Set by the fundi — not verified" and "Updated <date>". Can be cleared. |
| US-7.12 | As a **Fundi**, I want to preview my public profile and know whether I'm listed, so I know what clients see. | "My public profile" shows a live preview and the status: "Listed", "Listed · Not yet verified — record a video to earn a Badge", "You turned off Show my profile", or "Hidden by Smart Fundis: <reason>. Questions: info@smartfundis.com". |
| US-7.13 | As an **Admin**, I want a queue of reports, so I can act on abuse. | `/admin/reports` (plain shadcn) lists open reports newest first. Actions: dismiss, hide the Portfolio item, or hide the whole profile, each with a required reason and an `auditLog` row. Unhide is also available. |
| US-7.14 | As an **Expert**, I want nothing to change about review, so Portfolio never leaks into verification. | The Expert queue and review screens never show Portfolio items or links. Portfolio items are never sent to the AI service. |
| US-7.15 | As the **platform**, I want every privacy rule enforced on the server, so the UI can't be bypassed. | The `convex-test` suite in §12 passes. |
| US-7.16 | As a **Fundi**, I want to choose whether my LinkedIn, CV and portfolio links are public, so I don't leak personal details. | Each of the three links has its own "Show on my profile" switch, off by default. Switching the CV link on shows "CVs often include your home address. Remove it first." Only opted-in links are returned by `profiles.getPublic`. |
| US-7.17 | As a **Client**, I want to see which fundis are Experts, so I know who reviews others' work. | A Fundi who is an active Expert shows "Expert verifier · <Trade>" (one per approved Trade) on the card and profile, visually distinct from skill Badges. Never "certified". |

---

## 4. The browse flow

```
/trades                        /fundis?trade=electrical&county=kiambu&area=ruiru              /f/[id]
┌────────────────────┐        ┌─────────────────────────────────────────────────┐        ┌───────────────────────┐
│ ELECTRICAL   photo │──tap──▶│ [Trade ▾] [County ▾] [Area ____] (Verified only) │──tap──▶│ name · county/area    │
│ Find a fundi →     │        │ ┌card ✓┐ ┌card ✓┐ ┌card Expert┐ ┌card Not yet┐   │  card  │ Expert verifier mark  │
│ Verify now (fundi) │        │ verified first · Show more                       │        │ Badges / Not yet ver. │
│ MECHANIC     photo │        │ empty state: NO SIGNAL YET                       │        │ Call / WhatsApp*      │
│ Find a fundi →     │        └─────────────────────────────────────────────────┘        │ Rates (self-set)      │
│ Verification soon  │                                                                   │ Recent work · links   │
│ Legend: ✓ · Expert · Not yet verified                                                  │ Report                │
└────────────────────┘                                                                   └───────────────────────┘
* only if the Fundi opted in; number revealed on tap
```

- **Entry points:** header TRADES tab, footer "Find a fundi" (→ `/fundis`), landing hero "Find a fundi" (→ `/fundis`), landing trade tiles (→ `/fundis?trade=`).
- **The URL is the state.** `trade` is any of the 12 Trade slugs; `county` is one of the 47 county slugs; `area` is free text, trimmed, at most 60 characters; `verified=1` turns on the chip. Unknown values are dropped silently (the filter shows "All").
- **Trade filter** matches the Fundi's **declared** Trades and their **verified** Trades (the union). On a card in a Trade filter:
  - verified in that Trade → the Badge line "✓ <Trade>: <Task>"
  - an Expert in that Trade → "Expert verifier · <Trade>"
  - declared only → "Not yet verified in <Trade>"
- **Declaring Trades:** a Fundi may declare any of the 12 Trades in their profile. Only Trades with a Rubric can earn a Badge. Onboarding prompt 15 changes accordingly (§14).
- **"Verified" for sorting and the chip** means, for the filtered Trade (or any Trade when unfiltered): the Fundi holds a skill Badge **or** the Expert verifier mark there. An Admin approved the Expert for that Trade, so "Experts have badges" (operator, Q-1). The Expert mark stays a different label from a skill Badge.
- **Order** (default and with the chip):
  1. real Fundis verified in scope, newest Badge or Expert approval first
  2. Demo profiles
  3. real Fundis not yet verified, newest profile first
  The readout says "Verified first". When `area` is set, results come in search-relevance order instead (a Convex search-index constraint, §10) and the readout says "Best match for '<area>'". The chip still applies. There's no ranking, rating or "top fundi" language.
- **Rendering:** `/fundis` and `/f/[id]` server-render the first page with `preloadQuery` (shareable link, Lighthouse), then hydrate with `usePaginatedQuery` / `usePreloadedQuery`. The frontend confirms the current Convex and Next.js APIs in live docs first (AGENTS rule 2).
- **Indexing (Q-5):** real `/f/[id]` and `/fundis` pages are indexable. Demo profiles get `noindex`. The phone is never in HTML.

---

## 5. Who is listed

A Fundi is **Listed** when **all** of these hold:

1. a Fundi profile exists (the base role `fundi`, ADR-18),
2. `fundiProfiles.publicListing` is on (default on, spec §5),
3. `fundiProfiles.hiddenByAdmin` is unset.

**A Badge is no longer required** (operator Q-1, D-24, amends D-2). Verification is **shown, not required**. Only Listed Fundis appear on `/fundis`, and `/f/[id]` returns not found for anyone else. Demo profiles are Listed and carry the Demo tag everywhere.

**What stays true (D-1, AGENTS non-negotiable):** an AI `pass` without an Expert decision shows **nothing** about that Assessment in public: no Badge, no "pending", no "awaiting review". A Fundi whose only Assessment is awaiting review or was rejected looks exactly like one who never recorded: "Not yet verified". Rejections, reshoots and failures are never visible.

**Experts:** only Fundis are listed. An Expert who has no Fundi profile does not appear. A Fundi who is also an active Expert (`experts.active` and a non-empty `approvedTrades`) gets the **Expert verifier · <Trade>** mark, derived at sync time and never stored on the profile.

**Onboarding copy changes:** because a Fundi is public as soon as their profile is saved (with the listing default on), the visibility switch helper becomes "Clients can find you now. Badges appear once an Expert approves your video." (prompt 15, §14).

---

## 6. What a card shows vs what a profile shows

### 6.1 Card (in `listings.search` results)

| Shows | Never shows |
| --- | --- |
| Cover: the Fundi's chosen public Portfolio **photo**, else an initials tile (Demo profiles always use initials) | phone, WhatsApp flag, rates, bio, email |
| Display name | Portfolio videos, any links |
| County name · area | anything about an Assessment except its Badge line |
| Verification line, **one** of: up to 3 Badge lines "✓ <Trade>: <Task>" (+N more) · "Not yet verified" · (in a Trade filter) "Not yet verified in <Trade>" | counts of reviews, reveals or views |
| "Expert verifier · <Trade>" marks (up to 2, +N more), if any | "pending", "awaiting review", "rejected" |
| "Demo: not a real verification" when `isDemo` | "certified", ratings, stars, "top" |
| "View profile" | |

**Visual rules for the labels (for the designer and frontend):**
- **Skill Badge:** white ✓ glyph with text. Amber only on the verified tick (DESIGN.md).
- **Expert verifier mark:** a distinct outlined mono tag with its own line icon (for example a magnifier or seal), in `--text`, not amber, and never a ✓. It must not read as a second skill Badge.
- **Not yet verified:** plain dim mono text in `--dim`, with no icon, no amber, no ◐ and no warning colour. Same weight as the county line. It never says "unverified", "pending", "failed" or "not approved".

### 6.2 Profile (`/f/[id]`, from `profiles.getPublic`)

| Section | Content | Label |
| --- | --- | --- |
| Header | display name, county · area, years of experience, languages, bio | Demo tag if `isDemo` |
| **Expert verifier** | one mark per approved Trade: "Expert verifier · <Trade>", with the line "Approved by Smart Fundis to review <Trade> videos." | — |
| **Verified work** | every Badge: "Verified by Smart Fundis — <Trade>: <Task> · <date>". With no Badges: "Not yet verified" (neutral) | — |
| Trades | each declared Trade: verified → covered above; declared only → "<Trade> · Not yet verified" | neutral |
| **Contact** | Call and WhatsApp buttons, only if opted in; the number is revealed on tap (§8.1) | Under the buttons: "Smart Fundis verified only the tasks shown with ✓. Agree the price and the work directly with the fundi." (An unverified Fundi: "Smart Fundis has not verified this fundi's work yet. Agree the price and the work directly.") |
| **Rates** | up to 5 lines "<label> · KSh <amount> / <unit>" + note + "Updated <date>" | "Set by the fundi — not verified" |
| **Recent work** | public Portfolio items, newest first: photo or video (tap to play), caption, Trade, month of the work | each item: "Not verified" |
| **Showcase** | YouTube/TikTok links from `fundiProfiles.links`, embedded with `youtube-nocookie` / the TikTok embed, **tap to load** | "Showcase — not verified" |
| **Links** | LinkedIn, CV and portfolio links the Fundi opted in one by one (Q-4) | "From the fundi — not verified" |
| Report | "Report this profile" link; each Portfolio item has its own "Report" | — |

**Still never public:** email, Assessment videos, AI Observations/Verdict/feedback, any Assessment that isn't `approved` (and any sign that one exists), private Portfolio items, links that aren't opted in, and report and reveal data.

"Recent jobs" in the operator's request maps to **Recent work**: Portfolio items with an optional month. Smart Fundis has no bookings, so it cannot know about jobs; the Fundi shows them.

---

## 7. Honesty rules for this feature

1. **Four kinds of signal, never blurred.**
   - *Verified* = a skill Badge (an Expert-approved in-app Assessment).
   - *Expert verifier* = an Admin approved this person to review a Trade.
   - *Showcase* = YouTube/TikTok links and public Portfolio items.
   - *Self-declared* = Trades without a Badge, Rates and opted-in links.
   Only skill Badges use ✓, the words "Verified by Smart Fundis" and the amber tick.
2. **"Not yet verified" is neutral.** It states a fact about Smart Fundis, not a judgement of the Fundi. No warning colour, no amber, no glyph. It never implies a rejection, and rejected or pending Assessments are never shown.
3. **Verified first.** The default sort puts verified Fundis (Badge or Expert mark in scope) first, and the "Verified only" chip is one tap away. These, together with the label, are the mitigations for R-17.
4. **Rates are the Fundi's text.** Always "Set by the fundi — not verified", with the date. Smart Fundis never suggests, averages, compares or sorts by price. This is not an "earnings figure" under spec §7: that rule forbids Smart Fundis claiming what Fundis *will* earn, especially from the Co-op. Rates are a Fundi's own asking price.
5. **Nothing looks live that isn't.** No "Book now", "Pay with M-Pesa", "Message", "Reviews" or "Rating" controls anywhere. "Verification coming soon" on a Trade is a readout, not a control.
6. **Never "certified".** Not for skill Badges and not for Experts: "Expert verifier", never "certified assessor".
7. **No counters.** No "124 electricians in Nairobi", and no view or reveal counts shown to Clients.
8. **Demo is always tagged.** "Demo: not a real verification" goes on the card and the profile. Demo profiles have:
   - no phone (a made-up number could belong to a real person)
   - no Portfolio and no opted-in links (CONTEXT: no photo or video)
   - no Expert mark
   - sample Rates are allowed, and inherit the profile's Demo tag
9. **Copy stays English only** (AGENTS rule 5), except the Portfolio publish consent, which ships in English and Kiswahili like the verification consent (§8.2, D-21, and the proposed AGENTS diff in §14.1).

---

## 8. Privacy

### 8.1 Phone: opt-in and tap-to-reveal (ADR-21)

- **Source and default:** the number is `users.phone` (collected in onboarding, ADR-16), normalised to `+2547XXXXXXXX` / `+2541XXXXXXXX`. `fundiProfiles.contact` defaults to `{ showPhone: false, whatsapp: false }`.
- **The number is never in a query result:**
  - not in `listings.search`
  - not in `profiles.getPublic`, which returns only `contact.available` and `contact.whatsapp`
  - not in server-rendered HTML
  This holds for verified and unverified Fundis alike.
- **Reveal:** tapping Call or WhatsApp runs the mutation `contact.reveal({ fundiProfileId, channel, visitorKey })`. It:
  1. re-checks, from the source tables, that the Fundi is Listed and opted in
  2. applies the rate limits
  3. writes a `contactReveals` row
  4. returns the number

  The button then becomes a `tel:` link, or opens `https://wa.me/<digits>?text=<"Hi, I found you on Smart Fundis.">`.
- **Rate limits** (`@convex-dev/rate-limiter`, token bucket): 10 reveals an hour per `visitorKey` (capacity 5), and 100 reveals a day per Fundi. Over either limit, the mutation returns `{ ok: false, reason: "rate_limited" }` and the UI says "Try again in a few minutes".
- **What this does and doesn't do:**
  - It keeps the number out of HTML, list results and search-engine caches, and slows bulk harvesting.
  - It does **not** stop a determined scraper who rotates `visitorKey`: a random id the browser keeps in `localStorage`, because Convex sees no IP.
  - The per-Fundi cap bounds the damage. **No Turnstile in V6** (Q-3). This is logged as R-18, and adding Turnstile is the planned response if `contactReveals` shows bulk harvesting.
- **Reveal log:** each `contactReveals` row holds `fundiProfileId`, a SHA-256 of the `visitorKey`, the channel and the time. No IP and no user agent. A daily cron deletes rows older than 30 days. The log exists for rate-limit forensics and Admin abuse checks only. Clients never see it, and V6 doesn't show it to Fundis either.
- **The phone is self-declared.** It isn't OTP-verified in the MVP, and matters more now that unverified Fundis are listed. The mitigations are the report reason "Wrong or someone else's number" and Admin hide (R-15). OTP comes in the Pilot.

### 8.2 Portfolio: separate from Assessment video (ADR-20)

- **Separate table, separate storage objects, separate consent.** A Portfolio item is never an Assessment video, and an Assessment video can never become a Portfolio item: there is no "publish my verification video" button. The verification consent promise ("only the Badge becomes public") stays true.
- **Private by default.** Items upload with `public: false`. Only the owning Fundi and Admins can see private items.
- **Portfolio publish consent, in English and Kiswahili** (Q-2, D-21). It is shown the first time a Fundi makes an item public, and again when its version changes. English text below; the Kiswahili is drafted in V6-6 and checked by a human:
  - "This photo or video will be public on your Smart Fundis profile. Anyone can see it, and we can't stop people saving a copy."
  - "It is labelled 'Not verified'. Only a video recorded in the app for an Assessment earns a badge."
  - "Smart Fundis does not use it for AI training, AI checks or the Data Co-op."
  - "You can unpublish or delete it at any time."
  - A checkbox, required for each item: "Everyone who can be recognised in this photo or video agreed to it being public, and no children can be recognised."
  - Stored per item as `publishConsentVersion` and `publishedAt`.
- **Faces rule (D-22):**
  - The Fundi's **own** face is allowed.
  - **Other people** are allowed only with the per-item confirmation above.
  - **Children** must not be recognisable.
  - The upload screen advises "Best: show the work and your hands, not people's faces."
  - There is no automatic face detection.

  The reasoning:
  - *Why not ban faces outright:* hairdressing and beauty work *is* on a person's head and face, so a ban would make the Portfolio useless for one of the two live Trades. The Fundi's own face is their choice on their own showcase.
  - *Why not allow faces freely:* a braider's client never agreed to be on the internet. The confirmation puts the duty on the Fundi, who knows who is in the shot. The report reason "Shows someone without their consent" gives the person shown a way to object, and Admin hide acts on it.
  - *Why no AI face detection:* it would put a model in the path of user content we promised not to run AI on, add cost, and still miss cases.
  - The DESIGN.md "no identifiable faces" rule still governs **Smart Fundis' own imagery** (Stitch, Canva, placeholders), including every card and profile mockup.
- **Deletion:**
  - `portfolio.remove` deletes the storage file, the poster file and the row in one mutation, and writes an `auditLog` row.
  - Unpublishing takes effect immediately.
  - When `publicListing` turns off or an Admin hides the profile, every item disappears with the profile.
  - A Fundi account deletion (post-MVP) must also delete every Portfolio file.
- **Never to the AI.** Portfolio items are never sent to `/ai/claim`, never traced, never in the eval, and never Co-op data.
- **Public URLs:**
  - `profiles.getPublic` returns public items with `ctx.storage.getUrl()`, and `listings.search` does the same for the cover photo only. These URLs are public by design, unlike Assessment videos (spec §7).
  - After an unpublish or delete, the next query stops returning the URL.
  - A copied URL keeps working until the file is deleted. This is the same limitation as R-5, and the consent says so: "we can't stop people saving a copy".

### 8.3 Opt-in links (Q-4, D-26)

- `fundiProfiles.linksPublic = { linkedin: false, cv: false, portfolio: false }` by default. Each link has its own switch in "My public profile".
- Switching **CV** on first shows: "CVs often include your home address. Remove it first." with "Show my CV link" / "Cancel". LinkedIn and portfolio links get "Anyone will be able to open this link."
- YouTube and TikTok are unchanged: always shown if set, as "Showcase — not verified", tap to load.
- Links are shown as plain outbound links (`rel="noopener noreferrer nofollow"`), never embedded and never fetched by the server.

### 8.4 What is public, in one table

| Data | Card | Profile | Notes |
| --- | --- | --- | --- |
| Display name, county, area | yes | yes | every Listed Fundi, verified or not |
| Skill Badges | up to 3 | all | |
| "Not yet verified" (in <Trade>) | yes | yes | only when true; neutral |
| Expert verifier marks | up to 2 | all | derived from `experts` |
| Years, languages, bio, declared Trades | no | yes | |
| Cover photo | yes | yes (in Recent work) | a public Portfolio photo the Fundi chose |
| Public Portfolio items | no | yes | |
| Showcase links (YouTube/TikTok) | no | yes | tap to load |
| LinkedIn / CV / portfolio link | no | only if opted in, per link | |
| Rates | no | yes | self-declared label |
| Phone | no | **only via `contact.reveal`** | opt-in |
| Email, Assessment videos, AI output, non-approved Assessments, private items | no | no | |

---

## 9. Moderation and abuse

- **Report.** `reports.create({ fundiProfileId, portfolioItemId?, reason, note?, visitorKey })`.
  - Reasons: `fake_or_stolen_work`, `wrong_phone`, `shows_someone_without_consent`, `offensive`, `other`.
  - `note` is at most 280 characters.
  - Rate limit: 5 an hour per `visitorKey`.
  - No account needed.
- **Admin queue** `/admin/reports` (plain shadcn, like the other Admin screens): open reports newest first, grouped by profile, with a link to the item. Each action needs a reason and writes an `auditLog` row:
  - **dismiss**
  - **hide item** (sets `portfolioItems.hiddenByAdmin`)
  - **hide profile** (sets `fundiProfiles.hiddenByAdmin`, which removes the Listing)
  - **unhide**
- **What the Fundi sees:** "Hidden by Smart Fundis: <reason>. Questions: info@smartfundis.com" on the item or on the "My public profile" status.
  - They can delete or edit the item. A hidden item stays hidden until an Admin unhides it.
  - The dispute route is email to **info@smartfundis.com** (Q-6). There is no in-app appeal in V6.
- **Upload limits** (US-7.8) and caption limits (140 characters) bound storage abuse. The server checks type and size in the `_storage` system table and deletes invalid files, as V1 does for Assessments.
- **Listing unverified Fundis increases abuse exposure** (fake profiles, wrong numbers). The mitigations are Report, Admin hide, sign-in with a verified email (Clerk), the neutral label and verified-first sorting (R-15, R-17).

---

## 10. Data model changes (Convex)

The **convex** role owns the code and the Architect owns the shape. Every new field on an existing table is optional, so the schema deploys over V1/V3 data without a migration.

### 10.1 `fundiProfiles` (additions)

| Field | Type | Default / rule |
| --- | --- | --- |
| `county` | **tightened** to the 47-slug union `CountySlug` (`convex/lib/counties.ts`) | V3 onboarding writes a slug |
| `trades` | may now hold any of the 12 Trade slugs | only Trades with a Rubric can earn a Badge |
| `contact` | `{ showPhone: boolean, whatsapp: boolean }`, optional | absent means both false. `whatsapp` requires `showPhone` |
| `linksPublic` | `{ linkedin: boolean, cv: boolean, portfolio: boolean }`, optional | absent means all false |
| `rates` | `{ items: { label: string ≤ 40, amountKsh: int 1..10_000_000, unit: "job" \| "hour" \| "day" \| "item" \| "visit" }[] ≤ 5, note?: string ≤ 140, updatedAt: number }`, optional | absent means no Rates section |
| `coverItemId` | `Id<"portfolioItems">`, optional | must be the Fundi's own public, active **photo**. Cleared when that item is unpublished, hidden or deleted |
| `hiddenByAdmin` | `{ reason: string, byUserId: Id<"users">, at: number }`, optional | set means not Listed |

### 10.2 New table `portfolioItems`

| Field | Type |
| --- | --- |
| `fundiUserId` | `Id<"users">` |
| `kind` | `"photo" \| "video"` |
| `storageId` | `Id<"_storage">` |
| `posterStorageId` | `Id<"_storage">`, optional (video only; a JPEG frame made in the browser) |
| `contentType`, `sizeBytes` | copied from `_storage` at create time |
| `caption` | string ≤ 140 |
| `tradeSlug` | string, optional (one of the Fundi's declared Trades) |
| `workMonth` | string `YYYY-MM`, optional |
| `public` | boolean, default false |
| `publishConsentVersion`, `publishedAt` | optional; required when `public` is true |
| `peopleConsentConfirmed` | boolean; must be true to publish |
| `hiddenByAdmin` | `{ reason, byUserId, at }`, optional |

- **Indexes:** `by_fundi` `["fundiUserId"]`, `by_fundi_public` `["fundiUserId", "public"]`.
- **An item is public if and only if** `public === true`, `hiddenByAdmin` is unset, and the owner is Listed.
- **No `kind: "link"`:** YouTube/TikTok Showcase links and the three opt-in links stay in `fundiProfiles.links`. That keeps one place for links and means no migration of V3 data.

### 10.3 New table `listings`, the derived projection (ADR-22)

Each Listed Fundi gets one row per **scope**:
- one row per Trade in scope: the union of their declared Trades, the Trades they hold a Badge in, and their Expert Trades
- plus one row with `scope: "all"`

Rows exist **only** for Listed Fundis. The table is a cache of derived data, never a source of truth, and exactly one function rebuilds it.

| Field | Type |
| --- | --- |
| `fundiProfileId`, `fundiUserId` | ids |
| `scope` | a Trade slug, or `"all"` |
| `county` | `CountySlug` |
| `area` | display string |
| `searchText` | lowercased area + county name, for the search index |
| `displayName`, `initials` | strings |
| `coverStorageId` | `Id<"_storage">`, optional |
| `verified` | boolean: in this scope, the Fundi has a skill Badge **or** the Expert mark (for `"all"`: in any Trade) |
| `badges` | `{ tradeSlug, tradeName, taskName, approvedAt }[]`, at most 3, newest first, **for this scope** (all Trades for `"all"`) |
| `badgeCount` | number of skill Badges in this scope (for "+N more") |
| `isExpert` | boolean: an active `experts` row with a non-empty `approvedTrades` |
| `expertTrades` | `{ slug, name }[]`: the approved Trades (for a Trade scope, only that Trade if it is one) |
| `notYetVerifiedIn` | string or null: the Trade name when the scope is a Trade the Fundi declared but isn't verified in |
| `sortKey` | `tier × 10¹³ + t`. Tier 3 is a real Fundi verified in scope; tier 2 is Demo; tier 1 is a real Fundi not yet verified. `t` is the newest Badge `approvedAt` or Expert approval time for tiers 3 and 2, and the profile `_creationTime` for tier 1 |
| `isDemo` | boolean |

- **Indexes:** `by_scope_sort` `["scope", "sortKey"]`, `by_scope_county_sort` `["scope", "county", "sortKey"]`, `by_scope_verified_sort` `["scope", "verified", "sortKey"]`, `by_scope_county_verified_sort` `["scope", "county", "verified", "sortKey"]`, `by_fundiUser` `["fundiUserId"]`.
- **Search index:** `search_area` on `searchText`, with `filterFields: ["scope", "county", "verified"]`.
- **Queries:** read with `.order("desc")`.

**`syncListing(ctx, fundiUserId)`** is a plain helper in `convex/lib/listings.ts`. It runs inside the calling mutation, so it's transactional. It deletes the Fundi's rows and rewrites them from `users`, `fundiProfiles`, approved `assessments`, `experts`, `trades`, `rubrics` and `portfolioItems`. **Every** mutation that changes one of those inputs must call it:

| Caller | Why |
| --- | --- |
| Fundi profile creation (onboarding) | the Fundi becomes Listed |
| `reviews.decide` (approve), appeal decision, Admin override (to or from `approved`) | a Badge appears or disappears |
| profile edits (name, county, area, Trades), `profiles.setListing` | card fields, the Listed rule |
| Expert approval, Expert Trade change, Expert deactivation (V4) | the Expert mark |
| `moderation.hideProfile` / `unhideProfile` | the Listed rule |
| `portfolio.setPublic`, `portfolio.remove`, `moderation.hideItem`, `profiles.setCover` | the cover photo |
| `seed.demo` | Demo rows |

`profiles.getPublic` and `contact.reveal` do **not** trust the projection. They re-check the Listed rule, and derive Badges and Expert marks, from the source tables. So a stale row can at worst show a card that is out of date by one field, or whose profile returns not found.

A convex-test (§12) checks, after each caller above, that the projection equals a from-scratch recomputation. `listings.rebuildAll` (internal, run by an Admin) exists for repair.

### 10.4 New tables `contactReveals` and `reports`

| Table | Fields | Indexes |
| --- | --- | --- |
| `contactReveals` | fundiProfileId, visitorKeyHash, channel `call \| whatsapp`, at | `by_at`, `by_fundi_at` |
| `reports` | fundiProfileId, portfolioItemId?, reason, note?, visitorKeyHash, at, status `open \| dismissed \| actioned`, resolvedByUserId?, resolution?, resolvedAt? | `by_status_at`, `by_fundiProfile` |

### 10.5 Component

- **Install:** `@convex-dev/rate-limiter`, with `pnpm add @convex-dev/rate-limiter` at the repo root (D-11: `convex/` is not a workspace package).
- **Register** it in `convex/convex.config.ts` with `app.use(rateLimiter)`.
- **Limits:**
  - `contactRevealVisitor`: token bucket, 10 an hour, capacity 5
  - `contactRevealFundi`: fixed window, 100 a day
  - `reportVisitor`: fixed window, 5 an hour
- Verify the API against the component README at build time.

---

## 11. Contracts (TypeScript)

Every role codes against these shapes. `CountySlug` and `COUNTIES` (a slug and display name for all 47 counties) live in `convex/lib/counties.ts`, and `web/` imports them.

```ts
// ---- public, no auth ----------------------------------------------------
// listings.search  (query)
args: {
  trade?: string;            // any of the 12 Trade slugs; else ignored
  county?: CountySlug;
  area?: string;             // trimmed, 1..60 chars; empty = no text search
  verifiedOnly?: boolean;    // the "Verified only" chip
  paginationOpts: PaginationOptions; // numItems 24
}
returns: PaginationResult<ListingCard>;

type ListingCard = {
  fundiProfileId: Id<"fundiProfiles">;
  displayName: string;
  county: CountySlug;
  countyName: string;
  area: string | null;
  cover: { kind: "photo"; url: string } | { kind: "initials"; initials: string };
  verified: boolean;                                        // in scope: Badge or Expert mark
  badges: { tradeSlug: string; tradeName: string; taskName: string; approvedAt: number }[]; // ≤ 3, this scope
  moreBadges: number;
  expert: { trades: { slug: string; name: string }[] } | null; // "Expert verifier · <Trade>"
  notYetVerifiedIn: string | null;   // Trade name when scope is a declared-only Trade
  // UI rule: badges.length === 0 && !expert → "Not yet verified" (or "Not yet verified in <notYetVerifiedIn>")
  isDemo: boolean;
};

// profiles.getPublic  (query) — null → not found page
args: { fundiProfileId: Id<"fundiProfiles"> }
returns: PublicProfile | null;

type PublicProfile = {
  fundiProfileId: Id<"fundiProfiles">;
  displayName: string;
  county: CountySlug; countyName: string; area: string | null;
  yearsExp: number | null; languages: string[]; bio: string | null;
  isDemo: boolean;
  verified: boolean;                                       // ≥ 1 Badge or Expert mark
  badges: { tradeSlug: string; tradeName: string; taskSlug: string; taskName: string; approvedAt: number }[];
  expert: { trades: { slug: string; name: string }[] } | null;
  trades: { slug: string; name: string; verified: boolean }[]; // declared ∪ badge Trades
  contact: { available: false } | { available: true; whatsapp: boolean }; // NEVER the number
  rates: { items: RateItem[]; note: string | null; updatedAt: number } | null;
  recentWork: {
    id: Id<"portfolioItems">; kind: "photo" | "video";
    url: string; posterUrl: string | null;
    caption: string; tradeName: string | null; workMonth: string | null; publishedAt: number;
  }[];                                                    // public items only, newest first
  showcase: { kind: "youtube" | "tiktok"; url: string }[];
  links: { kind: "linkedin" | "cv" | "portfolio"; url: string }[]; // opted-in only
};
type RateItem = { label: string; amountKsh: number; unit: "job" | "hour" | "day" | "item" | "visit" };

// contact.reveal  (mutation)
args: { fundiProfileId: Id<"fundiProfiles">; channel: "call" | "whatsapp"; visitorKey: string /* uuid v4 */ }
returns:
  | { ok: true; phoneE164: string; display: string /* "0712 345 678" */ }
  | { ok: false; reason: "rate_limited" | "unavailable" };

// reports.create  (mutation)
args: {
  fundiProfileId: Id<"fundiProfiles">; portfolioItemId?: Id<"portfolioItems">;
  reason: "fake_or_stolen_work" | "wrong_phone" | "shows_someone_without_consent" | "offensive" | "other";
  note?: string; visitorKey: string;
}
returns: { ok: true } | { ok: false; reason: "rate_limited" };

// trades.listForDiscovery  (query) — /trades and the filter
returns: { slug: string; name: string; verifyNow: boolean }[];   // all 12

// ---- Fundi (requireFundi; always acts on the caller's own profile) ------
portfolio.generateUploadUrl()                       → string
portfolio.create({ storageId, kind, posterStorageId?, caption, tradeSlug?, workMonth? }) → Id<"portfolioItems">
  // validates _storage contentType/size; deletes the file(s) and throws on failure; enforces 12/4 caps
portfolio.update({ id, caption?, tradeSlug?, workMonth? }) → null
portfolio.setPublic({ id, public: boolean, consentVersion?: string, peopleConsentConfirmed?: boolean }) → null
  // public:true requires the current consentVersion and peopleConsentConfirmed:true
portfolio.remove({ id })                            → null   // deletes storage + row, audit row
portfolio.listMine()                                → MyPortfolioItem[]   // includes private + hidden, with hiddenReason
profiles.setContact({ showPhone: boolean, whatsapp: boolean }) → null
  // showPhone:true requires a valid Kenyan users.phone; whatsapp:true requires showPhone:true
profiles.setLinkVisibility({ link: "linkedin" | "cv" | "portfolio", public: boolean }) → null
profiles.setRates({ items: RateItem[], note?: string }) → null
profiles.clearRates()                               → null
profiles.setCover({ itemId: Id<"portfolioItems"> | null }) → null
profiles.myPublicStatus() → {
  listed: boolean;
  verified: boolean;
  reason: null | "listing_off" | "hidden_by_admin";
  hiddenReason: string | null;
  preview: PublicProfile;       // what a Client would see (contact still without the number)
}

// ---- Admin (requireAdmin; every write adds an auditLog row) -------------
moderation.listReports({ status, paginationOpts })  → PaginationResult<ReportRow>
moderation.resolveReport({ reportId, resolution: "dismissed" | "actioned", reason }) → null
moderation.hideItem({ itemId, reason }) / moderation.unhideItem({ itemId, reason }) → null
moderation.hideProfile({ fundiProfileId, reason }) / moderation.unhideProfile({ fundiProfileId, reason }) → null

// ---- internal -----------------------------------------------------------
syncListing(ctx, fundiUserId)            // helper, §10.3
listings.rebuildAll                      // internalMutation, batched
contact.purgeOldReveals                  // cron, daily, deletes contactReveals older than 30 days
```

Every public query and mutation has `args` and `returns` validators (Convex guidelines). No function takes a role, or a user id meaning "who am I", from its arguments (ADR-18).

---

## 12. Testing seams

Highest seam first (architecture spec §10). Every Convex rule is tested with **`convex-test`**, through the public functions only.

**Listing, verification labels and privacy (all must pass before any `/fundis` UI merges):**

1. A Listed Fundi with **no** Badge **is** returned by `listings.search`, with `verified: false`, `badges: []` and `expert: null`. `profiles.getPublic` returns them with `verified: false`.
2. `publicListing: false` → absent from search, and `getPublic` returns null. Turning it back on restores them.
3. `hiddenByAdmin` set → absent, and null; unhide restores.
4. An Admin override from `approved` to `rejected` of a Fundi's only Badge flips them to `verified: false` and moves them to tier 1. An override to `approved` flips them back.
5. **No leak, verified or not:** no `listings.search` or `profiles.getPublic` result contains:
   - the phone
   - the email
   - a `videoStorageId` or an Assessment URL
   - `feedbackEn` / `feedbackSw` or any Observation
   - any status word (`awaiting_review`, `rejected`, `reshoot`, `failed`, `appealed`)

   Assert on the serialised JSON, including regexes for `+254` and `07\d{8}`. Run it for a verified Fundi, an unverified Fundi, an unverified Fundi with an `awaiting_review` AI-`pass` Assessment, and one with a `rejected` Assessment.
6. **An AI `pass` awaiting review shows nothing:** a Fundi whose only Assessment is `awaiting_review` with verdict `pass` gets exactly the same card and profile as a Fundi with no Assessment.
7. **"Not yet verified in <Trade>":** a Fundi declaring Electrical + Hairdressing with only an Electrical Badge appears under `trade=hairdressing` with `notYetVerifiedIn: "Hairdressing"`, `verified: false` and `badges: []`. Under `trade=electrical` they appear with the Badge and `verified: true`.
8. **The "Verified only" chip:** `verifiedOnly: true` returns only rows with `verified: true`, with and without `county` and `area`.
9. **Sort order:** with one real verified Fundi, one Demo profile and one real unverified Fundi in a scope, the default order is verified → Demo → unverified.
10. **Expert mark derivation:**
    - an active `experts` row with `approvedTrades: ["electrical"]` → `expert.trades = [Electrical]` on the card and profile, and `verified: true` in the Electrical scope
    - `active: false` → `expert: null`
    - an empty `approvedTrades` → `expert: null`
    - removing a Trade from `approvedTrades` removes that mark and re-tiers the row
    - an Expert with no Fundi profile is never returned
    - the mark is never written to `fundiProfiles`
11. `contact.reveal` returns `unavailable` when `showPhone` is off, when the Fundi is not Listed, and for Demo profiles. It returns the number for a Listed **unverified** Fundi who opted in.
12. `contact.reveal` returns `rate_limited` on the 6th rapid call with one `visitorKey`, and on the 101st call per Fundi per day.
13. Private items, Admin-hidden items and another Fundi's Portfolio items never appear in `recentWork`, and never as a card cover.
14. `portfolio.setPublic(true)` without the consent version or the people confirmation throws.
15. `portfolio.remove` deletes the storage files (assert `ctx.storage.getUrl` is null) and the row, and clears the cover.
16. **Opt-in links:** LinkedIn/CV/portfolio links appear in `getPublic().links` only when their switch is on. YouTube/TikTok appear in `showcase` whenever they're set.
17. Every Fundi mutation throws when called by another Fundi, by a signed-out caller, or on another Fundi's item.
18. Every `moderation.*` call by a non-Admin throws, and every Admin write adds an `auditLog` row.
19. **Projection consistency:** after each caller in the §10.3 table, the Fundi's `listings` rows equal a from-scratch recomputation.
20. Demo profiles return `isDemo: true`, `expert: null` and `contact.available: false`.

**Other seams:**
- **Playwright at 360×740:**
  - the flow: `/trades` → tap Electrical → `/fundis?trade=electrical` → the first cards are verified → toggle "Verified only" → change county → tap a card → `/f/[id]` → tap Call → the number appears as a `tel:` link
  - the page HTML before the tap does not contain the number
  - an unverified card shows "Not yet verified" in the `--dim` colour (a computed-style assertion: not amber)
  - Lighthouse mobile ≥ 90 for performance and accessibility on `/fundis` and `/f/[id]`, with Showcase embeds and videos loading on tap
- **Copy tests:**
  - every string on the V6 screens is in `en.json`
  - the forbidden-word check (certified, rating, top, best, unverified, pending, rejected) covers the public pages
  - the Portfolio consent strings exist in English and Kiswahili

---

## 13. Performance

- Every list is paginated (`paginationOptsValidator`, 24 per page). No public path calls `.collect()` on `listings`, `portfolioItems`, `reports` or `contactReveals`.
- Search reads only `listings`: one indexed range or one search-index query. The only read-time lookups are `ctx.storage.getUrl` for at most 24 cover photos.
- `profiles.getPublic` reads:
  - one profile
  - one `experts` row (`by_userId`)
  - the Fundi's approved Assessments via `by_fundi` (bounded by the number of Tasks)
  - at most 12 Portfolio items via `by_fundi_public`
- Convex search scans at most 1024 index results and always returns relevance order (live docs, checked 2026-09-26). That's why area search drops the tiered order: the "Verified only" chip, applied through the `verified` filter field, is the way to keep verified-only results there.
- **Images:** covers and Portfolio photos are served at their uploaded size in V6. The upload screen resizes photos in the browser to at most 1600 px on the long edge (WebP or JPEG) before upload. Videos never autoplay; they load on tap, showing the poster frame first.
- `syncListing` rewrites at most (1 + the number of Trades in scope) rows per Fundi. The 12-Trade catalogue bounds that at 13.
- Every Listed Fundi now has rows, so `listings` grows with sign-ups rather than Badges. That's fine at MVP scale, and every read is indexed.

---

## 14. Changes to earlier decisions

| Earlier rule | Where | Change | Recorded as |
| --- | --- | --- | --- |
| "Clients have no account. `/fundis` lists Verified Fundis only." | D-2, spec §5 ("Verified Fundi … Only Verified Fundis appear on `/fundis`") | **Changed:** `/fundis` lists **every Listed Fundi**. Verification is shown, not required: verified first, a "Verified only" chip, and a neutral "Not yet verified" label. Still no Client account. | D-24 (supersedes D-19), ADR-22 |
| — (new) | — | The **Expert verifier · <Trade>** mark on cards and profiles is derived from `experts`, separate from skill Badges, and never stored. | D-25 |
| Public profile **hides** phone and videos | spec §7, PRD US-5.7 ("contact details hidden in MVP") | The phone is shown only on tap, and only if the Fundi opted in. Public **Portfolio** photos and videos appear if the Fundi published them. Assessment videos stay hidden. | ADR-20, ADR-21, D-20 |
| Public profile shows Showcase links only | spec §7 | LinkedIn, CV and portfolio links appear only through a per-link opt-in, with a CV warning. | D-26 |
| "search and a geohash index" out of scope | spec §12 | **Filter search** (Trade, county, free-text area, Verified only) is in scope for V6. Geohash, maps, distance and name/bio search stay out. | D-18 |
| "Badges derived, never stored" | spec §5, D-1 | Still true at the source. The `listings` table stores a **derived projection** of Badges and Expert marks for search, rebuilt by one helper. | ADR-22 |
| "When the AI says pass but no Expert has reviewed, the public profile shows nothing" | AGENTS non-negotiable, D-1 | **Still true for that Assessment.** The Fundi can now be Listed, but the profile shows no Badge and no sign that the Assessment exists. The wording needs a small clarification (§14.1). | proposed AGENTS diff |
| Only the verification consent is bilingual | AGENTS rule 5, C-11 | The **Portfolio publish consent** also ships in English and Kiswahili. | D-21 (accepted), proposed AGENTS diff §14.1 |
| "No identifiable faces" in photos | DESIGN.md, HANDOFF §4 | Still governs Smart Fundis' own imagery. User Portfolio content follows the §8.2 faces rule. | D-22 |
| Fundis declare only Verify-now Trades (Electrical, Hairdressing) | prompt 15 ("More trades are coming soon") | Fundis may declare any of the 12 Trades. Only Trades with a Rubric can earn a Badge. | D-24 |
| Onboarding: phone "Never shown publicly"; visibility helper "Your profile only appears once you have a badge" | prompt 15 | Phone helper: "Hidden unless you turn on 'Show my phone to clients'". Visibility helper: "Clients can find you now. Badges appear once an Expert approves your video." The privacy readout adds "PUBLIC IF YOU CHOOSE · phone, work photos and videos, LinkedIn/CV/portfolio links". | V6-0a |
| `/trades` is a Fundi-facing "Verify now" catalogue; Coming-soon Trades are not links | V3 #22, prompt 03, spec §8 | `/trades` becomes the Client entry. Every Trade has "Find a fundi →", because unverified Fundis can be found in any Trade. "Verify now" stays secondary on Rubric Trades, and the others show "Verification coming soon". A legend explains ✓ / Expert verifier / Not yet verified. | D-24, V6-3 |
| `/fundis` and a styled `/f/[id]` in V3; V6 after the MVP | spec §9, V3 brief, first draft of this spec | The **discovery core** (V6-1 projection, V6-2 `/fundis`, V6-3 `/trades`, V6-8 Demo Listings) runs **right after V1, before the V5 demo**. V5's `seed.demo` calls `syncListing`. The rest of V6 (profile v2, contact, Portfolio, moderation) follows. | D-23, D-27 |

### 14.1 Proposed `AGENTS.md` diff (the operator applies it; the Architect does not edit `AGENTS.md` here)

```diff
@@ Working rules
-5. Every user-visible string goes through `next-intl`. **For now the UI is English only:** fill `messages/en.json`, keep `sw.json` absent, and keep the language toggle hidden. The one exception is the **consent screen**, which ships in both English and Kiswahili (PRD §8). The AI pipeline still returns `feedback_sw`, but the UI does not show it yet.
+5. Every user-visible string goes through `next-intl`. **For now the UI is English only:** fill `messages/en.json`, keep `sw.json` absent, and keep the language toggle hidden. The exceptions are the two **consent screens**, the verification consent (PRD §8) and the Portfolio publish consent (D-21), which ship in both English and Kiswahili. The AI pipeline still returns `feedback_sw`, but the UI does not show it yet.
@@ Non-negotiables
-- The AI recommends. Only an **Expert** approval creates a **Badge**. When the AI says `pass` but no Expert has reviewed the video, the public profile shows nothing.
+- The AI recommends. Only an **Expert** approval creates a **Badge**. When the AI says `pass` but no Expert has reviewed the video, the public profile shows no Badge and nothing about that Assessment. A Fundi without a Badge may be listed, labelled "Not yet verified" (D-24).
```

---

## 15. Out of scope (V6 and the MVP)

- Client accounts, saved searches, favourites
- in-app messaging or chat; call and WhatsApp leave the app
- bookings, quotes, M-Pesa, deposits, escrow, Fundi Pro
- reviews, ratings, stars, "top fundi", sorting by price or rating
- maps, geohash, "near me", distance (ADR-6 stays post-MVP)
- free-text search over names or bios
- OTP verification of the phone number
- Cloudflare Turnstile or IP-based limits (R-18)
- AI on Portfolio content (face detection, quality scoring, auto-tagging)
- showing reveal or view counts to anyone (only Admins, through the database)
- listing Experts who have no Fundi profile; a Portfolio for Experts; publishing Assessment videos
- an in-app appeal against an Admin hide (email info@smartfundis.com)
- the Kiswahili UI (apart from the two consent screens)

Post-MVP items that Clients could mistake for live features (Client accounts, bookings and M-Pesa) stay on `/roadmap`, tagged "Coming soon".

---

## 16. Operator answers (2026-09-26)

| # | Question | Answer |
| --- | --- | --- |
| Q-1 | Should Fundis with no Badge appear? | **Yes, all Listed Fundis.** Verified first, a "Verified only" chip, a neutral "Not yet verified" label, and an Expert verifier mark (D-24, D-25). |
| Q-2 | Bilingual Portfolio publish consent? | **Yes** (D-21). The AGENTS.md diff in §14.1 is for the operator to apply. |
| Q-3 | Turnstile on reveal? | **No, not in V6.** Logged as R-18; revisit if `contactReveals` shows bulk harvesting. |
| Q-4 | LinkedIn/CV/portfolio links public? | **Per-link opt-in**, with the CV home-address warning (D-26). |
| Q-5 | Index profiles in search engines? | **Real profiles are indexable; Demo profiles are `noindex`** (D-28). |
| Q-6 | Disputing an Admin hide? | **Email info@smartfundis.com** (D-28). |
| Q-7 | Before the V5 freeze? | **The discovery core is, the rest follows** (D-27). |

**Remaining for the operator:** none are blocking. For confirmation: the Expert mark counts as "verified" for sorting and the chip in that Expert's Trades (§4), and every Trade tile on `/trades` links to results, not just the two Rubric Trades (§14).
