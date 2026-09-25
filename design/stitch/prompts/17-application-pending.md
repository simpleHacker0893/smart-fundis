# 17 — Expert application pending

- **Route:** `/application-pending` (signed in; `/dashboard` sends a user here when they have an application and no other role). Spec §4 routing. Slice V4.
- **Device:** DESKTOP, so both layouts render.
- **Active bottom tab:** none. Compact footer. Header with the initials avatar instead of "JOIN".
- Prepend the **SHELL** block from `00-shell-v2.md`.
- **English only.** No Kiswahili and no language switcher.

---

## PAGE

1. **A centred evidence frame** ("APPLICATION" on the left, the ◐ glyph and "PENDING" in accent on the right) with a new grayscale documentary photo of an experienced pair of hands resting beside neatly arranged tools, with a still reticle. No faces, no readable text, no logos.
2. Mono label "EXPERT APPLICATION" and the headline "We're checking your application."
3. Dim line: "An Admin reviews every Expert application. We'll email you when there's a decision."
4. **Readout ledger** (hairline rows, mono labels):
   - "TRADES · Electrical"
   - "SUBMITTED · 25 Sep 2026" (tabular numbers)
   - "STATUS · ◐ Pending"
5. **Buttons:** if the user is also a Fundi, an accent pill "Go to my fundi dashboard"; always an outlined pill "Back to home".
6. **Extra frame, the rejected state:** the right side of the frame header reads "NOT APPROVED" in dim text (no red), the headline "Your application wasn't approved this time.", a readout "REASON · <the Admin's reason>", and the outlined pill "Back to home".
7. The compact footer.

**Rules:** never write "certified". No review-time promise, no counters. Tap targets are at least 48 px.
