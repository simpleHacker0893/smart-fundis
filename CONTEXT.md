# Smart Fundis — Glossary

This file is the canonical domain language. Use these terms in code, specs, docs and UI copy. The aliases listed under a term are to be avoided, except where a term notes a marketing exception.

## People

### User
Anyone signed in. A User's roles are **derived**, never chosen freely:
- A User is a **Fundi** if they set up a Fundi profile.
- **V2 (ADR-23, D-33 proposed):** a User is a **Client** while they have a Client profile. A User with neither profile has no base role yet (the MVP's *none*), and onboarding asks which to create.
- A User is an **Expert** while an Admin has approved them for at least one Trade and that approval is active.
- A User is an **Admin** if their email is on the admin allow-list.

One User can hold several roles at once. For example, an Expert can also be a Fundi.

### Fundi
A skilled or semi-skilled tradesperson (jua kali worker) who uses Smart Fundis to prove their skills in one or more **Trades** and to be found by **Clients**.
*Avoid:* worker, artisan, provider.

### Client
A person or business looking to hire a Fundi. **From V2 a Client has an account** (D-30), with a Client dashboard and Jobs they post. **V2 (operator V2-Q7; ADR-23 proposed):** a User is a Client once they create a **Client profile**; the role is derived, never stored; one User can be both Fundi and Client, but a Fundi never responds to their own Job. In the MVP (V0–V6) a Client had no account: they browsed every Listed Fundi (verified first), filtered by Trade, county, area and "Verified only", and revealed an opted-in Fundi's phone, all anonymously. Bookings stay post-MVP.
*Avoid:* customer, hirer.

### Expert
A skilled tradesperson whom an **Admin** has approved to review **Assessments** in specific **Trades**.
- An Expert never reviews their own Assessments.
- An Expert never decides an **Appeal** against their own decision.
- The marketing call to action "Become a verifier" is the only place the word *verifier* appears.

*Avoid:* verifier, assessor, expert verifier.

### Expert application
A User's request to become an Expert. It states the Trades, credentials, years of experience and a statement. An Admin approves it (choosing which Trades) or rejects it with a reason.

### Admin
A platform operator identified by the admin email allow-list. An Admin approves Experts, manages Trades and Rubrics, and can override any decision with a recorded reason.

## Work and judgement

### Trade
A field of work, such as Electrical or Hairdressing. A Trade has one or more Tasks.
In Client-facing copy a Trade may be called a "trade" or "type of work", never a "category"; `trades.category` is an internal grouping (skilled, semi-skilled, odd job).

### Task
One specific, observable job within a Trade that a Fundi records on video, for example *Electrical: Install a 13A socket*.

### Rubric
The versioned checklist of **Rubric items** used to judge one Task. Each Rubric item is a single observable step. It is marked **safety** when getting it wrong can hurt someone.

### Liveness code
A fresh 3-digit code shown to the Fundi just before recording, to prove the video was made for this Assessment.
- The Fundi writes it on paper and shows it to the camera, then does the work in one continuous shot.
- Every Assessment gets its own code, and a reshoot gets a new one.

### Assessment
One attempt by a Fundi to prove one Task with **one** in-app video. It carries the Liveness code, the AI's Observations and Verdict, and the Expert's decision. An Assessment moves through these statuses:
`queued → analyzing → awaiting_review → approved | reshoot | rejected`, plus `failed`.
- **Reshoot:** a new video is needed. This happens either because the video-quality guard rejected it (too short, too long, too dark, or too low resolution), with a specific reason, or because an Expert asked for one.
- **Failed:** a *system* error, never the Fundi's fault. Processing is retried once. After two failed attempts the Assessment is `failed`, and the Fundi sees "Something went wrong on our side — please record again".
- **After a reshoot or failure:** the Fundi records a **new Assessment** that links back to the previous one and has a new Liveness code. The old Assessment stays as history.
- **Appeal:** only a `rejected` Assessment can be appealed, once, with a reason from the Fundi. It follows `rejected → appealed → approved | rejected`.

### Appeal
A Fundi's one-time challenge to a rejection. A **different** Expert in the same Trade decides it, or an Admin if there is no such Expert. The appeal decision is final, and there is no time limit in the MVP.

### Observation
The AI's finding for one Rubric item within one Assessment. It records `yes`, `no` or `unclear`, a one-line piece of evidence, and the moment in the video where the evidence appears.

### Verdict
The AI's overall *recommendation* for an Assessment: `pass`, `needs_review` or `fail`, with strengths, gaps and feedback. A Verdict is never a decision. Only an Expert decides.
While an AI `pass` has no Expert decision yet, the Fundi sees "Awaiting expert review" and the public sees nothing. **V2 (D-50):** the Fundi sees that same line for **every** Verdict until the Expert decides (see **Awaiting expert review**).

### Badge
The public proof that a Fundi's Assessment for one Task was approved. It reads:
**"Verified by Smart Fundis — <Trade>: <Task> · <date>"**.
- A Badge is **derived** from an approved Assessment. It exists because of an Expert approval, an approved Appeal, or an Admin override.
- An Admin override away from `approved` removes the Badge.
- If the Fundi asks for the video to be deleted, the Badge stays and displays normally. The decision record is the proof.
- There are no badge tiers.

*Avoid:* certificate, certified, tier.

### Verified Fundi
A Fundi with at least one Badge. In the MVP, Verified Fundis come first in **Find a fundi**, but they are not the only Fundis listed (see **Listing**). **V2 (D-44, D-48 proposed):** Fundi Pro ranks first on most Trades; on Electrical and Solar, verified still comes first.

### Listing
A Fundi's presence in **Find a fundi**. A Fundi is **Listed** when they have a Fundi profile, "Show my profile in Find a fundi" (`publicListing`) is on, and an Admin has not hidden the profile. A Badge is **not** required: verification is shown, not required. Only Listed Fundis appear on `/fundis` and have a public profile at `/f/[id]`. A Listing matches a Trade filter for the Trades the Fundi declared or holds a Badge in. In the MVP, Verified Fundis sort first, and a "Verified only" chip hides the rest. **V2 (D-44, D-48 proposed):** the order is Pro verified → Pro not yet verified → verified → Demo → not yet verified, except on Electrical and Solar, where it is verified Pro → verified → Demo → not-yet-verified Pro → not yet verified. The "Verified only" chip stays.
*Avoid:* ad, post, advert, directory entry.

### Not yet verified
The neutral label on a Listed Fundi with no Badge and no Expert verifier mark. In a Trade filter, "Not yet verified in <Trade>" marks a Trade the Fundi declared but holds no Badge in. It states a fact about Smart Fundis, not a judgement of the Fundi: it is shown in dim text, never in amber or a warning style, and never implies a rejection or a pending review.
*Avoid:* unverified, unapproved, pending, failed.

### Expert verifier mark
The label "Expert verifier · <Trade>" on the card and profile of a Fundi who is also an active Expert for that Trade. It is derived from the Expert approval, never stored on the profile, and kept visually separate from skill Badges (no ✓). It counts as verified for sorting and the "Verified only" chip in that Trade. It never says "certified".
*Avoid:* certified assessor, expert badge.

### Video deletion
A Fundi can delete the video of their own Assessment once it reaches a final status (`approved`, `reshoot`, `rejected` or `failed`). Before that, deletion is blocked with the note "You can delete once review is finished". Deletion removes the video. The decision record and any Badge remain.

### Data Co-op
A **future** program (on the Roadmap) in which Fundis could earn from their skills. Examples include licensing recordings, paid recording tasks and annotation work. It does not exist in the MVP.
- Joining the Co-op will need its own specific consent in the Pilot.
- A verification video is never added to the Co-op after the fact.

*Avoid:* implying the Co-op is live, or quoting any earnings figures.

### Co-op interest
A Fundi's optional "Tell me when it launches" signal, which is off by default. It means "contact me" and nothing more. It is **not consent** to any use of their videos, and it is kept separate from verification consent.

### Verification consent
The Fundi's agreement, shown in English and Kiswahili before any upload, that covers **verification only**: who sees the video, AI plus human review, and deletion. It never covers the Data Co-op.

### Demo profile
A made-up Fundi created only by the demo seed, with an invented name, an initials avatar, no photo or video, no Portfolio items, no phone number and no Expert verifier mark. Every Badge on a Demo profile, and the profile itself, is visibly tagged **"Demo: not a real verification"**. Demo Assessments never enter an Expert's queue.

### Demo Client
A made-up Client account created only by the demo seed (D-31), with an invented name and mock data such as Jobs. It holds no real person's details and is visibly tagged **"Demo"**.

### Awaiting expert review
The one neutral status line a Fundi sees after the AI has run and before an Expert decides. **V2 (D-50):** it is shown for every Verdict, and nothing hints at the Verdict, the `needs_review` cap or a safety flag until the decision. "The AI noticed…" appears only after a reshoot or reject decision (D-52).
*Avoid:* "AI passed", "almost there", "pending approval".

### Showcase link
A YouTube, TikTok or other portfolio link that a Fundi adds to their profile. It is labelled "Showcase — not verified" and never earns a Badge.

### Showcase
Everything on a public profile that shows a Fundi's work **without** verifying it: Showcase links and public Portfolio items. Showcase is always labelled "not verified". Only a Badge is verified work. LinkedIn, CV and personal-portfolio links are public only when the Fundi turns each one on.

### Portfolio item
A photo or video of their own work that a Fundi uploads to show Clients. It is **private until the Fundi publishes it**, which needs the Portfolio publish consent and a confirmation that everyone recognisable agreed. It is labelled "Not verified", never earns a Badge, and is never an Assessment video. The Fundi can unpublish or delete it at any time, and an Admin can hide it.
*Avoid:* gallery, verified work, proof.

### Portfolio publish consent
The Fundi's agreement, shown before their first Portfolio item goes public, that the item will be public, is not verified, is not used for AI or the Data Co-op, and can be removed at any time. It is separate from Verification consent.

### Rates
A Fundi's own asking prices (up to five lines, each a label, an amount in KSh and a unit such as per job or per hour), shown on the public profile as "Set by the fundi — not verified" with the date. Smart Fundis never suggests, compares or sorts by Rates. Rates are not earnings figures. **V2 (ADR-26 proposed):** Budgets follow the same rule: shown with their owner, usable as a filter, never a ranking.
*Avoid:* price list, quote, fee.

### Contact reveal
Showing an opted-in Fundi's phone number to a Client after the Client taps Call or WhatsApp. The number is never on the page until the tap, reveals are rate-limited, and a Fundi who hasn't turned on "Show my phone to clients" has no contact button at all.
**V2 (D-46 proposed):** the MVP's anonymous reveal is retired. Every reveal (Call, WhatsApp, Pay-to) goes through one `contact.reveal` mutation behind **`requireClient`**: the caller needs a Client profile with a phone, 18+ confirmed and the terms accepted. A per-Fundi cap of 100 reveals a day counts across all three channels, and each reveal is logged in `contactShares`.

### Report
A Client's anonymous flag on a profile or Portfolio item (for example stolen work, a wrong number, or someone shown without their consent). An Admin dismisses it or hides the item or profile, with a recorded reason.

### Roadmap
The one public page that lists post-MVP features, each tagged "Coming soon": bookings & M-Pesa, Fundi Pro, Data Co-op, training partners and Client accounts. **V2 (proposed):** Fundi Pro leaves when the payments sprint ships it; Enterprise Pro, in-app chat for subscribers and AI voice search join. Nothing outside this page may suggest those features are live. Client accounts leave this page when the V2 feature ships (D-30). **V2 (D-41 proposed):** "bookings & M-Pesa" becomes "escrow & in-app payment to fundis", because Clients pay Fundis directly and M-Pesa is used only for Smart Fundis' own fees.

## Marketplace (V2, proposed)

These terms come from the V2 specs (`docs/superpowers/specs/2026-09-26-v2-marketplace-design.md`, `…-v2-payments-design.md`). They are marked proposed until the operator approves the specs.

### Job
A Client's description of work they need, for one Trade in one place, with an optional Budget. It moves `draft → open ⇄ shortlisted → hired → done`, or ends `expired`, `cancelled` or `removed`.
*Avoid:* gig, task (Task is a Rubric term), request, order, booking.

### Job board
The public list of open Jobs at `/jobs`. It shows only Trade, title, county · ward, Budget, age and a response bucket.

### Interest
A Fundi's "I'm interested" on an open Job, with an optional short note. It carries no price.
*Avoid:* bid, application, proposal, quote.

### Shortlist / Hire
A Client's marks on Interests. Hiring one Fundi closes the Job to the others.

### Budget
The Client's own price for a Job, labelled "Budget set by the client".

### Pay-to details
A Fundi's self-declared M-Pesa **Pochi la Biashara** or **Till** number and account name. Clients pay Fundis directly; Smart Fundis never handles the payment. A Fundi needs them to respond to Jobs, not to register or get verified. Only the Client who hired that Fundi sees them, through a logged reveal; they are never public (a Pochi number is a phone number).

### Contact (V2)
Always Client → Fundi. A Client (anyone passing `requireClient`, D-46) can reveal the phone of a Fundi who opted in, open a Fundi Pro's WhatsApp link, and, once they hire a Fundi, see that Fundi's Pay-to details, all through **Contact reveal**. A Client's phone number and WhatsApp are never shown to a Fundi. In-app chat is a later, subscriber-only phase.
*Avoid:* wallet, account, payment method.

### Fundi Pro
A Fundi's monthly subscription paid to Smart Fundis by M-Pesa STK Push (renewed by hand, with a reminder 10 days before it lapses). It puts the Fundi first in Job responses and in Find a fundi, always with the **Fundi Pro tag** and the legend "Pro = paid subscription, not a verification", and shows their WhatsApp link to signed-in Clients. It never creates or implies a Badge, never uses "Verified by Smart Fundis", the ✓ or amber, and is never a role. It ships with the payments sprint; before that, nothing "Pro" appears. It replaces the old Roadmap item of the same name.
*Avoid:* premium, top, featured, recommended, verified Pro, promoted.

### Fundi Pro tag
**V2, proposed (D-47).** The disclosure on every boosted result and on `/f/[id]`: **"FUNDI PRO · PAID"** in English, **"FUNDI PRO · AMELIPIA"** in Kiswahili (native-speaker check, R-20). A dashed outline with a receipt icon, never ✓ or amber; a 48 px button that opens the explanation of what Pro is. The Kiswahili legend never says "usajili".
*Avoid:* "Pro" alone, premium badge, featured.

### Enterprise Pro
A **future** Client subscription (on the Roadmap only) for Clients who post large-scale or many Jobs, including project management. Not in V2.

### Service area
Where a Fundi works: a Location and a radius (5, 10, 25 or 50 km).

### Location
County, optional sub-county and ward, optional landmark (Jobs), and optionally the device's position snapped once to about 1 km. The position is never returned or shown, but others can tell roughly which area it is in (about 1 km, D-55). A Client profile stores none, and a Job's pre-hire band uses its ward centre (see **Ward-centroid band**).
*Avoid:* address, pin, GPS.

### Ward-centroid band
**V2, proposed (D-55).** The Distance band shown for a Job before hire, and on the public board, computed from the centre of the Job's ward, never from the Client's own position. A Client profile stores no position. Results sort by band, never by exact km, and the server snaps every query position to ~1 km first. Copy says others can tell "only roughly which area (about 1 km)".

### Distance band
How far apart two Locations are, shown only in steps: "Within 2 km", "2–5 km", "5–10 km", "10–25 km", "25–50 km", "Over 50 km", or "In <County>".

### Test mode
The label on every payment surface while M-Pesa runs on the Daraja sandbox: "Test mode — no real money".
