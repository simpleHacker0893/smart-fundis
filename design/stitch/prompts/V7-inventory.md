# V7 screen inventory (V2-40 step 2, #45)

- **Scope:** V7 only: the Fundi, Expert and Admin dashboards. V8 screens (Client, Jobs, the bell) are left out on purpose.
- **Rules:** `DESIGN.md` "Dashboards (V2, app mode)" D1–D10, with the categorized sidebar (D-65, proposed) and English only (D-64).
- **Contracts:** marketplace spec §11.0 and §11.1.
- **Date:** 2026-09-27. Status: **draft for operator approval**.

Every screen is drawn at **360 px (mobile)** and **1280 px (desktop)**. Each one draws the loading, empty, error and offline states listed. There's no Kiswahili frame and no language toggle (D-64). Sample data is tagged **EXAMPLE**.

## Navigation map (D2, D-65)

| Role | Sidebar and More sheet: CATEGORY → items | Bottom nav (< 1024 px) | Home route |
| --- | --- | --- | --- |
| Fundi | primary pill **Add video** · OVERVIEW → Home · VERIFICATION → My verifications · PROFILE → Public profile, Showcase links · ACCOUNT → Help, Sign out | Home · Verifications · Profile · More | `/fundi` |
| Expert | REVIEW → Queue · ACCOUNT → Profile, Help, Sign out | Queue · Profile · More | `/expert` |
| Admin | OPERATIONS → Ops · ACCOUNT → Help, Sign out | Ops · More | `/admin/ops` (plain shadcn, no prompt) |

- A user with two or more roles gets the role switch in the avatar sheet and in the sidebar footer. The switch lists only the roles held.
- "Public profile" opens `/f/<id>` (#42).
- "Showcase links" opens the links part of the profile.
- Every menu also has a SMART FUNDIS group (Trades, Evidence, Company) above the footer.
- Role routes show no marketing header or footer: the shell's own header replaces them.

## Screens

| # | Screen | Route | Role | States to draw | `en.json` namespaces | Feeds ticket |
| --- | --- | --- | --- | --- | --- | --- |
| 24 | App shell | every role route | all | Fundi, Expert and dual-role menus; the More sheet; the avatar sheet with the role switch and "Switching…"; skeleton; offline strip; a whole-page error | `shell.*`, `nav.*`, `roleSwitch.*`, `states.*` | #47 (V7-2) |
| 25 | Fundi home | `/fundi` | Fundi | new Fundi (no Assessments, five missing items named); busy Fundi (3 Assessments, "Still to add:" two named items, Listed · Not yet verified); verified Fundi (the Badge line, Listed); the Not showing and Hidden listing states; loading; one card in error | `fundiHome.*`, `completeness.*`, `listingStatus.*`, `chips.assessment.*` | #49 (V7-4), #51 (V7-6) |
| 26 | Add video sheet | a sheet over `/fundi` | Fundi | default (mobile sheet, desktop popover); the link field with a YouTube URL; host error ("Only YouTube or TikTok links"); saving; saved ("Added to Showcase — not verified"); offline ("Needs a connection"); the restyled #38 upload steps; uploading with real progress; upload stopped | `addVideo.*` | #50 (V7-5) |
| 27 | My verifications, list and detail | `/fundi/verifications`, `/fundi/verifications/[id]` | Fundi | the list: every status chip, empty, loading. The detail: `queued`, `analyzing`, `awaiting_review` (drawn twice, identical: AI pass and a capped needs_review), `reshoot` (guard), `reshoot` (Expert), `approved`, `rejected`, `failed`, "Taking longer than usual" as its own frame, list error, detail not found, Show more loading | `verifications.*`, `chips.assessment.*`, `aiPanel.*` | #49 (V7-4) |
| 28 | Expert queue | `/expert` | Expert | queue with a count by Trade and the oldest waiting item; a Trade filter; a row with "Safety check"; empty ("Queue clear"); filtered empty; loading; error | `expertQueue.*` | #53 (V7-8) |
| 29 | Expert review | `/expert/[assessmentId]` | Expert | before playback (AI panel locked); after playback (panel unlocked); "Checked with the backup model"; the liveness block matched and not readable; the decision with a required note (error state); submitting; note too long; submit failed; liveness mismatch; not available; video deleted; video failed to load (panel stays locked, decide still possible) | `expertReview.*`, `aiPanel.*`, `decision.*` | #52 (V7-7), #53 (V7-8) |
| — | Admin ops | `/admin/ops` | Admin | plain shadcn, no Stitch screen (D10) | `adminOps.*` | #54 (V7-9) |

## Copy that is fixed by the spec (do not rephrase)

- Assessment chips (D4): In line · AI checking · Awaiting expert review · Approved · Record again · Not approved · Appeal sent · Error on our side.
- Status lines (§11.0):
  - "Waiting in line for the AI check"
  - "The AI is watching your video"
  - "Awaiting expert review"
  - "Something went wrong on our side — please record again"
  - "Taking longer than usual — you don't need to do anything"
- The Badge line: "Verified by Smart Fundis — <Trade>: <Task> · <date>".
- AI labels:
  - "AI suggestion" and "An Expert decides." for the Fundi.
  - "AI suggestion — you decide" on Expert review only.
  - "The AI noticed…"
  - "The AI couldn't tell"
  - "Watch the whole video to see the AI suggestion."
  - "Checked with the backup model"
- Add video sheet: "Earns a badge once an Expert approves it" · "Showcase — not verified" · "Links never earn a badge."
- Listing chips: "Listed" · "Listed · Not yet verified" · "Not showing" · "Hidden by Smart Fundis".
- The queue marker: "Safety check".

## Copy proposed here (rai-reviewer checks it)

rai-reviewer checked these on 2026-09-27; its wording is used.

- Fundi home: "Get your work verified." (page title), with the dim line "Record a video of one task. The AI checks it, then an Expert decides."
- Completeness: the title "Finish your profile" and "Still to add:", then only the named missing items, with no count (D3.6). The six possible items are: Photo of your work · About your work · Trades · County and area · Languages · First video.
- Empty My verifications: "No verifications yet. Record a video of one task. An Expert reviews it." with **Add video**.
- Empty queue: "QUEUE CLEAR" and "Nothing to review right now. New videos in your trades appear here."
- Appeal: "You can appeal once. A different Expert will review it."
- Showcase: "Only link to videos of your own work."
- **The approved-state intro, signed off by rai-reviewer (D-61)** with this wording: "Practice notes from the AI, for your next video. An Expert approved this video and gave you the badge." It sits above both AI panels. On approved, safety rows read "Show this clearly next time."

## Open points for the operator

1. **D-65** (the categorized sidebar) is proposed. The Architect confirms it.
2. **Fundi "Profile" item:** it points at the existing onboarding form in edit mode, with no new profile screen in V7. The proposal is to reuse `/onboarding` in edit mode.
3. **Expert "History"** isn't in any V7 ticket, so it has been **dropped from the menu** (nothing looks live that isn't). It can come back with a ticket.
4. **Appeal and Delete video** come from MVP V4, which isn't built. They're drawn in 27, marked "V4" in the handoff notes, and hidden until V4 ships.

## For the Architect (from the reviews)

1. **The Expert's note on `approved`:** #41 tells the Expert the approve note is "for the record, not shown to the Fundi", but spec §11.0 shows it to the Fundi on approved. Screen 27 follows #41 and hides it. Please reconcile the spec.
2. **Completeness:** #44 (implementation decision 4) says "4 of 6 done", but DESIGN.md D3.6 and rai-reviewer allow named missing items only. The screens use "Still to add:" with the names. Please update #44.
3. **Approved-state safety rows:** "Show this clearly next time." replaces spec §11.0's fixed "needs a closer look" on approved only (rai-reviewer). This needs a spec amendment.
4. **"An Expert decides."** reads as still pending after a decision. rai-reviewer suggests allowing "An Expert decided." on post-decision panels. The screens keep the spec wording until you decide.
5. **Automation bias:** Expert review shows Observations (including "AI: no") before playback, and only the Verdict is locked. D-51 allows this. The Admin agreement tiles should watch for it.
