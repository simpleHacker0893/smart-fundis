# 01 — Landing page (round 1)

- **Device:** generate **Mobile** first, then Desktop.
- **Uses the header and footer from `00`.** Paste everything below the line into Stitch.
- **Image slots:** keep them as **warm grey placeholder blocks** with the slot name written inside. The Canva images replace them later.

---

The landing page for "Smart Fundis — Kazi yako, sifa yako" ("Your work, your reputation"). Kenyan fundis (skilled tradespeople) prove a real skill with one short phone video. AI checks it, a human Expert confirms it, and the fundi earns a public badge that clients can trust. The page should feel trustworthy, warm and human, with plain language, lots of whitespace, and proof shown rather than promised.

**DESIGN SYSTEM (REQUIRED):**
- Platform: responsive web, mobile-first at 360 px (then 1280 px desktop)
- Theme: light, warm, confident, plain
- Background: Warm White (#FFFFFF). Alternate sections in Soft Sand (#F7F5F0).
- Primary brand: Fundi Green (#0B5D3B) for headings, links, icons and the secondary-button border
- Accent fill: Kazi Orange (#F28C28), only as a fill for primary buttons and chips, with Near Black (#1A1A1A) text. Never orange text, never white text on orange.
- Surface: Mist (#EEF5F1) for cards and the badge card
- Text: Near Black (#1A1A1A); secondary text in Slate (#4B5563)
- Font: Plus Jakarta Sans 400/700. Hero headline 36 px on mobile, 56 px on desktop. Body 16 px.
- Buttons: 12 px radius, 48 px tall, full-width on mobile
  - primary: Kazi Orange fill, Near Black bold label
  - secondary: white fill, 2 px Fundi Green border, green label
- Cards: 16 px radius, 1 px #E5E7EB border, no heavy shadows
- Icons: Lucide line icons, 24 px, Fundi Green, always with a text label

**Page structure:**
1. **Header:** the shared header (logo, "Join as a fundi" button, menu).
2. **Hero, text first on mobile:**
   - Headline in Fundi Green, bold: **"Kazi yako, sifa yako."**
   - Value line in Near Black: "Prove your skill with one short phone video. AI checks the work, a human Expert confirms it, and you earn a badge clients can trust."
   - Primary button: **"Join as a fundi"**. Below it on mobile (beside it on desktop), a secondary button: **"Find a fundi"**.
   - Then a 4:3 rounded (16 px) image block: **[image-slot: hero, 4:3 mobile / 5:4 desktop, hands wiring a wall socket with a handwritten paper code visible]**.
   - Overlapping the bottom-left corner of the image, a small card in Mist (#EEF5F1) with a green shield-check icon. The top of the card has a tag reading **"EXAMPLE"**: an orange chip with Near Black text. Below the tag, "Verified by Smart Fundis" in bold, then "Electrical: Install a 13A socket".
   - **Desktop:** two columns, text on the left and the image with its badge on the right.
3. **How it works (Soft Sand background):**
   - Section title: "How verification works"
   - Three numbered steps stacked vertically on mobile (three columns on desktop). Each has a green outlined Lucide icon, a bold title and one line of text:
     1. Icon: video. **"Record your work."** "Write your code on paper, show it to the camera, then do the job in one continuous shot."
     2. Icon: scan-eye. **"AI checks each step."** "NVIDIA AI checks every step of the task and marks where it happens in your video."
     3. Icon: user-check. **"An Expert decides."** "A skilled Expert in your trade makes the final call. AI recommends, Experts decide."
   - Under the steps, a one-line note in Slate: "Your video stays private. Only your badge is public."
4. **Trades:**
   - Section title: "Trades"
   - A 2-column grid of 12 tiles on mobile (4 columns on desktop). Each tile is 16 px rounded with a green Lucide icon and the trade name.
   - The first two tiles are **live**: "Electrical" (icon: plug) and "Hairdressing" (icon: scissors). Each has a Kazi Orange chip with Near Black text reading **"Verify now"**, a green border, and the whole tile is a link.
   - The other ten are **plain muted tiles** (Soft Sand fill, Slate text, no border highlight) with a small text chip "Coming soon". They are **not** buttons and are **not** greyed-out controls: Plumbing, Masonry, Carpentry, Welding, Mechanic, Tailoring, Beauty, Solar installation, Mama fua (laundry), Movers.
5. **What "Verified by Smart Fundis" means (anchor #what-we-check):**
   - Section title: "What 'Verified by Smart Fundis' means"
   - Two cards side by side on desktop, stacked on mobile:
     - **"What we check"**, with green check icons: "Video recorded in the app", "A fresh code shown on camera", "Every step of the task, checked by AI", "Safety steps never passed automatically", "A human Expert in your trade decides".
     - **"What we don't check"**, with neutral info icons: "ID or background", "Licences or insurance", "Formal qualifications. NITA, KNQA and TVETs certify those."
   - Below the cards, a secondary button: **"Skilled in your trade? Become a verifier"**.
6. **Coming next: earn from your skills:**
   - A wide rounded panel with a soft green wash over **[image-slot: coop-teaser, 16:9, hands and tools resting on a workbench, calm]**. The text sits **below** the image on mobile, not on top of it.
   - Title: "Coming next: earn from your skills"
   - A short list, each item with a "Coming soon" chip: "Smart Fundis Data Co-op: earn from your skills, by choice", "Bookings & M-Pesa payments", "Fundi Pro", "Training partners"
   - A text link: "See the roadmap →"
7. **Footer:** the shared footer.

**Rules:**
- No counters, statistics, ratings, testimonials or partner logos.
- Never the word "certified" (except in "NITA, KNQA and TVETs certify").
- No search box.
- No text laid over photos at 360 px.
- The sample badge always shows the "EXAMPLE" tag.
- Every tap target is at least 48 px, with a visible green focus ring.
