# Smart Fundis — Find a Fundi (client discovery) design

- **Status:** draft for operator review, 26 Sep 2026. Operator decisions 1–4 below are binding; everything else is the Architect's recommendation.
- **Slice:** V6, "Find a Fundi" (`planning/slices/V6.md`). Blocked by V1 and V3. Built **after** V1, so profiles fill with real Fundis once the upload-to-Badge loop exists.
- **Extends:** `docs/superpowers/specs/2026-09-25-architecture-design.md` (the "architecture spec"). Where this document changes an earlier rule, the change is listed in §14 and recorded as D-18 to D-23 in `planning/DECISIONS.md`.
- **ADRs:** ADR-20 (public Portfolio separate from Assessment video), ADR-21 (opt-in contact, revealed on tap), ADR-22 (Listings are a derived projection, Verified Fundis only).
- **Glossary:** `CONTEXT.md`, with the new terms **Listing**, **Portfolio item**, **Showcase**, **Rates** and **Contact reveal**.
- **Package manager:** pnpm (D-12). Every command in this spec is `pnpm …` / `pnpm exec …` / `pnpm dlx …`.

---

## 1. Problem

A Client in Kenya who needs a mechanic in Ruiru or a braider in Kisumu has no trustworthy place to look. The MVP proves skills (the Badge) but gives the Client almost nothing to act on: the public profile hides the phone, shows no photos of real work, and has no way to narrow by place or Trade. A verified Fundi who cannot be reached earns nothing from being verified.

## 2. Solution

A Client, with no account, goes **`/trades` → `/fundis?trade=&county=&area=` → `/f/[id]`**:

1. **`/trades`** becomes the Client's way in: a grid of Trades with real photos. Each "Verify now" Trade links to its results. The Fundi call to action ("Verify now") stays, but second.
2. **`/fundis`** shows a grid of **Fundi cards** filtered by Trade, county (all 47) and free-text area. Only **Listed** Fundis appear (§5).
3. **`/f/[id]`** is the full profile: Badges (verified work), **Recent work** from the Fundi's opt-in **Portfolio** (photos and videos, labelled "Not verified"), **Showcase links**, self-declared **Rates**, and — only if the Fundi opted in — **Call** and **WhatsApp** buttons that reveal the number on tap.

The Fundi controls all of it from a new **"My public profile"** editor on the Fundi dashboard (`/fundi/profile`, behind the existing `/fundi` sign-in guard).

### Operator decisions (2026-09-26, binding)

| # | Decision |
| --- | --- |
| OD-1 | **Videos: opt-in Portfolio.** A Fundi uploads separate work-showcase photos and videos and marks each one public. **Assessment videos stay private** (the verification consent promise). YouTube/TikTok links show as "Showcase — not verified" (ADR-7). Only verified work carries the Badge. |
| OD-2 | **Contact: opt-in.** "Show my phone to clients". On: Call + WhatsApp buttons with tap-to-reveal. Off: no contact button at all. No Client account. |
| OD-3 | **Location:** county (all 47) + free-text area/estate, plus Trade. No maps and no geohash (ADR-6 stays post-MVP). |
| OD-4 | **Timing:** design now; build in a slice after V1. Demo seed profiles are tagged Demo per the `isDemo` rule. |

---

## 3. User stories

IDs continue the PRD scheme under a new group 7.

| ID | Story | Acceptance criteria (checked by QA) |
| --- | --- | --- |
| US-7.1 | As a **Client**, I want to start from the Trade I need, so I don't have to know how the site works. | `/trades` shows every Trade with a photo. Each "Verify now" Trade has a primary "Find a fundi" link to `/fundis?trade=<slug>`. "Coming soon" Trades are plain readouts, not links. No counts of fundis anywhere. |
| US-7.2 | As a **Client**, I want to filter by Trade, county and area, so I see fundis near me. | `/fundis` has a Trade select (Verify-now Trades + "All trades"), a county select with all 47 counties + "All Kenya", and a free-text area field. The filters are in the URL (`?trade=&county=&area=`), so a link can be shared. Changing a filter never needs an account. |
| US-7.3 | As a **Client**, I want a grid of cards, so I can compare fundis quickly. | Each card shows only the card fields in §6.1. No phone, no rates, no bio on a card. 24 cards per page, then "Show more". An empty result shows the "No verified fundis match yet" frame with "Clear area" / "All Kenya" suggestions. |
| US-7.4 | As a **Client**, I want the full profile after I tap a card, so I can decide. | `/f/[id]` shows the profile fields in §6.2. Unknown, unlisted or Admin-hidden ids return the not-found page. |
| US-7.5 | As a **Client**, I want to call or WhatsApp a fundi, so I can hire them. | If and only if the Fundi opted in: Call and WhatsApp buttons. The number is **not** in the page HTML or in any list response; it is returned only by `contact.reveal` after a tap. Over the rate limit, the button says "Try again in a few minutes". If the Fundi opted out, no contact button and no "hidden" placeholder that implies one exists. |
| US-7.6 | As a **Client**, I want to see what is verified and what is not, so I'm not misled. | Badges read "Verified by Smart Fundis — <Trade>: <Task> · <date>". Every Portfolio item and Showcase link carries "Not verified" / "Showcase — not verified". Rates carry "Set by the fundi — not verified". Demo profiles carry "Demo: not a real verification" on the card and on the profile. |
| US-7.7 | As a **Client**, I want to report a profile or a photo, so abuse gets removed. | A "Report" link on the profile and on each Portfolio item opens a short form (reason + optional note). Submitting shows "Thanks — an Admin will look at this". Rate limited. |
| US-7.8 | As a **Fundi**, I want to upload photos and videos of my work and choose which are public, so clients see what I do. | Upload photo (≤ 5 MB, JPEG/PNG/WebP) or video (≤ 50 MB, MP4/WebM/QuickTime). Items are **private by default**. Making an item public needs the Portfolio publish consent (§8.2) and the "people in this agreed" confirmation. Max 12 items, of which max 4 videos. |
| US-7.9 | As a **Fundi**, I want to delete or unpublish any Portfolio item at any time, so I stay in control. | Unpublish removes it from `/f/[id]` immediately. Delete removes the file(s) from storage and the row. Both work in any state, including hidden by Admin. |
| US-7.10 | As a **Fundi**, I want to choose whether clients see my phone, so I decide who can call me. | "Show my phone to clients" switch, **off by default**. A second switch "This number is on WhatsApp", off by default and only enabled when the first is on. The switch is disabled with a hint if no valid Kenyan phone is on file. |
| US-7.11 | As a **Fundi**, I want to state my rates, so clients know roughly what I charge. | Up to 5 rate lines (label, amount in KSh, unit) plus an optional note. Shown with "Set by the fundi — not verified" and "Updated <date>". Can be cleared. |
| US-7.12 | As a **Fundi**, I want to preview my public profile, so I know what clients see. | "My public profile" shows a live preview and, if not listed, the exact reason ("You'll appear once you have a badge" / "You turned off Show my profile" / "Hidden by Smart Fundis: <reason>"). |
| US-7.13 | As an **Admin**, I want a queue of reports, so I can act on abuse. | `/admin/reports` (plain shadcn) lists open reports newest first. Actions: dismiss, hide the Portfolio item, hide the whole profile, each with a required reason and an `auditLog` row. Unhide is also available. |
| US-7.14 | As an **Expert**, I want nothing to change about review, so Portfolio never leaks into verification. | The Expert queue and review screens never show Portfolio items or Showcase links. Portfolio items are never sent to the AI service. |
| US-7.15 | As the **platform**, I want every privacy rule enforced on the server, so the UI can't be bypassed. | The `convex-test` suite in §11 passes. |

---

## 4. The browse flow

```
/trades                     /fundis?trade=electrical&county=kiambu&area=ruiru          /f/[id]
┌──────────────────┐        ┌───────────────────────────────────────────┐        ┌────────────────────┐
│ ELECTRICAL  photo│──tap──▶│ [Trade ▾] [County ▾] [Area ____] [Show]    │──tap──▶│ name · county/area │
│ Find a fundi →   │        │ ┌card┐ ┌card┐ ┌card┐                        │  card  │ Badges (verified)  │
│ Verify now (fundi)│       │ └────┘ └────┘ └────┘   Show more            │        │ Call / WhatsApp*   │
│ PLUMBING  photo  │        │ empty state: NO SIGNAL YET                 │        │ Rates (self-set)   │
│ Coming soon      │        └───────────────────────────────────────────┘        │ Recent work        │
└──────────────────┘                                                              │ Showcase links     │
                                                                                  │ Report             │
                                                                                  └────────────────────┘
* only if the Fundi opted in; number revealed on tap
```

- **Entry points:** header TRADES tab, footer "Find a fundi" (→ `/fundis`), landing hero "Find a fundi" (→ `/fundis`), landing trade tiles (→ `/fundis?trade=`).
- **URL is the state.** `trade` is a Trade slug with an active Rubric; `county` is one of the 47 county slugs; `area` is free text, trimmed, max 60 characters. Unknown values are dropped silently (the filter shows "All").
- **Trade filter matches verified Trades only.** A Fundi appears under Electrical only if they hold at least one Electrical Badge. Trades the Fundi declared without a Badge show on their profile as "Also offers (not verified)" but never match a filter. Otherwise a Badge in one Trade would lend trust to another.
- **Order:** newest Badge first (real Fundis before Demo profiles), shown as the readout "Newest badges first". When `area` is set, results are in search-relevance order instead (a Convex search-index constraint, §10) and the readout says "Best match for '<area>'". No ranking, rating or "top fundi" language.
- **Rendering:** `/fundis` and `/f/[id]` server-render the first page with `preloadQuery` (shareable link, Lighthouse), then hydrate `usePaginatedQuery` / `usePreloadedQuery`. Frontend confirms the current Convex + Next.js API in live docs first (AGENTS rule 2).

---

## 5. Who is listed

A Fundi is **Listed** when **all** of these hold:

1. they have at least one Badge (an `approved` Assessment; spec §5 derivation, D-1),
2. `fundiProfiles.publicListing` is on (default on, spec §5),
3. `fundiProfiles.hiddenByAdmin` is unset.

Only Listed Fundis appear on `/fundis`, and `/f/[id]` returns not found for anyone else. Demo profiles are Listed through their seeded Badges and carry the Demo tag everywhere.

**Decision (D-19, recommended): no unverified listings.** The operator asked for "Fundis and other semi-skilled professionals". The honest reading in the MVP is: any Trade can appear once it has a Rubric and Experts; until then its tile on `/trades` is "Coming soon". Listing Fundis with only a Portfolio (for example, mechanics) would make `/fundis` indistinguishable from a classifieds board, attract fake profiles we have no way to check, and undercut the only trust claim we make. The cost is that 10 of the 12 Trades are empty until their Rubrics exist. See open question Q-1 for the alternative ("Not yet verified" section behind a toggle).

---

## 6. What a card shows vs what a profile shows

### 6.1 Card (in `listings.search` results)

| Shows | Never shows |
| --- | --- |
| Cover: the Fundi's chosen public Portfolio **photo**, else an initials tile (Demo profiles always use initials) | phone, WhatsApp flag, rates, bio, email |
| Display name | Portfolio videos, Showcase links |
| County name · area | Assessment anything except its Badge line |
| Up to 3 Badge lines "✓ <Trade>: <Task>", newest first, plus "+N more" | counts of reviews, reveals or views |
| "Demo: not a real verification" when `isDemo` | "certified", ratings, stars, "top" |
| "View profile" | |

### 6.2 Profile (`/f/[id]`, from `profiles.getPublic`)

| Section | Content | Label |
| --- | --- | --- |
| Header | display name, county · area, years of experience, languages, bio | Demo tag if `isDemo` |
| **Verified work** | every Badge: "Verified by Smart Fundis — <Trade>: <Task> · <date>" | — |
| Also offers | Trades on the profile with no Badge | "Not verified" |
| **Contact** | Call and WhatsApp buttons, only if opted in; number revealed on tap (§8.1) | under the buttons: "Smart Fundis verified the tasks above only. Agree the price and the work directly with the fundi." |
| **Rates** | up to 5 lines "<label> · KSh <amount> / <unit>" + note + "Updated <date>" | "Set by the fundi — not verified" |
| **Recent work** | public Portfolio items, newest first: photo or video (tap to play), caption, Trade, month of the work | each item: "Not verified" |
| **Showcase** | YouTube/TikTok links from `fundiProfiles.links`, embedded with `youtube-nocookie` / TikTok embed, **tap to load** | "Showcase — not verified" |
| Report | "Report this profile" link; each Portfolio item has its own "Report" | — |

**Still never public:** email, Assessment videos, AI Observations/Verdict/feedback, pending/rejected/reshoot/failed Assessments, private Portfolio items, `linkedin`/`cv`/`portfolio` links (unchanged from spec §7; see Q-4), report and reveal data.

"Recent jobs" in the operator's request maps to **Recent work** (Portfolio items with an optional month). Smart Fundis has no bookings, so it cannot know about jobs; the Fundi shows them.

---

## 7. Honesty rules for this feature

1. **Three kinds of evidence, never blurred.** *Verified* = Badge (Expert-approved in-app Assessment). *Showcase* = YouTube/TikTok link. *Portfolio* = the Fundi's own upload. Only Badges use ✓, the word "Verified" and the amber accent. Portfolio and Showcase use the dim "Not verified" / "Showcase — not verified" mono tag.
2. **Rates are the Fundi's text.** Always "Set by the fundi — not verified", with the date. Smart Fundis never suggests, averages, compares or sorts by price. (This is not an "earnings figure" under spec §7: that rule forbids Smart Fundis claiming what Fundis *will* earn, especially from the Co-op. Rates are a Fundi's own asking price.)
3. **Nothing looks live that isn't.** Coming-soon Trades on `/trades` and in the filter are readouts, not links or disabled-looking options. No "Book now", "Pay with M-Pesa", "Message", "Reviews" or "Rating" controls anywhere.
4. **Never "certified".** "Verified by Smart Fundis" only.
5. **No counters.** No "124 electricians in Nairobi", no view or reveal counts shown to Clients.
6. **Demo is always tagged.** "Demo: not a real verification" on the card and the profile. Demo profiles have no phone (a made-up number could be a real person's), no Portfolio (CONTEXT: no photo or video), and may have sample Rates, which inherit the profile's Demo tag. Demo profiles get `noindex`.
7. **Copy stays English only** (AGENTS rule 5), except the Portfolio publish consent, which ships in English and Kiswahili like the verification consent (§8.2, D-21).

---

## 8. Privacy

### 8.1 Phone: opt-in and tap-to-reveal (ADR-21)

- The number is `users.phone` (collected in onboarding, ADR-16), normalised to `+2547XXXXXXXX` / `+2541XXXXXXXX`. `fundiProfiles.contact = { showPhone: false, whatsapp: false }` by default.
- **The number is never in a query result.** Not in `listings.search`, not in `profiles.getPublic` (which returns only `contact.available` and `contact.whatsapp`), not in server-rendered HTML.
- **Reveal:** tapping Call or WhatsApp runs the mutation `contact.reveal({ fundiProfileId, channel, visitorKey })`. It re-checks that the Fundi is Listed and opted in, applies the rate limits, writes a `contactReveals` row, and returns the number. The button then becomes a `tel:` link or opens `https://wa.me/<digits>?text=<"Hi, I found you on Smart Fundis.">`.
- **Rate limits** (`@convex-dev/rate-limiter`, token bucket): per `visitorKey` 10 reveals/hour (capacity 5); per Fundi 100 reveals/day. Over the limit the mutation returns `{ ok: false, reason: "rate_limited" }` and the UI says "Try again in a few minutes".
- **What this does and doesn't do:** it stops the number sitting in HTML, list results and search-engine caches, and it slows bulk harvesting. It does **not** stop a determined scraper who rotates `visitorKey` (a random id the browser keeps in `localStorage`; Convex sees no IP). The per-Fundi cap bounds the damage. Stronger options (Cloudflare Turnstile, an IP-keyed limit in a Next.js route handler) are Q-3.
- **Reveal log:** `contactReveals` holds `fundiProfileId`, a SHA-256 of the `visitorKey`, the channel and the time. No IP, no user agent. A daily cron deletes rows older than 30 days. It exists for rate-limit forensics and Admin abuse checks only; it is never shown to Clients, and V6 doesn't show it to Fundis either.
- **The phone is self-declared.** It is not OTP-verified in the MVP. A Fundi could enter someone else's number; the "Wrong or someone else's number" report reason and Admin hide are the mitigation (R-15). OTP is Pilot.

### 8.2 Portfolio: separate from Assessment video (ADR-20)

- **Separate table, separate storage objects, separate consent.** A Portfolio item is never an Assessment video and an Assessment video can never become a Portfolio item (no "publish my verification video" button). The verification consent promise ("only the Badge becomes public") stays true.
- **Private by default.** `public: false` on upload. Private items are visible to the owning Fundi and Admins only.
- **Portfolio publish consent** (shown the first time a Fundi makes an item public, and again when its version changes; English and Kiswahili):
  - "This photo or video will be public on your Smart Fundis profile. Anyone can see it, and we can't stop people saving a copy."
  - "It is labelled 'Not verified'. Only a video recorded in the app for an Assessment earns a badge."
  - "Smart Fundis does not use it for AI training, AI checks or the Data Co-op."
  - "You can unpublish or delete it at any time."
  - Checkbox, required per item: "Everyone who can be recognised in this photo or video agreed to it being public, and no children can be recognised."
  - Stored per item as `publishConsentVersion` and `publishedAt`.
- **Faces rule (D-22).** *Decision:* the Fundi's **own** face is allowed; **other people** are allowed only with the per-item confirmation above; **children** must not be recognisable. The upload screen advises "Best: show the work and your hands, not people's faces." There is no automatic face detection.
  - *Why not ban faces outright:* hairdressing and beauty work *is* on a person's head and face; a ban would make the Portfolio useless for one of the two live Trades, and the Fundi's own face is their choice on their own showcase.
  - *Why not allow freely:* a braider's client never agreed to be on the internet. The confirmation puts the duty where the knowledge is, the report reason "Shows someone without their consent" gives the subject a route, and Admin hide acts on it.
  - *Why no AI face detection:* it would put a model in the path of user content we promised not to run AI on, add cost, and still miss cases.
  - The DESIGN.md "no identifiable faces" rule still governs **Smart Fundis' own imagery** (Stitch, Canva, placeholders), including every card and profile mockup.
- **Deletion.** `portfolio.remove` deletes the storage file, the poster file and the row in one mutation, and writes an `auditLog` row. Unpublish is instant. When `publicListing` turns off or the Admin hides the profile, every item disappears with the profile. A Fundi account deletion (post-MVP) must also delete all Portfolio files.
- **Never to the AI.** Portfolio items are never sent to `/ai/claim`, never traced, never in the eval, never Co-op data.
- **Public URLs.** Public items are served with `ctx.storage.getUrl()` from `profiles.getPublic` and `listings.search` (cover photo only). These URLs are public by design (unlike Assessment videos, spec §7). After unpublish or delete, the next query stops returning the URL; a copied URL keeps working until the file is deleted (same limitation as R-5, stated on the consent: "we can't stop people saving a copy").

### 8.3 What is public, in one table

| Data | Card | Profile | Notes |
| --- | --- | --- | --- |
| Display name, county, area | yes | yes | |
| Badges | up to 3 | all | |
| Years, languages, bio, declared Trades | no | yes | |
| Cover photo | yes | yes (in Recent work) | a public Portfolio photo the Fundi chose |
| Public Portfolio items | no | yes | |
| Showcase links (YouTube/TikTok) | no | yes | tap to load |
| Rates | no | yes | self-declared label |
| Phone | no | **only via `contact.reveal`** | opt-in |
| Email, Assessment videos, AI output, private items, LinkedIn/CV/portfolio links | no | no | |

---

## 9. Moderation and abuse

- **Report.** `reports.create({ fundiProfileId, portfolioItemId?, reason, note?, visitorKey })`. Reasons: `fake_or_stolen_work`, `wrong_phone`, `shows_someone_without_consent`, `offensive`, `other`. `note` ≤ 280 characters. Rate limit per `visitorKey`: 5/hour. No account needed.
- **Admin queue** `/admin/reports` (plain shadcn, like the other Admin screens): open reports newest first, grouped by profile, with a link to the item. Actions, each with a required reason and an `auditLog` row: **dismiss**, **hide item** (`portfolioItems.hiddenByAdmin`), **hide profile** (`fundiProfiles.hiddenByAdmin`, which removes the Listing), and **unhide**.
- **What the Fundi sees:** "Hidden by Smart Fundis: <reason>" on the item or on the "My public profile" status. They can delete or edit the item; a hidden item stays hidden until an Admin unhides it. No appeal flow in V6 (email contact, Q-6).
- **Upload limits** (§3 US-7.8) and caption limits (140 characters) bound storage abuse. The server validates type and size from the `_storage` system table and deletes invalid files, as V1 does for Assessments.

---

## 10. Data model changes (Convex)

Owned by the **convex** role; the Architect owns the shape. All new fields on existing tables are optional so the schema deploys over V1/V3 data without a migration.

### 10.1 `fundiProfiles` (additions)

| Field | Type | Default / rule |
| --- | --- | --- |
| `county` | **tightened** to the 47-slug union `CountySlug` (`convex/lib/counties.ts`) | V3 onboarding writes a slug |
| `contact` | `{ showPhone: boolean, whatsapp: boolean }` optional | absent = both false. `whatsapp` requires `showPhone` |
| `rates` | `{ items: { label: string ≤ 40, amountKsh: int 1..10_000_000, unit: "job" \| "hour" \| "day" \| "item" \| "visit" }[] ≤ 5, note?: string ≤ 140, updatedAt: number }` optional | absent = no Rates section |
| `coverItemId` | `Id<"portfolioItems">` optional | must be the Fundi's own public, active **photo**; cleared when that item is unpublished, hidden or deleted |
| `hiddenByAdmin` | `{ reason: string, byUserId: Id<"users">, at: number }` optional | set = not Listed |

### 10.2 New table `portfolioItems`

| Field | Type |
| --- | --- |
| `fundiUserId` | `Id<"users">` |
| `kind` | `"photo" \| "video"` |
| `storageId` | `Id<"_storage">` |
| `posterStorageId` | `Id<"_storage">` optional (video only; a JPEG frame made in the browser) |
| `contentType`, `sizeBytes` | copied from `_storage` at create time |
| `caption` | string ≤ 140 |
| `tradeSlug` | string optional (one of the Fundi's declared Trades) |
| `workMonth` | string `YYYY-MM` optional |
| `public` | boolean, default false |
| `publishConsentVersion`, `publishedAt` | optional; required when `public` is true |
| `peopleConsentConfirmed` | boolean; must be true to publish |
| `hiddenByAdmin` | `{ reason, byUserId, at }` optional |

Indexes: `by_fundi` `["fundiUserId"]`, `by_fundi_public` `["fundiUserId", "public"]`.
**Public iff** `public === true` **and** `hiddenByAdmin` unset **and** the owner is Listed.
There is no `kind: "link"`: YouTube/TikTok Showcase links stay in `fundiProfiles.links` (spec §5) so there is one place for them and no migration of V3 data.

### 10.3 New table `listings` — the derived projection (ADR-22)

One row per (Listed Fundi × verified Trade), plus one row per Listed Fundi with `scope: "all"`. Rows exist **only** for Listed Fundis. It is a cache of derived data, never a source of truth, and is rebuilt by exactly one function.

| Field | Type |
| --- | --- |
| `fundiProfileId`, `fundiUserId` | ids |
| `scope` | a Trade slug, or `"all"` |
| `county` | `CountySlug` |
| `area` | display string |
| `searchText` | lowercased area + county name, for the search index |
| `displayName`, `initials` | strings |
| `coverStorageId` | `Id<"_storage">` optional |
| `badges` | `{ tradeSlug, tradeName, taskName, approvedAt }[]` ≤ 3, newest first, **for this scope** (all Trades for `"all"`) |
| `badgeCount` | number (for "+N more") |
| `sortKey` | newest `approvedAt` for real Fundis; `approvedAt − 10¹³` for Demo, so real rows sort first |
| `isDemo` | boolean |

Indexes: `by_scope_sort` `["scope", "sortKey"]`, `by_scope_county_sort` `["scope", "county", "sortKey"]`, `by_fundiUser` `["fundiUserId"]`.
Search index: `search_area` on `searchText`, `filterFields: ["scope", "county"]`.

**`syncListing(ctx, fundiUserId)`** (a plain helper in `convex/lib/listings.ts`, called inside the same mutation, so it is transactional) deletes the Fundi's rows and rewrites them from `users`, `fundiProfiles`, approved `assessments`, `trades`, `rubrics` and `portfolioItems`. It must be called by **every** mutation that changes an input:

| Caller | Why |
| --- | --- |
| `reviews.decide` (approve), appeal decision, Admin override (to or from `approved`) | Badge appears or disappears |
| profile edits (name, county, area, Trades), `profiles.setListing` | card fields, Listed rule |
| `moderation.hideProfile` / `unhideProfile` | Listed rule |
| `portfolio.setPublic`, `portfolio.remove`, `moderation.hideItem`, `profiles.setCover` | cover photo |
| `seed.demo` | Demo rows |

`profiles.getPublic` and `contact.reveal` do **not** trust the projection: they re-check the Listed rule from the source tables, so a stale row can at worst show a card whose profile returns not found.

A convex-test (§12) asserts that after each of these the projection equals a from-scratch recomputation, and `listings.rebuildAll` (internal, Admin-run) exists for repair.

### 10.4 New tables `contactReveals` and `reports`

| Table | Fields | Indexes |
| --- | --- | --- |
| `contactReveals` | fundiProfileId, visitorKeyHash, channel `call \| whatsapp`, at | `by_at`, `by_fundi_at` |
| `reports` | fundiProfileId, portfolioItemId?, reason, note?, visitorKeyHash, at, status `open \| dismissed \| actioned`, resolvedByUserId?, resolution?, resolvedAt? | `by_status_at`, `by_fundiProfile` |

### 10.5 Component

`@convex-dev/rate-limiter`, installed with `pnpm add @convex-dev/rate-limiter` at the root (D-11: `convex/` is not a workspace package) and registered in `convex/convex.config.ts` with `app.use(rateLimiter)`. Limits: `contactRevealVisitor` (token bucket 10/hour, capacity 5), `contactRevealFundi` (fixed window 100/day), `reportVisitor` (fixed window 5/hour). Verify the API against the component README at build time.

---

## 11. Contracts (TypeScript)

Everyone codes against these shapes. `CountySlug` and `COUNTIES` (slug + display name for all 47) live in `convex/lib/counties.ts` and are imported by `web/`.

```ts
// ---- public, no auth ----------------------------------------------------
// listings.search  (query)
args: {
  trade?: string;            // Trade slug with an active Rubric; else ignored
  county?: CountySlug;
  area?: string;             // trimmed, 1..60 chars; empty = no text search
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
  badges: { tradeSlug: string; tradeName: string; taskName: string; approvedAt: number }[]; // ≤ 3
  moreBadges: number;
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
  badges: { tradeSlug: string; tradeName: string; taskSlug: string; taskName: string; approvedAt: number }[];
  alsoOffers: { slug: string; name: string }[];          // declared Trades with no Badge
  contact: { available: false } | { available: true; whatsapp: boolean }; // NEVER the number
  rates: { items: RateItem[]; note: string | null; updatedAt: number } | null;
  recentWork: {
    id: Id<"portfolioItems">; kind: "photo" | "video";
    url: string; posterUrl: string | null;
    caption: string; tradeName: string | null; workMonth: string | null; publishedAt: number;
  }[];                                                    // public items only, newest first
  showcase: { kind: "youtube" | "tiktok"; url: string }[];
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
returns: { slug: string; name: string; verifyNow: boolean }[];

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
profiles.setRates({ items: RateItem[], note?: string }) → null
profiles.clearRates()                               → null
profiles.setCover({ itemId: Id<"portfolioItems"> | null }) → null
profiles.myPublicStatus() → {
  listed: boolean;
  reason: null | "no_badge" | "listing_off" | "hidden_by_admin";
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

Every public query and mutation has `args` and `returns` validators (Convex guidelines). No function takes a role or a user id for "who am I" from its arguments (ADR-18).

---

## 12. Testing seams

Highest seam first (architecture spec §10). All Convex rules are tested through **`convex-test`**, through the public functions only.

**Privacy and listing (must all pass before any `/fundis` UI merges):**

1. A Fundi with no Badge is never returned by `listings.search` and `profiles.getPublic` returns `null`.
2. `publicListing: false` → absent from search, `getPublic` null. Turning it back on restores them.
3. `hiddenByAdmin` set → absent and null; unhide restores.
4. An Admin override from `approved` to `rejected` for a Fundi's only Badge removes them; an override to `approved` adds them.
5. No `listings.search` or `profiles.getPublic` result contains the phone, the email, a `videoStorageId`, an Assessment URL, `feedbackEn`/`feedbackSw` or any Observation (assert on the serialised JSON, including a regex for `+254` and `07\d{8}`).
6. `contact.reveal` returns `unavailable` when `showPhone` is off, when the Fundi is not Listed, and for Demo profiles.
7. `contact.reveal` returns `rate_limited` on the 6th rapid call with one `visitorKey`, and on the 101st call per Fundi per day.
8. Private, Admin-hidden, and other-Fundi Portfolio items never appear in `recentWork`, and never as a card cover.
9. `portfolio.setPublic(true)` without the consent version or the people confirmation throws.
10. `portfolio.remove` deletes the storage files (assert `ctx.storage.getUrl` is null) and the row; the cover is cleared.
11. Every Fundi mutation called by another Fundi, by a signed-out caller, or on another Fundi's item throws.
12. Every `moderation.*` call by a non-Admin throws, and every Admin write adds an `auditLog` row.
13. The trade filter matches verified Trades only: a Fundi declaring Electrical + Hairdressing with only an Electrical Badge is not in `trade=hairdressing`.
14. **Projection consistency:** after each caller in the §10.3 table, the Fundi's `listings` rows equal a from-scratch recomputation.
15. Demo rows sort after real rows; Demo profiles return `isDemo: true`.

**Other seams:**
- **Playwright at 360×740:** `/trades` → tap Electrical → `/fundis?trade=electrical` → change county → tap a card → `/f/[id]` → tap Call → number appears as a `tel:` link. The page HTML before the tap does not contain the number. Lighthouse mobile ≥ 90 for performance and accessibility on `/fundis` and `/f/[id]` (Showcase embeds and videos tap-to-load).
- **Copy tests:** every string on the four screens is in `en.json`; the forbidden-word check (certified, rating, top, best) covers them; the consent strings exist in EN and SW.

---

## 13. Performance

- Every list is paginated (`paginationOptsValidator`, 24 per page); no `.collect()` on `listings`, `portfolioItems`, `reports` or `contactReveals` in a public path.
- Search reads only `listings`, one indexed range or one search-index query; no joins at read time except `ctx.storage.getUrl` for ≤ 24 cover photos.
- `profiles.getPublic` reads one profile, the Fundi's approved Assessments via `by_fundi` (bounded by the number of Tasks), ≤ 12 Portfolio items via `by_fundi_public`.
- Convex search scans at most 1024 index results and always returns relevance order (live docs, checked 2026-09-26), which is why area search drops the "newest" order.
- Images: covers and Portfolio photos are served at their uploaded size in V6; the upload screen downsizes photos to ≤ 1600 px long edge, WebP/JPEG, in the browser before upload. Videos never autoplay; they load on tap with the poster frame.
- `syncListing` rewrites at most (1 + number of verified Trades) rows per Fundi.

---

## 14. Changes to earlier decisions

| Earlier rule | Where | Change | Recorded as |
| --- | --- | --- | --- |
| "Clients have no account. `/fundis` lists Verified Fundis only." | D-2 | **Kept**, and extended: `/fundis` filters by Trade, county and area; Listing adds `publicListing` and Admin hide; Clients can reveal an opted-in phone and file reports without an account. | D-18, D-19 (amend D-2) |
| Public profile **hides** phone and videos | spec §7, PRD US-5.7 ("contact details hidden in MVP") | Phone is shown **only** on tap and only if the Fundi opted in. Public **Portfolio** photos/videos are shown if the Fundi published them. Assessment videos stay hidden. | ADR-20, ADR-21, D-20 |
| "search and a geohash index" out of scope | spec §12 | **Filter search** (Trade, county, free-text area via a Convex search index) is in scope for V6. Geohash, maps, distance and free-text search over names or bios stay out. | D-18 |
| "Badges derived, never stored" | spec §5, D-1 | Still true as a source of truth. The `listings` table stores a **derived projection** of Badges for search, rebuilt by one helper. | ADR-22 |
| "Only an in-app video earns a Badge"; showcase links never downloaded | ADR-7, CONTEXT "Showcase link" | Unchanged; the new "Showcase" group (links + Portfolio) is labelled not verified. | CONTEXT |
| Consent in two languages applies to verification consent only | AGENTS rule 5, C-11 | The **Portfolio publish consent** also ships in English and Kiswahili. | D-21 (Architect proposal, Q-2) |
| "No identifiable faces" in photos | DESIGN.md, HANDOFF §4 | Still governs Smart Fundis' own imagery. User Portfolio content follows the faces rule in §8.2. | D-22 |
| Onboarding helper "PHONE NUMBER — Never shown publicly." | `design/stitch/prompts/15-onboarding-fundi-profile.md` | Becomes "Hidden unless you turn on 'Show my phone to clients'." and the privacy readout adds "PUBLIC IF YOU CHOOSE · phone, work photos and videos". Designer updates the prompt in the V6 design ticket. | V6 ticket |
| `/trades` is a Fundi-facing "Verify now" catalogue | V3 #22, prompt 03 | Becomes the Client entry ("Find a fundi" first, "Verify now" second). | V6 ticket |
| `/fundis` and styled `/f/[id]` in V3 | spec §9, V3 brief | Move to V6; V1 keeps an unstyled `/f/[id]`. | D-23 |

---

## 15. Out of scope (V6 and the MVP)

- Client accounts, saved searches, favourites
- in-app messaging or chat; call and WhatsApp leave the app
- bookings, quotes, M-Pesa, deposits, escrow, Fundi Pro
- reviews, ratings, stars, "top fundi", sorting by price or rating
- maps, geohash, "near me", distance (ADR-6 stays post-MVP)
- free-text search over names or bios
- OTP verification of the phone number
- AI on Portfolio content (face detection, quality scoring, auto-tagging)
- showing reveal or view counts to anyone except Admins via the database
- Portfolio for Experts; publishing Assessment videos
- an appeal flow for Admin hides (email contact only)
- Kiswahili UI (apart from the two consent screens)

Post-MVP items that Clients could mistake for live features (Client accounts, bookings and M-Pesa) stay on `/roadmap`, tagged "Coming soon".

---

## 16. Open questions for the operator

| # | Question | Recommendation |
| --- | --- | --- |
| Q-1 | Should Fundis with **no Badge** ever appear (for example, a "Not yet verified" section behind a toggle, so mechanics can be found before the Mechanic Rubric exists)? | **No for V6** (D-19). Revisit once a third Trade is live. |
| Q-2 | Does the Portfolio publish consent ship in English **and** Kiswahili (like verification consent)? | **Yes** (D-21). It is consent to being public, which is the higher-risk kind. |
| Q-3 | Is tap-to-reveal + rate limit enough, or add Cloudflare Turnstile (a site key in `web/`, a secret in Convex env) on reveal? | Ship without Turnstile; add it if `contactReveals` shows bulk harvesting. |
| Q-4 | Should `linkedin`, `cv` and `portfolio` links become public on the profile? Spec §7 lists only YouTube/TikTok Showcase. | Keep them private for V6; a CV link can leak a home address. |
| Q-5 | Should real `/f/[id]` pages be indexed by search engines? | Yes for real profiles (phone is never in HTML), `noindex` for Demo profiles. |
| Q-6 | How does a Fundi dispute an Admin hide? | The contact email in V6; a formal flow later. |
| Q-7 | Does V6 need to be ready before the V5 demo freeze (V5 says "`/fundis` shows ~20 Demo profiles")? | No. V6-1 (projection + unstyled `/fundis`) can be pulled forward right after V1 if the demo needs `/fundis`; the rest is post-freeze. |
