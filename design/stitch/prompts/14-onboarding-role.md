# 14 — Onboarding: who are you joining as?

- **Route:** `/onboarding` (signed in; the proxy requires sign-in). Spec §4 "Onboarding", US-2.2.
- **Device:** DESKTOP, so both layouts render (responsive rules in `DESIGN.md`).
- **Active bottom tab:** none. Signed-in onboarding has no bottom tab bar and uses the compact footer.
- Prepend the **SHELL** block from `00-shell-v2.md`, with one change: the header's right side shows a round avatar button (initials only) instead of "JOIN".
- **English only.** No Kiswahili and no language switcher.

---

## PAGE

1. **Step readout** (the same component as `08-sign-up`): "01 ACCOUNT ✓" (done, white tick) · "02 PROFILE" (active, accent) · "03 CONSENT" · "04 RECORD".
2. **Instrument panel:**
   - Mono label "SESSION / ONBOARDING" with a pulsing accent dot, and the headline "How will you use Smart Fundis?"
   - Dim sub-line: "Pick one or both. You can add the other later."
   - **Two large checkbox cards** (not radio buttons, because both can be ticked), each at least 64 px tall with a 24 px checkbox, a bold title and one dim line:
     - "I'm a fundi": "Prove your skill with a short video and earn a badge."
     - "I'm an Expert in my trade": "Review fundis' videos and decide on badges. Admins approve every Expert."
   - When "I'm a fundi" is ticked, a small readout row appears under it: "TRADE · Electrical" as a chip (this shows the `?trade=` pre-selection from the landing page).
   - An accent pill "Continue", full-width on mobile. Under it, the dim line "Next: your profile. It takes about two minutes."
3. **Error state (draw it as a second frame):** "Continue" pressed with nothing ticked. A hairline-bordered message under the cards with an amber ◐ glyph: "Pick at least one to continue."
4. **Evidence frame beside the panel on desktop, above it on mobile at 16:9:** "EVIDENCE FRAME: EF-0001" on the left and "02 PROFILE" on the right. It shows a new grayscale documentary photo of hands laying out tools on a workbench before a job, with a corner reticle. No faces, no readable text, no logos.
5. The compact footer: "We verify skills. NITA, KNQA and TVETs certify. · © 2026 Smart Fundis".

**Rules:** never write "certified". No counters, ratings, testimonials or statistics. Tap targets are at least 48 px. ✓ is white; only ◐ uses the accent.
