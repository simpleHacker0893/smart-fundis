# 00 — Shared header and footer (round 1)

- **Device:** generate **Mobile** first, then Desktop.
- **Paste everything below the line into Stitch.**

---

The shared header and footer for "Smart Fundis", a trusted, mobile-first web app where Kenyan tradespeople (fundis) prove their skills on video and clients find verified fundis. The style is clean, warm and confident, with generous whitespace.

**DESIGN SYSTEM (REQUIRED):**
- Platform: responsive web, mobile-first at 360 px
- Theme: light, warm, plain and trustworthy
- Background: Warm White (#FFFFFF). Soft Sand (#F7F5F0) for the footer.
- Primary brand: Fundi Green (#0B5D3B) for the logo, links, icons and the secondary-button border
- Accent fill: Kazi Orange (#F28C28), only as a button fill, with Near Black (#1A1A1A) label text. Never orange text, never white on orange.
- Text: Near Black (#1A1A1A); secondary text in Slate (#4B5563)
- Font: Plus Jakarta Sans, weights 400 and 700
- Buttons: 12 px radius, at least 48 px tall
- Icons: Lucide line icons, 24 px, Fundi Green

**Page structure:**
1. **Header, mobile (360 px):** a sticky white bar 64 px tall with a thin bottom border (#E5E7EB). It holds:
   - **Left:** the logo, a simple green shield-and-check mark followed by the wordmark "Smart Fundis" in bold Fundi Green.
   - **Right:** a compact primary button "Join as a fundi" (Kazi Orange fill, Near Black bold text), then a hamburger menu icon button with the label "Menu" for screen readers.
2. **Header, desktop (1280 px):** the logo on the left, and centre nav links "How it works", "Trades", "Find a fundi", then a "More" dropdown. On the right, a text link "Sign in" and the primary button "Join as a fundi". There is no search box.
3. **Open mobile menu:** a full-height sheet sliding in from the right with large 48 px rows:
   - "How it works", "Trades", "Find a fundi"
   - a divider, then a group titled "Coming soon" containing "Data Co-op", "Bookings & M-Pesa", "Fundi Pro" and "Training partners". Each row has a small Soft Sand chip reading "Coming soon" and links to the roadmap page.
   - a divider, then "Sign in", and a full-width primary button "Join as a fundi"
4. **The "More" dropdown on desktop:** the same four roadmap items, each with a "Coming soon" chip.
5. **Footer (Soft Sand background):** on mobile the four columns stack. Each has a bold heading and 16 px links:
   - **For fundis:** "Join as a fundi", "How verification works", "Your privacy"
   - **For clients:** "Find a fundi", "What 'verified' means"
   - **For Experts:** "Become a verifier"
   - **About:** "Responsible AI", "Roadmap", "Contact: team@example.com" (a placeholder, replaced with the real address later)
   - **Bottom row:** a small line, "We verify skills. NITA, KNQA and TVETs certify.", then "© 2026 Smart Fundis".

**Rules:** no search box, no social-proof numbers, no ratings, no language switcher (English only for now). Every tap target is at least 48 px, with a visible green focus ring.
