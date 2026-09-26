# V2-40 — Design the dashboards (every role)

Fresh session. The designer leads, and generation stops at every checkpoint for your approval. It follows the technique in `design/stitch/prompts/`: a CAUSTIC-style build spec per screen, previewed in Stitch before any coding.

```
Dispatch the designer subagent for the Version 2 dashboards. Planning and design only: no app code.

Tell the designer to read AGENTS.md, CONTEXT.md, design/stitch/DESIGN.md (D-9 "Instrument"), the V2 spec,
docs/reviews/v2-architecture.md, planning/slices/V7.md onward (the "Stitch screens" tables), the V2 research
(the competitor UX notes, Kenyan addressing, and the NVIDIA fit section), and three existing prompts as style
references: design/stitch/prompts/13-find-a-fundi.md, 15-onboarding-fundi-profile.md and
17-application-pending.md.

Tell it to load: stitch-design:generate-design, stitch-design:manage-design-system,
stitch-utilities:enhance-prompt, stitch-utilities:taste-design, stitch-utilities:design-md, design:ux-copy,
design:accessibility-review, web-design-guidelines.

Step 1, the dashboard system (stop for my review): add a "Dashboards" section to DESIGN.md covering
- the app shell: a bottom nav at 360 px and a side rail from 1024 px; role switch for users with two roles
- the density rules for data views
- the status chips for Assessment, Job and Listing states
- the "AI evidence" pattern for Cosmos Reason 2 observations (timestamp chip, jump-to-moment, evidence text)
  and Nemotron feedback. It is always labelled as AI output, always shows "An Expert decides", never
  shows a score as a verdict, and never uses NVIDIA branding as ours.
- map rules: an approximate-area circle, not an exact pin, for Fundis; county/area text is always shown too;
  a static-image fallback on slow networks
- the price-label rules ("Set by the fundi — not verified", "Budget set by the client")
- empty, loading, error and offline states
Images are never allowed on dashboards, forms, upload or Expert review.

Step 2, the screen inventory: for every V2 route and state, give the role, the states, the en.json copy keys
and the slice. Minimum set:
- Fundi: dashboard home; the "Add video" sheet (Record / Upload → earns a Badge; YouTube / TikTok link →
  Showcase, not verified); my Assessments with AI evidence and reshoot reasons; Jobs near me (list + map); a
  Job detail with express interest; my profile, Listing and location privacy.
- Client: dashboard home; post a Job (steps: Trade → task → where → budget → photos + consent → review); my
  Jobs and interested Fundis; find a Fundi with a map.
- Expert: queue, review with AI evidence, history.
- Admin: Reports, Jobs moderation, Experts (plain shadcn, no Stitch).

Step 3: one Stitch prompt per screen in design/stitch/prompts/, numbered from 24 and matching the V<n>.md
tables. Run stitch-utilities:enhance-prompt on each one. Stop for my review before any generation.

Step 4, generation, with checkpoints: (a) the app shell + Fundi home, (b) the Add video sheet + Assessment
detail with AI evidence, (c) Client post-a-Job + Jobs near me with the map, (d) the rest. Export mobile and
responsive HTML/PNG to design/stitch/exports/, and log each run in design/LOG.md.

In parallel, dispatch the frontend subagent read-only (vercel-composition-patterns,
vercel-react-best-practices, anthropic-skills:nextjs-expert) to flag anything in the prompts that is hard to
build with Next.js + shadcn + the chosen map library at 360 px, and dispatch rai-reviewer on the copy of the
Add video sheet, the AI evidence pattern, the Job-post consent and the location-privacy screen. Fold their
notes in before generation.

Finish with the design/HANDOFF.md rows for each export, and tell me which slice's prompt 25 can now point to
these exports.
```
