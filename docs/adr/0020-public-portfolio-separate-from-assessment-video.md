---
status: accepted
date: 2026-09-26
deciders: operator (OD-1), architect
---

# ADR-20: The public Portfolio is separate from Assessment video

## Context

Clients using Find a Fundi want to see real work: photos and videos of what a Fundi has done. The only videos Smart Fundis holds are Assessment videos, and the verification consent (spec §7, PRD §8) promises the Fundi that **only the Badge becomes public**; the video is seen by the Fundi, eligible Experts, Admins and our AI only. Showcase links (ADR-7) exist but are external and never downloaded. We need public work media without breaking the consent promise or blurring what "verified" means.

## Decision

A Fundi gets a **Portfolio**: separate photo and video uploads in a new `portfolioItems` table and separate storage objects, **private by default**, each made public one at a time behind its own **Portfolio publish consent** (English and Kiswahili) and a per-item confirmation that everyone recognisable agreed and no children are recognisable. Portfolio items are always labelled "Not verified", never earn a Badge, are never sent to the AI service, the eval or the Data Co-op, and can be unpublished or deleted at any time. An Assessment video can **never** become a Portfolio item.

## Options considered

### Option A: Publish the approved Assessment video (opt-in)

| Dimension | Assessment |
| --- | --- |
| Complexity | Low: one flag on `assessments` |
| Trust signal | High: the public video is the verified one |
| Consent | Breaks the promise already given; needs re-consent per video |
| Privacy | Assessment videos show the paper Liveness code, workplaces and often faces filmed for Experts, not the public |

**Pros:** strongest proof. **Cons:** retroactively changes what Fundis agreed to; mixes the verification record with marketing; a later "delete my video" would silently remove public proof.

### Option B: Showcase links only (status quo)

| Dimension | Assessment |
| --- | --- |
| Complexity | None |
| Reach | Only Fundis with YouTube/TikTok accounts; many jua kali workers have neither |
| Performance | Third-party embeds are heavy (tap-to-load needed) |

**Pros:** no storage, no moderation of uploads. **Cons:** fails the operator's request for photos of work; excludes most Fundis.

### Option C: Separate opt-in Portfolio (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Medium: a table, upload, consent, moderation |
| Consent | Clean: its own consent, per item, reversible |
| Honesty | Clear three-way label: Verified (Badge) / Showcase / Portfolio (not verified) |
| Cost | Convex storage and bandwidth for ≤ 12 items per Fundi (≤ 4 videos, ≤ 50 MB each) |

## Trade-off analysis

We give up the strongest trust signal (the verified video itself) to keep the one promise the whole product rests on. The Badge carries the verification; the Portfolio carries the "what does their work look like" question, clearly labelled as the Fundi's own claim.

## Consequences

- New `portfolioItems` table and Fundi mutations (spec `2026-09-26-find-a-fundi-design.md` §10–11); Admin hide and a public report link are needed because this is user-generated public content.
- Faces: the Fundi's own face is allowed; other people only with the per-item confirmation; no automated face detection (D-22).
- A copied public URL keeps working until the file is deleted (same class as R-5); the consent says so.
- The DESIGN.md "no identifiable faces" rule keeps governing Smart Fundis' own imagery, not user Portfolio content.

## Action items

1. convex: `portfolioItems`, `portfolio.*` mutations, convex-test privacy cases 8–10.
2. frontend: "My public profile" editor with the consent sheet; "Recent work" on `/f/[id]`.
3. designer: Stitch screens for the editor and the consent sheet.
4. rai-reviewer: sign off the consent text in both languages.
