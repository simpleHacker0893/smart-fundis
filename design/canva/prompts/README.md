# Canva image prompts

There is one file per image slot. Stitch screens show these slots as grey placeholders, and the frontend swaps in the final files.

| Slot | File | Used in | Round |
| --- | --- | --- | --- |
| `hero` | `hero.md` | Landing hero | 1 |
| `coop-teaser` | `coop-teaser.md` | Landing, "Coming next" | 1 |
| `paper-code-tip` | `paper-code-tip.md` | Upload tips and onboarding | 2 |
| `fundis-empty` | `fundis-empty.md` | `/fundis` empty state | 2 |

## Rules for every image
- Show hands, tools and work only. **No identifiable faces.**
- **No text, letters or numbers inside the image.** The only exception is the handwritten paper code in `hero` and `paper-code-tip`, and it must be exactly 3 digits.
- No logos, brand names or branded hardware.
- Warm natural light, a documentary feel, and a real Kenyan jua kali or home setting. Colour accents are Fundi Green `#0B5D3B` and Kazi Orange `#F28C28`.
- Keep the subject in the **centre third**, so a 360 px crop still works.

## How to run (Canva, through Claude or by hand)
1. Generate with Canva **generate-image** using the prompt and aspect ratio in the file. Make 2–3 variants and pick one.
2. **Export at full size.** Plain asset links only give thumbnails. Instead, insert the chosen image into a blank Canva design at the target size (for example 1440×1080 for 4:3), then export that page as PNG.
3. Convert the PNG to **WebP (and AVIF), ≤ 70 KB at 720 px wide**, and save it as `web/public/images/<slot>-720.webp`. Also make 360w and 1080w versions for `srcset`.
4. Add a row to `design/LOG.md`.
