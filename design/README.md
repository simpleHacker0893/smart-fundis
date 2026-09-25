# Design: how to run round 1 today

1. **Stitch** (https://stitch.withgoogle.com or the Stitch MCP):
   1. Create a project called **"Smart Fundis"**.
   2. Paste `stitch/prompts/00-header-footer.md`. Generate **Mobile**, then **Desktop**.
   3. Paste `stitch/prompts/01-landing.md` into the same project. Generate **Mobile**, then **Desktop**.
   4. Keep the image slots as grey placeholders.
   5. Export each screen's **HTML** to `stitch/exports/<NN>-<screen>-<mobile|desktop>.html`, and save a **screenshot** next to it as `.png`.
2. **Canva:**
   1. Re-crop the existing hero (`MAHWJcU2HuM`) to 4:3.
   2. Generate `coop-teaser` from `canva/prompts/coop-teaser.md`.
   3. Export both following `canva/prompts/README.md`.
3. Fill in the rows in `LOG.md`.
4. **Bring back:** the screenshots and exports. We review them against the checklist below before round 2 (the other 8 screens).

## Round 1 review checklist
- [ ] At 360 px the headline and both buttons show before the photo, with no text over the photo.
- [ ] No orange text anywhere, and no white text on orange.
- [ ] The sample badge shows **EXAMPLE**.
- [ ] Two live trade tiles with "Verify now", and ten plain "Coming soon" tiles that aren't buttons.
- [ ] The "What we check / What we don't check" section is present.
- [ ] No counters, ratings, testimonials, logos, search box or the word "certified".
- [ ] Tap targets are at least 48 px, with a visible focus ring.
