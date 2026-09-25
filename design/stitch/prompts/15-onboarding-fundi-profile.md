# 15 — Onboarding: your fundi profile

- **Route:** `/onboarding` (the Fundi profile step, shown first when "I'm a fundi" is ticked). US-2.3; fields from spec §5 `fundiProfiles`.
- **Device:** DESKTOP, so both layouts render.
- **Active bottom tab:** none. Compact footer. Header with the initials avatar instead of "JOIN".
- Prepend the **SHELL** block from `00-shell-v2.md`.
- **English only.** No Kiswahili and no language switcher.

---

## PAGE

1. **Step readout:** "01 ACCOUNT ✓" · "02 PROFILE" (active) · "03 CONSENT" · "04 RECORD".
2. **Header:** mono label "SESSION / FUNDI PROFILE" and the headline "Tell clients who you are."
3. **Form as an instrument panel**, with mono field labels, 48 px dark inputs and hairline borders, in four hairline-separated groups:
   - **"01 — YOU":** "DISPLAY NAME", "PHONE NUMBER" (helper: "Never shown publicly.")
   - **"02 — WHERE YOU WORK":** "COUNTY" (select), "AREA" (text, for example "Ruiru")
   - **"03 — YOUR TRADE":**
     - "TRADES" as two toggle chips: "Electrical" (selected, accent outline) and "Hairdressing".
     - Under the chips, one plain dim readout line (not a link, not a button): "More trades are coming soon." with the mono tag "COMING SOON".
     - "YEARS OF EXPERIENCE" (number input), "LANGUAGES YOU WORK IN" (checkbox chips: English, Kiswahili, Other)
     - "ABOUT YOUR WORK" (textarea, helper "Up to 300 characters.")
   - **"04 — SHOWCASE LINKS (OPTIONAL)":** "YOUTUBE", "TIKTOK", "LINKEDIN", "CV LINK", "PORTFOLIO LINK". Under them, a readout card with the mono tag "SHOWCASE — NOT VERIFIED": "These links appear on your profile as showcase only. Only a video recorded in the app can earn a badge."
4. **Visibility row:** a 48 px switch, on by default: "Show my profile in Find a fundi". Dim helper: "Your profile only appears once you have a badge."
5. **Privacy readout:** "PUBLIC · name, county and area, trades, experience, languages, bio, badges, showcase links" and "PRIVATE · phone, email, videos, AI feedback".
6. An accent pill "Save and continue", then an outlined pill "Back".
7. **States to draw as extra frames:**
   - **Validation error:** "DISPLAY NAME" empty and "TRADES" with none picked. Each field shows a hairline amber border and an inline message with ◐: "Add your name." and "Pick at least one trade."
   - **Saving:** the primary pill shows "Saving…" with a thin accent progress line along its top edge.
8. **Image:** on desktop only, a narrow evidence frame beside the form ("EVIDENCE FRAME: EF-0002", "PROFILE") with a new grayscale photo of hands on a workbench holding a tape measure. On mobile, no photo, so the form starts right under the headline. No faces, no readable text, no logos.
9. The compact footer.

**Rules:** never write "certified". No counters, ratings or statistics. Tap targets are at least 48 px. The "Coming soon" line is plain text, not a disabled control.
