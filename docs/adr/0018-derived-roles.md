---
status: accepted
---

# ADR-18: Roles are derived in Convex, not stored or copied into Clerk

The PRD had a single `users.role` column, copied into Clerk public metadata so the Next.js proxy could route by role. We replace that with roles derived in Convex, and one User may hold several at once, because senior fundis will be both Fundis and Experts. A copied role would drift out of date on every approval, override and deactivation.

Roles are worked out as follows:
- **Fundi** means a Fundi profile exists. The base role is `fundi` or `none`.
- **Expert** means an active `experts` row with a non-empty `approvedTrades`.
- **Admin** means the email is on `ADMIN_EMAILS`.

`requireRole("expert")` reads the `experts` row, and `requireRole("admin")` checks the email.

## Consequences

- **Admin identity depends on a verified email.** The Clerk JWT template `convex` must include the `email` and `email_verified` claims. Convex rejects the admin check whenever `email_verified` is not true.
- **Routing:**
  - The Next.js proxy only checks that the user is signed in. It reads no roles from Clerk metadata.
  - A single `/dashboard` route reads `users.me` and redirects to the highest role held, in the order Admin, then Expert, then Fundi.
  - Dashboard pages show a skeleton until `users.me` loads. Convex enforces access on the server regardless.
- **Expert review rules:** Experts never see their own Assessments, and never decide an Appeal against their own decision.
- **No role is ever read from function arguments or Clerk metadata.**
