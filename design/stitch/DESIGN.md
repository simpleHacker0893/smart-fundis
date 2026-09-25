# Smart Fundis — Design System

Every Stitch prompt includes the **DESIGN SYSTEM (REQUIRED)** block below word for word. The frontend turns these values into Tailwind and shadcn tokens.

## DESIGN SYSTEM (REQUIRED)

- **Platform:** mobile-first responsive web (PWA). Design at **360 px** wide first, then 768 px and 1280 px.
- **Theme:** light and warm. Confident, plain and human, with generous whitespace and no startup hype.
- **Background:** Warm White (#FFFFFF). Soft Sand (#F7F5F0) for alternating sections.
- **Primary brand:** Fundi Green (#0B5D3B) for headings, links, the secondary-button border and icons.
- **Accent fill:** Kazi Orange (#F28C28), **only as a background fill** (primary buttons, chips, highlights), always with Near Black (#1A1A1A) text on top. **Never use orange as a text colour**, and never put white text on orange: both fail contrast at 2.45:1.
- **Text:** Near Black (#1A1A1A) for body and headings, Slate (#4B5563) for secondary text.
- **Surface:** Mist (#EEF5F1), a pale green for cards and the Badge background.
- **Typography:** Plus Jakarta Sans in weights 400 and 700 only.
  - Hero headline: 36/40 px on mobile, 56/60 px on desktop.
  - Section titles: 24 px.
  - Body: 16 px, line height 1.5.
  - No text smaller than 14 px.
- **Buttons:** 12 px corner radius and at least 48 px tall.
  - **Primary:** Kazi Orange fill with Near Black bold label.
  - **Secondary:** white fill, 2 px Fundi Green border, Fundi Green label.
  - Full-width at 360 px.
- **Cards:** 16 px radius, 1 px border (#E5E7EB), no heavy shadows.
- **Icons:** Lucide line icons at 24 px, in Fundi Green.
- **Imagery:** real, documentary-style photo close-ups of hands, tools and work. **No identifiable faces, no text inside images, no logos.** Photos are allowed only in the hero, the "Coming next" section, empty states and onboarding tips. Everything else uses icons.
- **Accessibility:**
  - WCAG 2.2 AA contrast.
  - Tap targets at least 48 px.
  - A visible focus ring (2 px Fundi Green, 2 px offset).
  - Icons never carry meaning alone; every icon has a text label.
- **Honesty rules:**
  - Always "Verified by Smart Fundis", never "certified".
  - No counters, statistics, ratings or testimonials.
  - Post-MVP features appear only with a "Coming soon" tag.
  - Any sample Badge carries an **"Example"** tag.

## Principles

1. **Proof over promises.** Show what verification looks like, and say exactly what we check and what we don't.
2. **Fast on 4G.** One photo per screen at most. The hero image is ≤ 70 KB WebP/AVIF, loaded with `fetchpriority="high"`. Icons are inline SVG.
3. **Text first on mobile.** The headline and buttons render before the image, and no text is laid over photos at 360 px.
4. **Nothing looks live that isn't.** Coming-soon items are plain tiles with a text chip, never greyed-out disabled buttons.
5. **Respect the fundi.** Use plain words, speak to the fundi directly ("your work, your badge"), and avoid jargon.
