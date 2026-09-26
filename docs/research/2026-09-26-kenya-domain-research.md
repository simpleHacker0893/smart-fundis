# Kenya domain research for Smart Fundis Version 2

- **Date:** 2026-09-26
- **Scope:** Version 2 (Fundi and Client dashboards, Client job posts, proximity search)
- **Author:** research subagent (primary-source pass)
- **Status:** research note. It is input for the Architect, not a decision. Nothing here changes a spec, ADR or `CONTEXT.md`.

## Summary

1. **The market is crowded but thin on proof.** At least eight live Kenyan services match Clients with Fundis. They include the government's own **FundiLocator** (Ministry of Labour), **Balozy** (100K+ Android installs, all 47 counties), **My-Fundi**, **Fundi Link**, **Fundis**, **Fundi Flani**, **Sokoni**, **Tausi** (beauty) and **FixMyCar** (mechanics). Every one of them says "verified", but where they explain it at all, "verified" means an ID check, a phone number, reviews or an onboarding call. **None shows the Client evidence of skill that was checked task by task.** That is the gap a Badge fills (§1).
2. **Lynk**, the best-known Nairobi fundi platform, is gone. Its domain now redirects to a parked-domain page (§1.2).
3. **Formal skill proof exists but is narrow.** NITA trade tests (Grade III/II/I), TVET CDACC certificates of competence, KNQA-coordinated RPL, EPRA electrical-worker licences (C2 to A1) and NCA accreditation all certify or license. Smart Fundis does none of these, so our copy must keep saying "Verified by Smart Fundis" and never "certified" (§2).
4. **Prices are mostly quotes or ranges.** Where live Kenyan sources publish prices, they are ranges ("KES 300–700 per socket") or "from" prices, and on Jiji about half of Nairobi trade listings say "Contact for price". This supports the rule that we never suggest or compare Rates (§3).
5. **Geo:** the official frames are 47 counties (Constitution, First Schedule), 290 constituencies with their county assembly wards (LN 14/2012), and the KNBS 2019 census sub-counties. There is **no national street-addressing system in force**: the Street Naming and Property Addressing System Bill was still at Second Reading on 22 Sep 2026. So landmark-based location is the norm (§4).
6. **Maps:** MapLibre with OSM data is free to render, but the OSM Foundation's public tiles have no SLA and forbid heavy use. Mapbox includes 50,000 free web map loads a month, and Google includes 10,000 free Dynamic Maps loads per SKU a month. **`@convex-dev/geospatial` is beta**: v0.2.1, tested to about 1M points, with rectangle queries and a `nearest` query (§4).
7. **Payments:** Daraja offers STK Push (M-Pesa Express), C2B, B2C and Transaction Status. Going live needs a real Paybill or Till and an M-PESA Org portal admin. **Holding Client money between parties is regulated.** A payment service provider (PSP) needs CBK authorisation, and must keep customer money in a Trust Fund that is never commingled with its own. Operating without authorisation is an offence (fine up to KSh 500,000 and/or 3 years in prison) (§5).
8. **Data protection:** Assessment videos of faces and voices can fall under "sensitive personal data" (biometric data) if they are technically processed. Sending sensitive data out of Kenya (for example to US GPUs) needs the data subject's **consent** plus safeguards (DPA s.49). Processing biometric data or children's data triggers a **mandatory DPIA** (General Regs r.49). Breaches must be reported to the ODPC **within 72 hours**. Penalties reach KSh 5M. ODPC has fined companies KSh 5M each, and has ordered KSh 950,000 compensation over the misuse of a person's image (§6).
9. **Reviews and ratings:** there is no Kenya-specific rule on reviews (UNVERIFIED that none exists). The Competition Act s.55 and the Consumer Protection Act s.12 ban false claims of "approval", "status" or "standard". Fake or curated reviews and inflated "verified" claims fall squarely under these sections (§6.7).

## Sources and method

- **Method:** web search to find candidates, then a live fetch of each primary page (official sites, regulator sites, Kenya Law, the CBK, ODPC and CAK PDFs, the Safaricom developer portal, Google Play listings, official pricing pages, npm and GitHub). PDFs were downloaded and text-extracted locally. **Every source was accessed on 2026-09-26** unless marked otherwise.
- **Rule:** a claim without a primary source is marked **UNVERIFIED**. News outlets are used only for "is it still operating" or where no primary source exists, and are labelled *(secondary)*.
- **Limits:** Google Play pages were fetched from a US-located crawler, so ratings did not render. Some ODPC determinations are scanned images, and only their summaries could be read. The Kenya Law HTML returned 403 to one fetcher, so the Kenya Law items were read through a second fetcher or through the regulator's own PDF copy.
- **Glossary:** the terms follow `CONTEXT.md`: Fundi, Client, Expert, Trade, Task, Badge, Listing, Rates, Contact reveal. Competitors' own words ("pro", "artisan", "provider") appear only inside quotes.

---

## 1. Competitors (Kenya / Nairobi)

### 1.1 Table

"Operating" means a live site or app was fetched on 2026-09-26.

| # | Service | Operating evidence | What it does | How it vets | Pricing / commission | Location & discovery | Payment | Gap Smart Fundis could fill |
|---|---|---|---|---|---|---|---|---|
| C1 | **FundiLocator**: National Skills Matching and Exchange Portal (Ministry of Labour and Social Protection) [S1] | Site live | Government portal that matches fundis (plumbers, electricians, carpenters, welders and more) with Clients, with booking and reviews | "National ID and a working phone number". Certificates, portfolio photos and references are *optional* [S1] | UNVERIFIED (not stated) | The fundi enters "town, county or coverage area". The Client "shares location" [S1] | UNVERIFIED | A state-backed directory whose skill check is optional. No task-level evidence of skill |
| C2 | **Balozy** (Balozy Technologies) [S2][S3] | Play listing updated **6 Jan 2026**, **100K+ downloads** [S3]. Site modified 31 Aug 2026 [S2] | Multi-service app: mama fua, drivers, plumbers, electricians, mobile auto repair, barbers, makeup and many more | "ID verification, background checks, and ratings/reviews" [S2]; "All service providers go through checks" [S3] | "No Platform Fees", "Negotiate prices directly with pros" [S3], yet the site says pros pay "small service fees applied per booking" [S2]. The two conflict, and the amount is UNVERIFIED | "Pros near you". "Active in 40+ counties" [S2], "all 47 counties" [S3] | UNVERIFIED | The biggest generalist. Vetting is identity and background, not skill |
| C3 | **My-Fundi** (myfundi.co.ke) [S4] | Site live. Says "5K+ users, 1.2K+ professionals, 10K+ bookings" (self-reported) | Booking marketplace: plumbing, electrical, car mechanic, hair and salon, makeup, cleaning and more | "We verify professionals". Method UNVERIFIED | UNVERIFIED. Its meta text says "secure payments" | "Reliable, reviewed professionals near you" | UNVERIFIED (claims "secure payments") | Ratings-led. No stated skill test |
| C4 | **Fundi Link** [S5][S6] | Play listing **updated 24 Sep 2026**, **100+ downloads** [S5] | Marketplace: find fundis by service, chat, book | "Identity-checked, skill-vetted, and reviewed" [S6]. How "skill-vetted" works is UNVERIFIED | "Free to book. No hidden fees" [S6] | "Location-Based – Find professionals working in your area". +254 numbers only [S5] | UNVERIFIED | Claims skill vetting without showing any evidence |
| C5 | **Fundis** (fundis.co.ke) [S7] | Site live, "© 2026 Fundis". "Mobile apps for Android & iOS coming soon". The old Play listing `ke.co.fundis.fundis` returns **HTTP 404** [S8] | Clients **post a job** and connect with "vetted, certified artisans"; 100+ skill types | "Verified experience & proven capabilities". Mentions helping workers "get certified". Method UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | The closest to Client job posts. Uses the word "certified" |
| C6 | **Fundi Flani** [S9] | WordPress site, modified 22 May 2026 | Directory, starting with plumbers, covering all 47 counties, with reviews and work hours; Clients "contact them directly" | "Verified". Method UNVERIFIED | "List Your Business — It's Free" | Browse by county/region and city/area | None (direct contact) | A directory with no proof layer |
| C7 | **Sokoni** (mysokoni.co.ke, Bravilex International Co. Ltd) [S10] | Site live | All-in-one marketplace. Its "Electrical Hub" lists electricians marked "✓ Verified" | "✓ Verified" badge. Method UNVERIFIED | Fees UNVERIFIED. **Shows price ranges** per job (see §3) | UNVERIFIED | "M-Pesa or cash after the job" | Shows price ranges, but "verified" is unexplained |
| C8 | **Tausi** (beauty) [S11][S12] | Play listing **updated 26 Jan 2026**, 10K+ downloads [S12]. Site "©2026" [S11] | Booking for barbers, hairdressers, makeup, nails, at home or in the salon | "Thorough onboarding process" plus ratings [S11] | UNVERIFIED (Play shows "In-App Purchases") | "Location-Based Search" [S11] | M-Pesa is mentioned [S11] | Beauty only. Onboarding, not a skill check |
| C9 | **Fresha** (global salon software with a Nairobi marketplace) [S13][S14] | Nairobi marketplace page live [S13] | Book salons online; the page lists service prices | None stated for professionals; reviews | US-served page: US$14.95 per team member per month, **20% one-time commission on new marketplace clients** (minimum US$6) [S14]. Kenya pricing UNVERIFIED | City pages, "near you" | Card processing (global) | Salons only, not jua kali or at-home |
| C10 | **FixMyCar.ke** [S15] | Site live | Directory of car-repair workshops | "Workshop profiles, service categories, and direct contact details" (listing, not vetting) | UNVERIFIED | Browse by service, then area | Direct | Workshops only, with no mechanic skill proof |
| C11 | **Jiji.co.ke** (classifieds) [S16][S17] | Live; "3225+ repair services" and "2848+ building & trades services" in Nairobi | Fundis post service ads with an asking price or "Contact for price" | None stated | UNVERIFIED (Jiji's paid-listing tiers were not checked) | Nairobi / area pages | Off-platform | Mass reach, no trust layer |
| C12 | **Lynk** (lynk.co.ke) | **Not operating.** The domain redirects to a parked-domain page (`findakey.net`) [S18]. Eden Life acquired Lynk in April 2022 *(secondary: WeeTracker 2022-04-28)* | (Was) vetted fundis and domestic workers in Nairobi | n/a | n/a | n/a | n/a | Its exit leaves the "vetted-by-us" position open |
| C13 | **UrDrive** (mechanics on demand) | UNVERIFIED. Only press coverage was found *(secondary: Nation, The Star 2019)* | Mechanic comes to the Client's GPS location | UNVERIFIED | UNVERIFIED | GPS | UNVERIFIED | — |

### 1.2 Notes

- **N1.1: "Verified" is everywhere and means little.** C1 to C8 all use "verified". Only two explain it: C1 (national ID plus phone, with certificates optional) [S1] and C2 (ID, background checks, reviews) [S2]. **No competitor we found checks skill task by task, shows the Client evidence of the check, or has a named human Expert decide.** The Badge wording "Verified by Smart Fundis — <Trade>: <Task> · <date>" is therefore both honest and distinctive.
- **N1.2: Government entry.** FundiLocator [S1] is a free-to-list competitor with state credibility. It could also be a future partner, since it accepts optional certificates and could accept Badges.
- **N1.3: Job posting.** Only Fundis (C5) and Fundi Link (C4) invite Clients to describe a job ("Post a Job", "Request a fundi") [S6][S7]. Balozy and My-Fundi are booking-led; Jiji and Fundi Flani are directories.
- **N1.4: Payment.** None of the platforms checked says it holds Client money (escrow). Sokoni says "M-Pesa or cash after the job" [S10] and Balozy says "negotiate prices directly" [S3]. This fits the regulatory cost of holding funds (§5.3).
- **N1.5: Scale signal.** Balozy's 100K+ installs [S3] is the only large public download count. Fundi Link has 100+ [S5] and Tausi 10K+ [S12].

---

## 2. Formal skill vetting in Kenya, and why we never say "certified"

| # | Body | Legal basis | What it certifies or licenses | Source |
|---|---|---|---|---|
| F2.1 | **NITA**: Government Trade Test | "mandated under Industrial Training Act Cap.237 and the Amendment Act 2011 to conduct Testing and Issue Certificates" | Trade tests at **Grade III, II and I**. "Testing is a systematic way of evaluating the skills of an artisan/apprentice to ascertain competencies possessed in a given trade area." Series: April (Grades I, II and III; booking 2 Jan to 2 Mar), August (II and I), December (III). About 50,000 trade-test candidates a year. Test fees UNVERIFIED (only the KSh 5,000 certificate-replacement fee is stated) | [S19] |
| F2.2 | **KNQA**: RPL | KNQA coordinates the national qualifications framework and RPL | RPL recognises "skills, knowledge, and competencies gained ... through work experience, informal training, or life experiences". KNQA accredits the **Qualification Awarding Bodies (QABs)**, which assess and award "certificates of competency". Process: skills assessment, evidence portfolio, competency check including **practical observation**, certification, and appeals. About 6 weeks | [S20] |
| F2.3 | **TVET CDACC** | TVET Act No. 29 of 2013 | A **Certificate of competence** (one Unit of Competence) and a **National certificate** (all Units) | [S21] |
| F2.4 | **EPRA**: electrical-worker licence | Energy Act, 2019 (voltage definitions cited by EPRA). The section requiring a licence is UNVERIFIED | Licence classes: **C2** (low-voltage single-phase, buildings up to 2 storeys, not factories or places of public entertainment), **C1** (three-phase, up to 4 storeys), **B** (multi-storey, factories, medium voltage), **A1** (high voltage), **A2** (generators; lifts and escalators). Assessed by written and oral interview. Licence fees UNVERIFIED (*secondary* reports only) | [S22] |
| F2.5 | **NCA**: accreditation of skilled construction workers and site supervisors | NCA Act No. 41 of 2011; NCA Regulations 2014 r.19 ("shall accredit and certify all construction workers and construction site supervisors") and r.20 | Accreditation card. **KES 1,000** (workers), **KES 2,000** (site supervisors); valid **3 years** | [S23] |

**Why our copy must say "Verified by Smart Fundis" and never "certified" (F2.6).**
- Certification in Kenya is a statutory act of named bodies: NITA "Issue Certificates" (F2.1), QABs award RPL "certificates of competency" (F2.2), CDACC awards certificates (F2.3), and NCA will "accredit and certify" (F2.5). Electrical work also needs an **EPRA licence** (F2.4). A Badge proves that an Expert approved one recorded Task. It is not a licence to do regulated work, such as wiring a building without the right EPRA class.
- Saying "certified" would falsely claim "approval, status, affiliation" the Fundi or Smart Fundis does not have. That is a "false, misleading or deceptive representation" under Consumer Protection Act s.12(2)(b) [S37], and an offence under Competition Act s.55(a)(v)–(vi) [S38] (see §6.7).
- **Electrical-specific:** a Badge in *Electrical: Install a 13A socket* must not imply that the Fundi may legally do installation work their EPRA class does not cover. The profile needs a line such as "A Badge is not an EPRA licence" (see I-2 in §7).

---

## 3. Nairobi price ranges for common small jobs

**Caveat.** These are asking prices published by businesses or listers, not market averages. None comes from a regulator or statistics body, because no KNBS or other official price series for artisan labour was found (UNVERIFIED that one exists).

| # | Trade | Job | Range (KSh) | Format shown | Source |
|---|---|---|---|---|---|
| P3.1 | Plumbing | Standard call-out fee | 1,500–3,000 | Range | Wiljoh Plumbing Solutions price page, 10 Dec 2025 [S24] |
| P3.2 | Plumbing | Tap washer replacement / complete tap replacement (labour) | 800–1,500 / 2,000–4,000 | Range | [S24] |
| P3.3 | Plumbing | Running toilet fix; minor leak per joint | 1,200–2,500; 1,200–2,500 | Range | [S24] |
| P3.4 | Plumbing | Generic "plumber" Jiji ads, Nairobi | 1,500 "per service" (several ads) | Fixed ask | Jiji Nairobi [S16][S17] |
| P3.5 | Electrical | Socket / switch install | 300–700 | Range; "exact quotes are obtained by booking" | Sokoni Electrical Hub [S10] |
| P3.6 | Electrical | Security light install; DB board upgrade; 2-bedroom full wiring | 500–1,500; 5,000–15,000; 15,000–40,000 | Range | [S10] |
| P3.7 | Carpentry | Kitchen cabinets and wooden floors work; wooden floor repair | 3,000 "per service"; 3,500 | Single ask; many cabinet ads say "Contact for price" | Jiji Nairobi [S17]. A typical range is UNVERIFIED |
| P3.8 | Painting | "Painting Expert" | 2,500 "per service"; "Painter/Fundi Rangi" = Contact for price | Single ask | Jiji Nairobi [S17]. Per-m² rates UNVERIFIED |
| P3.9 | Mechanic | Diagnostic scan and inspection | From 2,000 (Kenya Car Guy, Parklands); from 5,800 (Central Motor Service) | "From" | [S25][S26] |
| P3.10 | Mechanic | Service, brake pads, other common repairs | UNVERIFIED (Kenya Car Guy quotes via WhatsApp [S25]) | Quote | — |
| P3.11 | Salon / beauty | Braiding from 2,000–2,500; manicure 1,500–2,000; pedicure 2,500; men's shave 1,500 | Mix of fixed and "From" | Fresha Nairobi page [S13] |

**How platforms show prices (N3.1).**
- **Ranges:** Sokoni [S10] and Wiljoh [S24].
- **Fixed ask or "Contact for price":** Jiji. On Nairobi *building & trades* it was 11 priced ads against 12 "Contact for price"; on *repair services*, 12 against 8 [S16][S17].
- **"From" prices:** Fresha [S13], Kenya Car Guy [S25].
- **Quote only:** Kenya Car Guy for repairs [S25].
- **Negotiated directly:** Balozy [S3].
- Nobody uses a platform-set fixed price for trade labour.

---

## 4. Geo: administrative units, addressing, maps, proximity

### 4.1 Official lists

- **F4.1 Counties:** "The territory of Kenya is divided into the counties specified in the First Schedule" (Constitution, Art. 6(1)). The First Schedule lists **47**, from 1 Mombasa to 47 Nairobi City [S27].
- **F4.2 Constituencies and wards:** *The National Assembly Constituencies and County Assembly Wards Order* (LN 14 of 2012) sets up **290 constituencies**, with a Schedule organised by county, then constituency, then county assembly ward (it includes Nairobi's Ruaraka and Embakasi) [S28]. The IEBC's first boundaries-review report names the TFDG recommendation of 3–5 wards per constituency [S29]. Several secondary sources give the total as 1,450 wards; the exact count in LN 14/2012 was not tallied here, so it is UNVERIFIED. A **machine-readable official ward list** (CSV/GeoJSON from IEBC) was not found, so that is UNVERIFIED too. HDX hosts a 1,450-ward dataset "abstracted from different sources", which is secondary.
- **F4.3 Sub-counties (KNBS):** the 2019 Census Volume I gives population by county and **sub-county**. Nairobi City has **11 census sub-counties**: Dagoretti, Embakasi, Kamukunji, Kasarani, Kibra, Lang'ata, Makadara, Mathare, Njiru, Starehe and Westlands. Kiambu includes Ruiru, Juja, Thika West and others [S30]. **Census sub-counties are not the same units as constituencies:** Nairobi has 17 constituencies under LN 14/2012 but 11 KNBS sub-counties. Volume II goes down to division, location and sub-location [S30]. The current gazetted list of administrative sub-counties is UNVERIFIED.

### 4.2 Addressing

- **F4.4 No statutory street addressing yet.** *The Street Naming and Property Addressing System Bill, 2024 (Senate Bills No. 43 of 2024)* appears on the Senate Order Paper for **Tuesday 22 Sep 2026** at "Second Reading (Resumption ...)", so it is not yet law [S31]. A National Addressing System was announced as "in the final stages" in 2019 *(secondary: ACEPIS, 15 Oct 2019)*. The practical consequence is that Clients and Fundis describe places by estate, road and landmark ("near Ruiru Stage, behind Total"), not by street number. That is common knowledge, not a sourced claim.

### 4.3 Location privacy

- **F4.5** Under the DPA an "identifiable natural person" is one identifiable by "an identifier such as a name, an identification number, **location** data ..." [S32, s.2]. So a Fundi's home pin is personal data. The DPA's "profiling" definition also covers analysing a person's "behaviour, location or movements" [S32, s.2]. Principles: collect only what is "adequate, relevant, limited to what is necessary" (s.25(d)), and keep it "for no longer than is necessary" (s.25(g)) [S32].

### 4.4 Map providers usable from Next.js (official pricing)

| # | Option | Cost | Terms that matter | Source |
|---|---|---|---|---|
| F4.6 | **Google Maps Platform** (pay-as-you-go) | Since **March 2025** the $200 monthly credit is replaced by free calls per SKU: **Essentials 10,000/month, Pro 5,000, Enterprise 1,000**. Dynamic Maps: 10,000 free, then **$7.00 per 1,000**. Geocoding: 10,000 free, then $5.00. Autocomplete Requests: 10,000 free, then $2.83. Place Details Essentials: 10,000 free, then $5.00. Plans from $100/month (Starter) | Billing account and card required (standard) | [S33][S34] |
| F4.7 | **Mapbox GL JS** | **50,000 free map loads/month**, then **$5.00 per 1,000** (up to 100k). Geocoding (temporary): 100,000 free, then $0.75 per 1,000. Search Box: 500 free sessions, then $3.00 per 1,000 | — | [S35] |
| F4.8 | **MapLibre GL JS + OSM data** | Library is free (BSD-3-Clause) [S36b]. MapLibre "doesn't provide map tiles"; you supply a tile source [S36a] | See F4.9 for the OSM public tiles | [S36a][S36b] |
| F4.9 | **OSMF public tile server** (tile.openstreetmap.org) | Free, but "Availability is best-effort: there is no SLA or guarantee" | Must show "© OpenStreetMap contributors". Must send a unique User-Agent and a valid Referer. Cache for at least 7 days. **No bulk or prefetch/offline downloading**. "Heavy or inappropriate use" may be blocked without notice. For commercial services, "access may be withdrawn at any point" | [S36] |

### 4.5 Approximate location patterns

- **F4.10** There is no Kenyan primary source on how to fuzz locations (UNVERIFIED that one exists). What the sources above do support is minimising (s.25(d)) and a duty to notify. Engineering options (not sourced; design reasoning):
  - (a) Store only county, ward or area plus a **coarse centroid** (for example the ward centroid, or coordinates rounded to about 1 km).
  - (b) Store the exact point server-side only for distance maths, and return **distance bands** ("within 2 km", "2–5 km") and never coordinates.
  - (c) Snap to a grid cell and add jitter once, at write time, never per request, because per-request jitter can be averaged away.
  - (d) Show a Client job post's exact place only to a Fundi the Client has chosen.

### 4.6 Convex geospatial component

- **F4.11** `@convex-dev/geospatial`: **status "Beta"** ("missing some functionality, but what's there should work"). **Tested "up to about 1,000,000 points"**; larger datasets should contact the team. Coordinates are WGS84. **v0.2.1**, published 2025-12-11 (package metadata modified 2026-09-16). Apache-2.0; peer dependency `convex ^1.24.8`. GitHub: 29 stars, 12 open issues [S39][S40][S41][S42].
- **F4.12** **API** (from the README) [S40]:
  - Install: `app.use(geospatial)` in `convex/convex.config.ts`
  - Construct: `new GeospatialIndex<Key, FilterKeys>(components.geospatial)`
  - Write and read: `insert(ctx, key, {latitude, longitude}, filterKeys, sortKey)`, `get(ctx, key)`, `remove(ctx, key)`
  - Query a region: `query(ctx, {shape: {type: "rectangle", rectangle: {west, south, east, north}}, filter, limit}, cursor)` returns `{results, nextCursor}`
  - Query nearest: `nearest(ctx, {point, limit, maxDistance /* metres */, filter})`
  - Filters support `eq`, `in`, `gte` and `lt`. "We currently only support ascending order on the `sortKey`."
  - Limits on the number of filter keys or results, and write amplification: UNVERIFIED (not documented).
  - The component page also mentions polygon and circle queries [S39]. The README shows only rectangle and `nearest`, so polygon support is UNVERIFIED for v0.2.1.

---

## 5. M-Pesa (Daraja) and holding Client money

### 5.1 Daraja APIs [S43–S48]

| # | API | Key facts |
|---|---|---|
| F5.1 | **Authorization** | `GET https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials` with Basic `consumerKey:consumerSecret`. The token lasts **3600 s** [S44] |
| F5.2 | **M-Pesa Express (STK Push)** | Sandbox `POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`. Fields: `BusinessShortCode` (5–6 digits), `Password = base64(Shortcode+Passkey+Timestamp)`, `Timestamp` (YYYYMMDDHHmmss), `TransactionType` (`CustomerPayBillOnline` / `CustomerBuyGoodsOnline`), `Amount`, `PartyA`/`PhoneNumber` (2547XXXXXXXX), `PartyB`, `CallBackURL`, `AccountReference` (max 12 characters, shown to the customer), `TransactionDesc` (max 13). It is **asynchronous**: `ResponseCode 0` means accepted; the callback `ResultCode 0` means success and `1032` means cancelled by the user. There is also a separate **Query** API [S45] |
| F5.3 | **C2B** | Register URL: sandbox `.../mpesa/c2b/v2/registerurl`. `ValidationURL` (optional, and it must be enabled by emailing Safaricom) and `ConfirmationURL`. `ResponseType` is `Completed` or `Cancelled` if validation is unreachable. Production URLs must be **HTTPS**; no "M-PESA/Safaricom/exe/cmd/SQL/query" keywords in URLs; **no ngrok or requestbin in production**. v1 sends a SHA-256-hashed MSISDN and v2 a masked one [S46] |
| F5.4 | **B2C** | Sandbox `.../mpesa/b2c/v3/paymentrequest`. `CommandID`: `SalaryPayment`, `BusinessPayment` or `PromotionPayment`. Needs `InitiatorName` and `SecurityCredential`, and results go to `ResultURL`/`QueueTimeOutURL`. **Going live requires a Bulk Disbursement Account / B2C short code** [S47] |
| F5.5 | **Transaction Status** | "Enables a business to check the status of a recent transaction" [S43]. Parameter details: UNVERIFIED (the page did not render its body) |
| F5.6 | **Sandbox vs go-live** | Go-live needs a real **PayBill, Till or B2C shortcode**, **M-PESA Org portal access** with a Business Administrator or Business Manager operator, and the app's organisation name. Production endpoints and keys are emailed after go-live [S45][S48] |

### 5.2 Tariffs (Safaricom, live page) [S49]

- **F5.7** **Customer-to-customer sends:** KSh 1–100 free; 101–500 costs 7; 501–1,000 costs 13; ... up to a maximum of **108**. Limits: **KES 250,000 per transaction** and **KES 500,000 per day**.
- **Pochi la Biashara** (for 3 months from 1 Aug 2026): free up to 200, then 7 / 13 / 23 / 33, and **50** above 2,500.
- **Business Till payouts:** "Pay to Mobile" 101–500 costs 4, up to a maximum of 54; "Pay to Paybill" up to a maximum of 54. "Merchants are charged for receiving payments through their Lipa na M-PESA Till."
- The **Till merchant receiving fee** (reported as free up to KSh 500, then 0.55% capped at KSh 200, from 7 Aug 2026) is UNVERIFIED on a primary source *(secondary: The Kenya Times)*.
- **Paybill business-pays tariffs** are in a Safaricom PDF (`one-account-tariff-form.pdf`) that was not read, so they are UNVERIFIED. **B2C tariffs**: UNVERIFIED.

### 5.3 CBK / National Payment System Act 2011 and NPS Regulations 2014

- **F5.8** **Who is a PSP.** NPS Act s.2 defines a payment service provider as "(i) a person, company or organisation acting as provider in relation to sending, receiving, storing or processing of payments or the provision of other services in relation to payment services through any electronic system", or someone operating a switched network, or "(iii) any other person ... that processes or stores data on behalf of such payment service providers" [S50].
- **F5.9** **Authorisation.** "No person shall, in Kenya conduct the business of a payment service provider except an authorized payment service provider". A contravention is an offence with "a fine not exceeding five hundred thousand shillings, or ... imprisonment for a term not exceeding three years, or ... both" (s.12). The applicant must apply to the CBK before starting (s.13) [S50]. The CBK publishes a directory of authorised PSPs, updated to **10 Aug 2026** [S51].
- **F5.10** **Trust Fund.** NPS Regulations 2014 r.25(3) says a PSP shall:
  - "(a) establish a Trust"
  - "(b) ensure all monies received are held in a Trust Fund"
  - "(c) ensure the balances ... shall not at any time be less than what is owed to customers"
  - "(d) not transfer the funds to its own account used for normal business operations"
  - "(e) not commingle the funds"
  - "(f) ... placed in commercial banks licensed under the Banking Act or Government of Kenya securities"

  Placement limits are in the Fourth Schedule (r.25(4)). Income from trust funds goes to trust purposes or a public charity (r.25(5)). There is a broad-based board of trustees (r.25(2)(a)), and the CBK may fine up to KSh 1M where no specific penalty applies (r.57) [S52].
- **F5.11** **Interpretation.** It is UNVERIFIED that Smart Fundis collecting a Client's money on its own Paybill and releasing it to a Fundi later would count as "receiving, storing or processing of payments" needing authorisation. The wording of F5.8 suggests it could, and legal counsel must confirm. A lower-risk pattern is to never hold funds: the Client pays the Fundi directly (Pochi or Till), or a CBK-authorised PSP or bank escrow product holds the money. Also UNVERIFIED: whether the NPS Act has been amended since the 2011 text read here (the CBK-hosted PDF is the as-enacted text).

---

## 6. Data protection and consumer protection

### 6.1 Data Protection Act 2019 [S32]

- **F6.1 Sensitive data includes biometrics.** "sensitive personal data" includes "genetic data, **biometric data**". "biometric data" means "personal data resulting from **specific technical processing** based on physical, physiological or behavioural characterisation including ... retinal scanning and **voice recognition**" (s.2). Whether an Assessment video showing a face and voice is "biometric" depends on it undergoing "specific technical processing" such as face or voice recognition. That is a legal interpretation, so it is UNVERIFIED and needs counsel. The General Regulations list "biometric technology, including **voice or facial recognition**" as a way of collecting personal data (r.6(1)(e)) [S54].
- **F6.2 Consent.** The controller bears "the burden of proof for establishing a data subject's consent ... for a specified purpose". Consent may be withdrawn "at any time" (s.32(1)–(2)). The General Regs r.4 requires telling the person, before consent, the purpose, the right to withdraw and more, and consent must be voluntary and "specific to the purpose of processing" [S54].
- **F6.3 Children.** A controller may not process a child's data unless "consent is given by the child's parent or guardian" and processing "protects and advances the rights and best interests of the child". It must have "appropriate mechanisms for age verification and consent" (s.33).
- **F6.4 Automated decisions.** A data subject has "a right not to be subject to a decision based solely on automated processing ... which produces legal effects ... or significantly affects the data subject" (s.35(1)).
- **F6.5 Cross-border transfer.**
  - s.25(h): data is not to be "transferred outside Kenya, unless there is proof of adequate data protection safeguards or consent".
  - s.48: transfer abroad only with proof of safeguards to the Commissioner, or where "necessary" for a contract or on other listed grounds.
  - **s.49(1): "The processing of sensitive personal data out of Kenya shall only be effected upon obtaining consent of a data subject and on obtaining confirmation of appropriate safeguards."**
  - General Regs r.46: without adequacy or safeguards, transfer needs explicit consent after being "informed of the possible risks". r.46(2): consent is required for sensitive data. r.47: no onward transfer without the transferring entity's authorisation [S54].
  - Localisation (r.26) applies only to listed state-interest purposes (civil registration, elections, public finance, protected systems, basic education, primary and secondary health care). It does **not** cover a skills marketplace [S54].
- **F6.6 DPIA.** Required before "high risk" processing (s.31). General Regs r.49(1) lists as high risk:
  - "(a) automated decision making ... use of profiling or algorithmic means ... to determine access to services"
  - "**(c) processing biometric or genetic data**"
  - "(e) ... data relating to **children** or vulnerable groups"
  - "(i) **innovative use** ... of new technological ... solutions"

  The Third Schedule gives a template [S54].
- **F6.7 Breach notice.** Notify the Data Commissioner "without delay, **within seventy-two hours** of becoming aware". If the notice is late, give "reasons for the delay". A processor must tell the controller within **48 hours** (s.43(1)–(3)).
- **F6.8 Penalties.** Up to "**five million shillings**, or in the case of an undertaking, up to **one per centum of its annual turnover** ... whichever is lower" (s.63). A penalty notice may add a daily fine of up to **KSh 10,000** per breach until it is fixed (Complaints Handling Procedure and Enforcement Regs 2021, r.20(4)) [S55].

### 6.2 Registration (Registration of Data Controllers and Data Processors Regulations 2021) [S53][S56]

- **F6.9 Exemption.** A controller is exempt from mandatory registration where it "(a) has an annual turnover of below five million shillings ... **and** (b) has less than ten employees". It must still comply with Parts IV and VI of the Act. The exemption does **not** apply to purposes in the **Third Schedule**, whatever the turnover. The Third Schedule covers: political canvassing; crime prevention including CCTV; gambling; educational institutions; health; hospitality; property management; financial services; telecoms; direct marketing; **transport services including online passenger hailing applications**; genetic data. A skills marketplace is not named, so whether Smart Fundis must register below the threshold is an interpretation (probably no; UNVERIFIED). ODPC's FAQ confirms the turnover-and-employee test [S56].
- **F6.10 Fees (Second Schedule).** Micro/small (1–50 employees, turnover up to KSh 5M): **KSh 4,000**, renewal 2,000 every 2 years. Medium: 16,000 / 9,000. Large: 40,000 / 25,000 [S53].

### 6.3 ODPC enforcement examples

- **F6.11** ODPC press release, **11 Apr 2023**: penalty notices of **KES 5,000,000 each** against **Whitepath Company Ltd** (digital lender: phone-contact scraping, unsolicited texts, harassment; it ignored a 10 Jan 2023 enforcement notice) and **Regus Kenya** (failed to respond; spam). An enforcement notice went to **Ecological Industries Ltd** for **publishing a person's photo on a company catalogue and calendar for marketing** [S57].
- **F6.12** ODPC Complaint No. 502 of 2024: the respondent was ordered to pay **KES 950,000 compensation** for misusing the complainant's **image** [S58].
- **F6.13** 2023 determinations (primary) found:
  - Casa Vera Lounge (17 Jul 2023) breached s.26, s.29 (duty to notify) and **s.32 consent**
  - Roma School Uthiru (11 Aug 2023) breached ss.9, 25, 26, 29, 32, **33 (child)** and 34
  - Mulla Pride Ltd (2 Aug 2023) breached rights by using contacts from clients' phonebooks

  All three got enforcement notices [S59]. The follow-on **penalty amounts** (Roma School KES 4,550,000 for a minor's image without parental consent; total KES 9.35M across the three) are *secondary* (DataGuidance; CIO Africa, Sept 2023). The primary penalty notices are UNVERIFIED.

### 6.4 Consumer protection: reviews, ratings, "verified" claims

- **F6.14 Consumer Protection Act 2012, s.12(1)** reads: "It is an unfair practice for a person to make a false, misleading or deceptive representation". This includes "(a) ... services have sponsorship, **approval**, performance characteristics ... **qualities** they do not have", "(b) ... the person who is to supply the goods or services has sponsorship, **approval, status, affiliation** or connection the person does not have" and "(c) ... services are of a particular standard, quality, grade". s.31 covers internet agreements: disclose the prescribed information and give an "express opportunity to accept or decline" [S37].
- **F6.15 Competition Act (Cap. 504), s.55:** it is an offence to falsely represent that "services are of a particular standard, quality, value or grade" (a)(ii), or have "sponsorship, approval ... benefits they do not have" (a)(v), or "a sponsorship, approval or affiliation it does not have" (a)(vi). It is also an offence to make "a false or misleading representation ... with respect to the price" (b)(i). s.56 covers unconscionable conduct [S38]. The CAK's Consumer Protection department investigates "false or misleading representations, unconscionable conduct" [S60]. The CAK issued a cease-and-desist to Fly540 under ss.55–56 *(CAK press release, 2024)* [S61].
- **F6.16 Reviews guidance.** **No CAK or Kenyan guidance specific to online reviews or ratings was found (UNVERIFIED that none exists).** International benchmark, not Kenyan law: the OECD *Good Practice Guide on Online Consumer Ratings and Reviews* (2019) says:
  - "Do not create the impression that posted ratings and reviews are provided by real consumers, if you cannot verify them"
  - "Do not offer incentives ... conditioned on positive feedback"
  - "Publish all ratings and reviews, whether positive or negative, or inform consumers" of moderation rules [S62]

---

## 7. Implications for V2

Each implication names the finding it rests on. These are proposals for the Architect, not decisions.

| # | Implication for V2 | Based on |
|---|---|---|
| I-1 | **Keep "verified" meaning one thing.** Competitors use "verified" loosely (N1.1), which is a chance to be precise. On dashboards and job posts, use only the Badge wording and "Not yet verified". Never add "vetted", "trusted" or "certified" as general trust labels. | N1.1, F2.6, F6.14, F6.15 |
| I-2 | **Add a licence disclaimer for regulated Trades.** For Electrical (and any building trade), the profile and job-post match should say a Badge is not an EPRA licence or NCA accreditation. Do not match a Client's job post to a Fundi on the implied basis of a licence class. A later optional "self-declared licence number, not verified" field would follow the Rates pattern. | F2.4, F2.5, F2.6 |
| I-3 | **Job posts get a Client budget field, not a platform price.** No platform sets fixed labour prices (N3.1), and `CONTEXT.md` forbids Smart Fundis suggesting or comparing Rates. If a Client job post has a budget, label it "Set by the client", and do **not** seed it with ranges from §3. **Flag for the Architect:** a "typical price" helper would conflict with the Rates rule. | N3.1, P3.1–P3.11 |
| I-4 | **Location model: county, then area, then an optional coarse point.** Keep the 47-county constant (F4.1). For "area", prefer the **KNBS sub-county** list or **LN 14/2012 wards** over free text, and note they are different units (F4.2, F4.3). Allow a free-text **landmark** line, because there is no statutory street addressing (F4.4). | F4.1–F4.4 |
| I-5 | **Never expose a Fundi's exact point.** Store the exact point only if it is needed for distance, show distance bands or ward-level location, and snap once at write time (F4.10). The same applies to a Client's job-post location until the Client picks a Fundi. Location is personal data under DPA s.2, and minimisation applies (s.25(d)). | F4.5, F4.10 |
| I-6 | **Proximity search: use `@convex-dev/geospatial` behind an interface, or ward centroids.** The component is beta, tested to about 1M points, with rectangle and `nearest` queries and ascending-only `sortKey` (F4.11, F4.12). That fits V2's scale. Wrap it so that a fallback (filtering by county and ward, then sorting by centroid distance) needs no schema change. Keep the Verified-first `sortKey` tiering (ADR-22) outside the geo index, since the geo index sorts ascending only. | F4.11, F4.12 |
| I-7 | **Maps: no map is needed for proximity search.** Distance bands with a ward list work without tiles. If a map is shown: MapLibre (free, F4.8) with a keyed tile provider, or Mapbox's 50k free loads (F4.7). **Do not use `tile.openstreetmap.org` in production**: it has no SLA, forbids heavy use, and "access may be withdrawn" for commercial services (F4.9). Google's 10k free Dynamic Maps loads (F4.6) is the smallest free tier. | F4.6–F4.9 |
| I-8 | **M-Pesa stays on the Roadmap unless a PSP holds the money.** Holding Client money for later release to a Fundi risks falling under the PSP definition, needing CBK authorisation (fine up to KSh 500k and/or 3 years) and a Trust Fund (F5.8–F5.10). For V2, either (a) keep payments off-platform (Client pays the Fundi directly, as Sokoni and Balozy do, N1.4), or (b) take only Smart Fundis' own fees via STK Push to our Paybill (F5.2), which is not holding third-party money. Get legal counsel before any escrow (F5.11). This matches `CONTEXT.md`, where "bookings & M-Pesa" is Roadmap-only. | F5.1–F5.11, N1.4 |
| I-9 | **If STK Push is used, design it as asynchronous with idempotency.** Treat `ResponseCode 0` as "pending", settle only on the callback `ResultCode 0`, and handle `1032` (cancelled). Reconcile with the Query or Transaction Status API. The callback URL must be HTTPS, with no forbidden keywords and no ngrok in production. That fits a Convex HTTP action. Go-live needs a real Paybill or Till and an Org-portal admin, which the operator must plan ahead. | F5.2, F5.3, F5.5, F5.6 |
| I-10 | **Update the DPIA and consent before V2.** A DPIA is mandatory because we process possible biometric data (face and voice video), may process children, and use algorithmic assessment (r.49(1)(a), (c), (e), (i)). V2 adds Client accounts and location, so the DPIA must be extended to cover them. | F6.1, F6.6 |
| I-11 | **Get separate, explicit consent to process Assessment videos outside Kenya.** If the GPU box is in the US, treat the video as potentially sensitive and get **explicit consent that names the transfer and its risks** (s.49(1); r.46), plus documented safeguards. It is not enough to rely on "contract necessity" (s.48(c)). Verification consent already exists; check that its EN and SW text names cross-border processing. | F6.1, F6.5 |
| I-12 | **Block children from uploading.** The DPA requires parental consent and age verification for a child's data (s.33). ODPC has acted on a child's image (F6.13). V2 onboarding for Fundis and Clients should ask for an 18+ declaration, and a job post's photos should warn "no children". This extends the Portfolio "no children" confirmation. | F6.3, F6.13 |
| I-13 | **An Expert must always decide.** The s.35 right against solely automated decisions with significant effect supports the non-negotiable that only an Expert creates a Badge. V2 dashboards must never show an AI Verdict as a decision. | F6.4 |
| I-14 | **Plan a 72-hour breach runbook.** Notify the ODPC within 72 hours, and require processors (Convex, Clerk, Brev, LangSmith) to notify us within 48 hours (s.43). Add this to RISKS or a runbook. | F6.7 |
| I-15 | **Check whether we must register with the ODPC.** Below KSh 5M turnover *and* under 10 employees we are likely exempt, unless a Third Schedule purpose applies (F6.9). Registration costs only KSh 4,000 (F6.10), so voluntary registration is cheap proof of good faith. The Architect should decide. | F6.9, F6.10 |
| I-16 | **Honest rules for reviews and ratings, if V2 adds Client reviews.** Allow only a Client with a real contact or job to review. Publish negative reviews. Never offer an incentive tied to a positive review. Show the review count. Never let a Fundi write or edit their own reviews. Keep reviews visibly separate from Badges: a review is "Client opinion — not verified". These follow OECD guidance, and s.12 and s.55 make misleading "quality/standard" claims actionable. | F6.14–F6.16 |
| I-17 | **Photos in job posts and Portfolio need consent from the people shown.** ODPC acted on a company publishing a person's photo for marketing, and ordered KES 950k compensation for image misuse (F6.11, F6.12). Keep "everyone recognisable agreed" confirmations on any new V2 upload surface, such as Client job-post photos. | F6.11, F6.12 |
| I-18 | **Watch FundiLocator as competitor and partner.** It is free, state-run and only optionally checks skill (C1, N1.2). A Badge export or deep link could someday be an optional "evidence" item there. Do not imply any affiliation (s.12(2)(b)). | C1, N1.2, F6.14 |

---

## Source list (all accessed 2026-09-26)

- [S1] FundiLocator, National Skills Matching and Exchange Portal: https://app.labourmarket.go.ke/
- [S2] Balozy website: https://www.balozy.com/
- [S3] Balozy on Google Play: https://play.google.com/store/apps/details?id=com.balozy.pros&hl=en
- [S4] My-Fundi: https://myfundi.co.ke/
- [S5] Fundi Link on Google Play: https://play.google.com/store/apps/details?id=com.fundilink.app&hl=en
- [S6] Fundi Link website: https://fundilink.com/
- [S7] Fundis: https://fundis.co.ke/
- [S8] Fundis App on Google Play (HTTP 404): https://play.google.com/store/apps/details?id=ke.co.fundis.fundis&hl=en_US
- [S9] Fundi Flani: https://fundiflani.co.ke/
- [S10] Sokoni Electrical Hub: https://mysokoni.co.ke/electrical
- [S11] Tausi App: https://tausiapp.com/
- [S12] Tausi on Google Play: https://play.google.com/store/apps/details?id=com.tausiapp.tausi&hl=en
- [S13] Fresha Nairobi beauty salons: https://www.fresha.com/lp/en/bt/beauty-salons/in/ke-nairobi
- [S14] Fresha pricing: https://www.fresha.com/pricing
- [S15] FixMyCar.ke: https://fixmycar.ke/
- [S16] Jiji, Repair Services in Nairobi: https://jiji.co.ke/nairobi/repair-services
- [S17] Jiji, Building & Trades Services in Nairobi: https://jiji.co.ke/nairobi/building-and-trades-services
- [S18] Lynk (redirects to a parked domain): https://www.lynk.co.ke/
- [S19] NITA, Trade Testing: https://www.nita.go.ke/our-services/trade-testing.html
- [S20] KNQA, Recognition of Prior Learning: https://knqa.go.ke/service/recognition-of-prior-learning/
- [S21] TVET CDACC, Certification: https://tvetcdacc.go.ke/service/certification/
- [S22] EPRA, Assessment Areas for Electrical Worker Written & Oral Interviews (PDF): https://www.epra.go.ke/sites/default/files/2025-06/Written%20&%20Oral%20Interviews%20Areas%20of%20Competency.pdf
- [S23] NCA, Full Accreditation: https://www.nca.go.ke/full-accreditation
- [S24] Wiljoh Plumbing Solutions, price page (10 Dec 2025): https://wiljohplumbingsolutions.co.ke/plumbing-services-pricing-in-kenya-wiljoh-plumbing-solutions/
- [S25] Kenya Car Guy, diagnostics: https://www.kenyacarguy.com/services/car-diagnostics-nairobi (and https://www.kenyacarguy.com/)
- [S26] Central Motor Service, diagnostics: http://cmskenya.co.ke/vehicle-diagnostics/
- [S27] Constitution of Kenya, Art. 6(1) and First Schedule: https://new.kenyalaw.org/akn/ke/act/2010/constitution/eng@2010-09-03
- [S28] National Assembly Constituencies and County Assembly Wards Order (LN 14/2012): https://kenyalaw.org/akn/ke/act/ln/2012/14/eng@2022-12-31
- [S29] IEBC, final report on the first boundaries review (PDF): https://www.iebc.or.ke/uploads/resources/9fIr43YjUT.pdf
- [S30] KNBS, 2019 KPHC Volume I (county and sub-county): https://www.knbs.or.ke/wp-content/uploads/2023/09/2019-Kenya-population-and-Housing-Census-Volume-1-Population-By-County-And-Sub-County.pdf ; report index: https://www.knbs.or.ke/reports/kenya-census-2019/
- [S31] Parliament of Kenya, Senate Order Paper, Tue 22 Sep 2026 (PDF): https://parliament.go.ke/sites/default/files/2026-09/Order%20Paper%20-%20Tuesday%2C%2022.09.2026.pdf ; Bill record: https://libraryir.parliament.go.ke/items/b3e0ae57-1b7f-4565-bc07-fdecff631842
- [S32] Data Protection Act No. 24 of 2019 (ODPC copy, PDF): https://www.odpc.go.ke/wp-content/uploads/2024/02/TheDataProtectionAct__No24of2019.pdf
- [S33] Google Maps Platform pricing: https://mapsplatform.google.com/pricing/
- [S34] Google Maps Platform SKU price list: https://developers.google.com/maps/billing-and-pricing/pricing
- [S35] Mapbox pricing: https://www.mapbox.com/pricing
- [S36] OSMF Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/ · [S36a] MapLibre: https://maplibre.org/ · [S36b] MapLibre GL JS licence: https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/LICENSE.txt
- [S37] Consumer Protection Act No. 46 of 2012 (Kenya Law): https://new.kenyalaw.org/akn/ke/act/2012/46/eng@2022-12-31
- [S38] Competition Act (CAK copy, Rev. 2022, PDF): https://www.cak.go.ke/sites/default/files/Competition-Act-No-1-%20of%202010-Amended-as-at-2019.pdf
- [S39] Convex, Geospatial component page: https://www.convex.dev/components/geospatial
- [S40] get-convex/geospatial README: https://github.com/get-convex/geospatial (raw: https://raw.githubusercontent.com/get-convex/geospatial/main/README.md)
- [S41] npm registry, latest version: https://registry.npmjs.org/@convex-dev/geospatial/latest
- [S42] npm registry, package metadata: https://registry.npmjs.org/@convex-dev/geospatial
- [S43] Safaricom Daraja API catalogue: https://developer.safaricom.co.ke/apis
- [S44] Daraja Authorization: https://developer.safaricom.co.ke/apis/Authorization
- [S45] Daraja M-Pesa Express: https://developer.safaricom.co.ke/apis/MpesaExpressSimulate
- [S46] Daraja C2B: https://developer.safaricom.co.ke/apis/CustomerToBusiness
- [S47] Daraja B2C: https://developer.safaricom.co.ke/apis/BusinessToCustomer
- [S48] Daraja Getting Started: https://developer.safaricom.co.ke/apis/GettingStarted
- [S49] Safaricom M-PESA Charges: https://www.safaricom.co.ke/personal/m-pesa/mpesa-charges
- [S50] National Payment System Act No. 39 of 2011 (CBK copy, PDF): https://www.centralbank.go.ke/images/docs/legislation/NATIONAL%20PAYMENT%20SYSTEM%20ACT%20(No%2039%20of%202011)%20(2).pdf
- [S51] CBK, National Payments System page, linking the PSP directory as at 10 Aug 2026: https://www.centralbank.go.ke/national-payments-system/
- [S52] National Payment System Regulations 2014 (CBK copy, PDF): https://www.centralbank.go.ke/images/docs/legislation/NPSRegulations2014.pdf
- [S53] Data Protection (Registration of Data Controllers and Data Processors) Regulations 2021 (PDF): https://www.odpc.go.ke/wp-content/uploads/2024/03/THE-DATA-PROTECTION-REGISTRATION-OF-DATA-CONTROLLERS-AND-DATA-PROCESSORS-REGULATIONS-2021.pdf
- [S54] Data Protection (General) Regulations 2021 (PDF): https://www.odpc.go.ke/wp-content/uploads/2024/03/THE-DATA-PROTECTION-GENERAL-REGULATIONS-2021-1.pdf
- [S55] Data Protection (Complaints Handling Procedure and Enforcement) Regulations 2021 (PDF): https://www.odpc.go.ke/wp-content/uploads/2024/03/THE-DATA-PROTECTION-COMPLAINTS-HANDLING-AND-ENFORCEMENT.pdf
- [S56] ODPC FAQs: https://www.odpc.go.ke/faqs/
- [S57] ODPC press release, penalty notices against Whitepath and Regus Kenya (PDF): https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-issues-penalty-notice-against-whitepath.pdf
- [S58] ODPC Complaint No. 502 of 2024, determination (PDF): https://www.odpc.go.ke/wp-content/uploads/2024/07/ODPC-COMPLAINT-NO.502-OF-2024-DETERMINATION.pdf
- [S59] ODPC 2023 determinations: https://www.odpc.go.ke/2023-determinations/ (Casa Vera, Mulla Pride and Roma School PDFs linked there)
- [S60] CAK, Consumer Protection: https://www.cak.go.ke/consumer-protection
- [S61] CAK, cease-and-desist order against Fly540 (PDF): https://cak.go.ke/sites/default/files/downloads/2024-07/Competition%20Authority%20of%20Kenya%20Cease%20and%20Desist%20Order%20Against%20Fly540_1.pdf
- [S62] OECD, Good Practice Guide on Online Consumer Ratings and Reviews (2019): https://one.oecd.org/document/DSTI/CP%282019%295/FINAL/En/pdf

**Secondary sources**, used only where labelled: WeeTracker (2022-04-28), on Eden Life acquiring Lynk; Nation and The Star, on UrDrive; The Kenya Times, on Till merchant fees from Aug 2026; ACEPIS (2019-10-15), on the National Addressing System; DataGuidance and CIO Africa (Sept 2023), on the ODPC penalty amounts for Roma School, Casa Vera and Mulla Pride.

## UNVERIFIED register (28 items)

1. Fundi Link payment method.
2. My-Fundi vetting method, pricing and payment details.
3. Fundis (fundis.co.ke) vetting method, pricing, location and payment.
4. FundiLocator pricing and payment.
5. Fundi Flani vetting method.
6. Balozy per-booking fee amount (and the "no platform fees" conflict), plus payment method.
7. Tausi commission.
8. Fresha Kenya-specific pricing.
9. FixMyCar fees.
10. Sokoni fees and location method.
11. UrDrive operating status.
12. NITA trade-test fees.
13. The EPRA licence section of the Energy Act 2019, and licence fees.
14. The Daraja Transaction Status parameters.
15. The Till merchant receiving fee on a primary source.
16. Paybill business tariffs.
17. B2C tariffs.
18. NPS Act amendments after 2011.
19. Whether holding and releasing Client money makes Smart Fundis a PSP (needs legal counsel).
20. Whether face or voice video counts as "biometric data" without recognition processing (needs legal counsel).
21. Whether Smart Fundis must register with the ODPC below the threshold.
22. The ODPC penalty amounts for Roma School, Casa Vera and Mulla Pride.
23. CAK or other Kenyan guidance on online reviews.
24. Typical carpentry and painting price ranges (including per m²).
25. Mechanic repair prices beyond diagnostics.
26. An official machine-readable ward list, and the exact ward count in LN 14/2012.
27. The current gazetted administrative sub-county list.
28. The geospatial component's limits (filter keys, write cost) and polygon support in v0.2.1.
