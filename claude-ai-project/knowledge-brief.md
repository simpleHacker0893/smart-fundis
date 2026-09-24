# Smart Fundis — one-page brief

**Tagline:** Kazi yako, sifa yako. ("Your work, your reputation.")

**Problem:** Clients in Kenya can't tell skilled fundis from unskilled ones. Skilled jua kali workers have no cheap way to prove what they can do.

**Solution:** A fundi records a short video → Cosmos Reason 2 checks it against a rubric → Nemotron writes a verdict and en/sw feedback → an expert confirms → the fundi gets a badge → clients hire with confidence.

## MVP loop (hackathon)
Landing page → sign-in and roles → fundi video upload → AI assessment → expert review → badge on profile.

## Stack
| Layer | Choice |
| --- | --- |
| Web | Next.js App Router PWA, shadcn/ui, Tailwind, next-intl (en/sw), Vercel |
| Auth | Clerk (email + Google), JWT template `convex` |
| Backend | Convex: schema, functions, file storage, HTTP actions, crons |
| AI service | FastAPI + LangGraph on a Brev H100; Redis + Celery; inline fallback |
| Vision | Cosmos Reason 2 8B (2B fallback) served by vLLM |
| Reasoning | Nemotron through the hosted NVIDIA API |
| Pattern | Brev **pulls** jobs from Convex (`/ai/claim` → `/ai/callback`), with no inbound port |

## Roles
Fundi, Client, Expert verifier (approved by admin, per trade), Admin (email allow-list).

## Assessment states
`queued → analyzing → awaiting_review → approved | reshoot | rejected` (+ `failed`, `appealed`)

## MVP trades and tasks
- Electrical: "Install a 13A socket" (safety: isolate supply, test dead)
- Hairdressing: "Cornrows / braiding" (safety: clean tools)

## Build task order
P0 skeleton · P1.1 landing · P2.1 Clerk+Convex · P2.2 onboarding · P2.3 verifier+admin · P3.1 upload backend · P3.2 upload UI · P4.1 Brev/vLLM · P4.2 LangGraph · P4.3 claim/callback · P4.4 eval · P5.1 expert review+badge · P6.1 demo+card

## Later (not MVP)
Marketplace search (geohash), bookings, M-Pesa, Fundi Pro subscription (from KSh 300/month), Data Co-op licensing, fine-tuning Cosmos on expert-approved clips.
