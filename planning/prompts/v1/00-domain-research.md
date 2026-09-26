# 00 — Domain research: Kenya's skilled-trades and gig marketplace

Paste as the **first message** of a fresh session. It runs in the background while you work on step 01.

```
/mattpocock-skills:research How do people in Kenya (Nairobi and other urban areas) find, vet, book and pay fundis and other semi-skilled workers today, and what do the platforms that compete here do well and badly?

Scope and method:
- Use high-trust primary sources: each company's own site and app store listing, their help and pricing pages, regulator or government pages (NITA, KNQA, TVET), Kenya Data Protection Act 2019 guidance, and reputable Kenyan press. Use Firecrawl search and scrape (firecrawl_search, firecrawl_scrape). Cite every claim with a URL and the date you accessed it. Mark anything unverified.
- Candidates to verify, don't assume they exist or are still active: Lynk, Fundis.co.ke, Kazi-style listing sites, Jiji and OLX services, SweepSouth, Kandua (South Africa, for comparison), Instapay-style payouts, M-Pesa-based booking apps, WhatsApp/Facebook groups, and the county-level informal "jua kali" associations. Add any others you find.
- For each platform, capture: who it serves (clients, fundis); which trades; how workers are vetted (ID, references, tests, reviews, none); how clients find workers (search, categories, location or proximity, maps); job posting vs direct booking; pricing model (commission, subscription, lead fees, free); payments (M-Pesa, cash, escrow); trust and safety features; ratings and reviews; how disputes are handled; the onboarding friction for a fundi (smartphone, data costs, literacy, language); and anything known about failure or pivots.
- Cross-cutting questions:
  - Is location sharing and proximity search normal and accepted?
  - What do fundis pay today for leads?
  - How are rates and quotes communicated?
  - What fraud or safety problems recur (fake clients, no-shows, deposit scams)?
  - What does the Kenya Data Protection Act require for location and phone data?
- Map it against Smart Fundis' differentiator: video skill verification by an AI plus a human Expert (see AGENTS.md and docs/superpowers/specs/2026-09-25-architecture-design.md). Where would verification change behaviour, and where wouldn't it?

Output: `docs/research/2026-kenya-services-marketplace.md` with an executive summary (10 bullets), a competitor table, findings per question, implications for (a) the dashboards, (b) a jobs marketplace, (c) geo and proximity, and (d) pricing and payments, then open questions and sources.
Then use design:research-synthesis to add a short "Themes and opportunities" section.
Commit it on a branch `research/kenya-marketplace` and push. No PR. Report the summary.
```

**Agents:** `/research` runs as a background agent. **Skills:** mattpocock-skills:research, design:research-synthesis, and the Firecrawl tools.
