# Smart Fundis — Glossary

This file is the canonical domain language. Use these terms in code, specs, docs and UI copy. The aliases listed under a term are to be avoided, except where a term notes a marketing exception.

## People

### Fundi
A skilled or semi-skilled tradesperson (jua kali worker) who uses Smart Fundis to prove their skills in one or more **Trades** and to be found by **Clients**.
*Avoid:* worker, artisan, provider.

### Client
A person or business that browses **Fundis** in order to hire them. A Client is either a *homeowner* or a *business*.
*Avoid:* customer, hirer, contractor (a contractor is one kind of business Client).

### Expert
A skilled tradesperson whom an **Admin** has approved to review **Assessments** in specific **Trades**.
- An Expert never reviews their own Assessments.
- The marketing call to action "Become a verifier" is the only place the word *verifier* appears.

*Avoid:* verifier, assessor, expert verifier.

### Admin
A platform operator who approves Experts, manages Trades and Rubrics, and can override any decision with a recorded reason.

## Work and judgement

### Trade
A field of work, such as Electrical or Hairdressing. A Trade has one or more Tasks.

### Task
One specific, observable job within a Trade that a Fundi records on video, for example *Electrical: Install a 13A socket*.

### Rubric
The versioned checklist of **Rubric items** used to judge one Task. Each Rubric item is a single observable step. It is marked **safety** when getting it wrong can hurt someone.

### Assessment
One attempt by a Fundi to prove one Task. It is made up of a single in-app video, the liveness code spoken in that video, the AI's Observations and Verdict, and finally an Expert's decision. An Assessment moves through these statuses:
`queued → analyzing → awaiting_review → approved | reshoot | rejected`, plus `failed` and `appealed`.

### Observation
The AI's finding for one Rubric item within one Assessment. It records `yes`, `no` or `unclear`, a one-line piece of evidence, and the moment in the video where the evidence appears.

### Verdict
The AI's overall *recommendation* for an Assessment: `pass`, `needs_review` or `fail`, with strengths, gaps and feedback. A Verdict is never a decision. Only an Expert decides.

### Badge
The public proof that an Expert approved a Fundi's Assessment for one Task. It reads:
**"Verified by Smart Fundis — <Trade>: <Task> · <date>"**.
- A Badge exists only because of an Expert approval, or an Admin override. An AI `pass` alone produces no Badge.
- There are no badge tiers.

*Avoid:* certificate, certified, tier.

### Showcase link
A YouTube, TikTok or other portfolio link that a Fundi adds to their profile. It is labelled "Showcase — not verified" and never earns a Badge.
