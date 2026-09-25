# 15 — Onboarding: your fundi profile

> **Updated for V6-0a (2026-09-26): see "Update v2" at the end of this file.** It changes the trades group, the phone helper, the visibility helper and the privacy readout, and restates the full prompt with the v3 shell for generation. The text directly below is the V3 version, kept as history.

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

---
---

# Update v2 — V6-0a (Find a Fundi), 2026-09-26

## What changed and why (read first)

Source: `docs/superpowers/specs/2026-09-26-find-a-fundi-design.md` §5, §8.1, §8.4, §14 (rows "Fundis declare only Verify-now Trades" and "Onboarding: phone … visibility helper"); D-24.

| Part | Was (V3) | Now (V6) | Why |
| --- | --- | --- | --- |
| "03 — YOUR TRADE" | two chips (Electrical, Hairdressing) and "More trades are coming soon." | **all 12 trades** as chips; Electrical and Hairdressing carry a small mono tag "VERIFY NOW"; one dim line explains which trades can earn a badge | a Fundi may declare any of the 12 Trades; only Trades with a Rubric can earn a Badge (D-24) |
| Phone helper | "Never shown publicly." | "Hidden unless you turn on 'Show my phone to clients'." | contact is opt-in and revealed on tap (ADR-21); the switch itself lives in "My public profile" |
| Visibility helper | "Your profile only appears once you have a badge." | "Clients can find you now. Badges appear once an Expert approves your video." | every Listed Fundi appears; verification is shown, not required (D-24, spec §5) |
| Privacy readout | PUBLIC / PRIVATE | PUBLIC / **PUBLIC IF YOU CHOOSE** / PRIVATE | phone, work photos and videos, and LinkedIn/CV/portfolio links are public only by opt-in (ADR-20, ADR-21, D-26) |
| "04 — LINKS" readout | all five links "appear on your profile as showcase only" | YouTube and TikTok are showcase; LinkedIn, CV and portfolio links stay private until the Fundi switches each one on | per-link opt-in (Q-4, D-26) |
| Shell | `00-shell-v2.md` (menu sheet, bottom tabs, big footer) | the v3 two-row header and the compact 4-column footer, inline below | operator decision 2026-09-25 (HANDOFF §0) |

**The phone and link switches are not on this screen.** They live in "My public profile" (`/fundi/profile`, prompt 22, V6 rest phase). Onboarding only states the default honestly.

---

## Stitch prompt (generate from here to "COMMON MISTAKES")

- **Route:** `/onboarding`, the Fundi profile step. US-2.3; fields from `fundiProfiles`.
- **Device:** generate with **DESKTOP**, so both layouts render. Responsive web app, designed for 360 px first.
- **Active nav item:** none. The header shows the signed-in avatar (initials in a small square with a hairline border) in place of "Sign in" and "JOIN".
- **English only.** No Kiswahili and no language switcher.

### Fidelity constraints

- **No photos on this form** except the one narrow desktop-only evidence frame in item 8. No photo at all on mobile.
- **Never "certified".** Never "unverified", "pending" or "not approved". No counts, ratings or statistics.
- **Nothing looks live that isn't.** "Verification coming soon" and "COMING SOON" are plain dim readouts, never disabled controls, never faded.
- **Amber is punctuation only:** the active step marker, section-label dots, the selected-chip outline, the "Save and continue" fill, the ◐ on validation messages and the focus ring. No green, no red.
- **Mono text 12 px or larger.** Tap targets at least 48 px. No horizontal scroll at 360 px.

### SHELL (v3; draw exactly this)

**Tokens:** background graphite `#050609`; panels `#0B0D12`; 1 px hairlines `rgba(242,244,247,.10)`; text `#f2f4f7`; secondary text `rgba(242,244,247,.55)`; the only accent amber `#ef9a57`. Inter for display and body (tight headlines, weight 500–600); JetBrains Mono for readouts, UPPERCASE, 0.26em tracking, 12 px minimum. 4 px radius panels; pill buttons at least 48 px tall; no shadows; faint grain.

**Header, mobile (< 768 px): two rows, sticky, blurred dark, hairline under.** Row 1 (48 px): the evidence-frame logo (four corner reticle brackets with an amber check inside) and the lockup "SMART FUNDIS" over the dim mono tag "VERIFIED SKILLS"; on the right, the initials avatar (48 px hit area). Row 2 (44 px, always visible): the mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY, all dim (none active). No menu sheet, no bottom tab bar.

**Header, desktop (≥ 1024 px): one 72 px row.** Logo lockup; mono nav EVIDENCE · TRADES · TELEMETRY · COMPANY ▾ (About, Contact us); the initials avatar on the right.

**Footer (compact):** one 1 px hairline on top; four columns with mono amber headings and light-grey links — **FOR FUNDIS:** Join as a fundi · How verification works · Your privacy; **FOR CLIENTS:** Find a fundi · What 'verified' means; **FOR EXPERTS:** Become a verifier; **COMPANY:** About · Contact us · Pricing · Responsible AI · Roadmap. A 2 × 2 grid on mobile, 4 columns on desktop. Bottom line in dim mono: "© 2026 Smart Fundis · We verify skills. NITA, KNQA and TVETs certify." and "Email: info@smartfundis.com". No "Show your work." band, no giant wordmark.

### PAGE

1. **Step readout:** "01 ACCOUNT ✓" · "02 PROFILE" (active, amber marker) · "03 CONSENT" · "04 RECORD".
2. **Header:** mono label "SESSION / FUNDI PROFILE" and the headline "Tell clients who you are."
3. **Form as an instrument panel**, mono field labels, 48 px dark inputs, hairline borders, four hairline-separated groups:
   - **"01 — YOU":** "DISPLAY NAME"; "PHONE NUMBER" with the dim helper **"Hidden unless you turn on 'Show my phone to clients'."**
   - **"02 — WHERE YOU WORK":** "COUNTY" (select, "Choose a county", all 47 counties); "AREA" (text, placeholder "Estate or town, e.g. Ruiru"), helper "Clients search by county and area."
   - **"03 — YOUR TRADES":**
     - "TRADES" as **12 toggle chips** (48 px tall, wrapping; 2 per row on mobile, 4 per row on desktop): Electrical, Hairdressing, Plumbing, Masonry, Carpentry, Welding, Mechanic, Tailoring, Beauty, Solar installation, Mama fua (laundry), Movers. Draw **Electrical selected** (amber 1 px outline, white label, a small filled square indicator) and **Plumbing selected**; the rest unselected (hairline border, dim label).
     - **Electrical and Hairdressing** each carry a small outlined mono tag **"VERIFY NOW"** inside the chip, after the name (white, not amber).
     - Under the chips, one plain dim readout line (not a link, not a button): **"Pick every trade you work in. For now you can earn a badge in Electrical and Hairdressing. In the other trades, clients see 'Not yet verified' until verification opens."**
     - "YEARS OF EXPERIENCE" (number input); "LANGUAGES YOU WORK IN" (checkbox chips: English, Kiswahili, Other); "ABOUT YOUR WORK" (textarea, helper "Up to 300 characters.").
   - **"04 — LINKS (OPTIONAL)":** "YOUTUBE", "TIKTOK", "LINKEDIN", "CV LINK", "PORTFOLIO LINK". Under them, two readout cards:
     - mono tag "SHOWCASE — NOT VERIFIED": "YouTube and TikTok links appear on your profile as showcase only. Only a video recorded in the app can earn a badge."
     - mono tag "PRIVATE UNTIL YOU CHOOSE": "LinkedIn, CV and portfolio links stay private. You can show each one on your profile later."
4. **Visibility row:** a 48 px switch, on by default: "Show my profile in Find a fundi". Dim helper: **"Clients can find you now. Badges appear once an Expert approves your video."**
5. **Privacy readout** — a bordered ledger of three hairline rows, mono label left, dim value right:
   - "PUBLIC · name, county and area, trades, experience, languages, bio, badges, YouTube and TikTok links"
   - **"PUBLIC IF YOU CHOOSE · phone, work photos and videos, LinkedIn, CV and portfolio links"**
   - "PRIVATE · email, verification videos, AI feedback"
6. An amber pill "Save and continue", then an outlined pill "Back". Full width on mobile.
7. **States to draw as extra frames:**
   - **Validation error:** "DISPLAY NAME" empty and no trade picked. Each field gets a hairline amber border and an inline message with ◐: "Add your name." and "Pick at least one trade."
   - **Saving:** the primary pill reads "Saving…" with a thin amber progress line along its top edge.
8. **Image (desktop only):** a narrow evidence frame beside the form, meta row "EVIDENCE FRAME: EF-0002" and "PROFILE", holding a grayscale documentary photo of hands on a workbench holding a tape measure. On mobile, no photo; the form starts right under the headline. No faces, no readable text, no logos.
9. The compact footer.

### COMMON MISTAKES

- Showing only two trade chips, or greying out the ten without a rubric.
- A "VERIFY NOW" tag in amber, or a "LIVE" tag.
- The old helpers "Never shown publicly." or "Your profile only appears once you have a badge."
- Drawing a "Show my phone to clients" switch here (it belongs in "My public profile").
- "Certified", "unverified" or "pending" anywhere.

---

## Handoff notes for frontend (not for Stitch)

- **Copy keys (changed or new):** `Onboarding.profile.phoneHelper`, `Onboarding.profile.areaPlaceholder`, `Onboarding.profile.areaHelper`, `Onboarding.profile.trades.verifyNowTag`, `Onboarding.profile.trades.helper`, `Onboarding.profile.links.showcaseTag`, `Onboarding.profile.links.showcaseBody`, `Onboarding.profile.links.privateTag`, `Onboarding.profile.links.privateBody`, `Onboarding.profile.visibilityHelper`, `Onboarding.profile.privacy.{public,publicIfYouChoose,private}`. Remove the old `comingSoon` trades line.
- **Which chips get "VERIFY NOW":** `trades.listForDiscovery` (`verifyNow: true`), not hard-coded.
- **`?trade=` pre-tick** from `/trades` "Verify now →" (prompt 14) still applies, now for any of the 12 slugs.
- **Saving the profile calls `syncListing`** (spec §10.3): the Fundi is listed as soon as this form saves with the switch on, which is why the helper says "Clients can find you now."
- **The "Show my phone to clients" helper** names a switch that ships in V6-5 ("My public profile"). Until then, the phone is simply never public, so the helper stays true.
