# 16 — Onboarding: apply to be an Expert

- **Route:** `/onboarding` (the Expert application step; it comes after the Fundi profile when both boxes are ticked). US-2.5; fields from spec §5 `expertApplications`. Slice V4.
- **Device:** DESKTOP, so both layouts render.
- **Active bottom tab:** none. Compact footer. Header with the initials avatar instead of "JOIN".
- Prepend the **SHELL** block from `00-shell-v2.md`.
- **English only.** No Kiswahili and no language switcher.

---

## PAGE

1. **Step readout:** "01 ACCOUNT ✓" · "02 EXPERT APPLICATION" (active) · "03 ADMIN REVIEW".
2. **Header:** mono label "SESSION / EXPERT APPLICATION", the headline "Your trade needs judges." and the dim line "Experts make the final call on every badge. An Admin reviews every application before you can review anyone."
3. **Form as an instrument panel** (mono labels, 48 px dark inputs, hairline borders):
   - "TRADES YOU CAN JUDGE": toggle chips "Electrical" and "Hairdressing". Under them, the plain dim line "Other trades: COMING SOON" (plain text, not a control).
   - "YEARS IN THE TRADE" (number)
   - "YOUR CREDENTIALS" (text), with the helper "For example a TVET or NITA assessor ID, or where you trained."
   - "WHY YOU WANT TO REVIEW" (textarea)
   - An accent pill "Submit application", then an outlined pill "Back".
4. **Readout card** with the mono tag "WHAT HAPPENS NEXT": "An Admin checks your application. If approved, you'll see the Expert queue for your trades. You can't review your own videos."
5. **States to draw as extra frames:**
   - **Validation error:** no trade picked, with an inline ◐ "Pick at least one trade."
   - **Submitting:** the pill shows "Submitting…".
6. **No photo on this screen.** It's a form; use a small procedural evidence-frame reticle (hairlines and corner brackets only) beside the form on desktop.
7. The compact footer.

**Rules:** never write "certified". Don't promise a review time. No counters or statistics. Tap targets are at least 48 px.
