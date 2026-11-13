# Security-awareness & phishing-simulation training, localized

- **Concept:** SaaS that sends simulated phishing/social-engineering tests to a company's staff and delivers short, localized micro-learning content, with a dashboard tracking click rates and improvement over time.
- **Origin:** Global — KnowBe4 is the dominant global platform in this category; Phriendly Phishing does the same for the Asia-Pacific market with localized content.
- **Examples:** KnowBe4 (publicly traded, widely described as the world's largest security-awareness platform); Phriendly Phishing.
- **Evidence of demand:** This is a large, mature enterprise-software category globally; Kenya's mobile-money-heavy economy is a well-documented target for social-engineering fraud (fake M-Pesa messages, SIM-swap scams, WhatsApp-based impersonation).
- **Kenya landscape:** No dedicated Kenya-headquartered platform was found; global tools exist but are enterprise-priced and built around Western phishing scenarios (email-based corporate fraud), not Kenya-specific patterns.
- **Opportunity:** Localize the training content — M-Pesa fraud, SIM-swap, WhatsApp CEO fraud — and price for the local SME/SACCO/bank market rather than global enterprise budgets.
- **Target customers:** Banks, SACCOs, insurers, fintechs, and mid-size corporates (50–500+ staff) worried about social-engineering losses.
- **Revenue model:** Annual subscription priced per employee/seat, tiered by company size.
- **Difficulty:** Low–Medium — mostly content creation plus email/SMS simulation infrastructure and a simple LMS; no major regulatory barrier.
- **Scalability:** High — the same fraud patterns (mobile-money social engineering) repeat across East and West Africa with light localization.
- **Risks:** Enterprise sales cycles can be slow; needs credible security content, ideally reviewed by a practicing security professional; incumbents could localize and undercut if the category proves out.
- **MVP:** A simple simulated-phishing email tool (fake M-Pesa/bank alerts sent to a pilot company's staff list, click-rates tracked) plus a short Swahili/English microlearning video library, sold to one pilot company.

## Deep dive

Customers are mid-size Kenyan banks, SACCOs, insurers and fintechs — organizations that already take fraud seriously but find KnowBe4-style global tools expensive and culturally generic. Price per-seat annually, e.g., KSh 300–800/employee/year, undercutting global enterprise pricing significantly. MVP: a simulated-phishing email tool built around Kenya-specific scenarios (fake M-Pesa alerts, SIM-swap requests) plus a short video library. First steps: approach one SACCO or mid-size bank's IT security lead directly with a free pilot test — a concrete "here's your organization's click-rate" result is a strong sales hook once you have one real case study.

---

Source: `PROJECTS.md` (Online Business Models: Proven Abroad, Underdeveloped in Kenya).


---

## Stack & dev

Scaffolded as a Next.js 16 + Drizzle (Postgres) app. The schema in `src/db/schema.ts` is the current source of truth for the data model; auth and payment integrations are not yet wired up.

```
npm install
# point .env at a Postgres instance (see .env.example)
npm run db:generate   # drizzle-kit: emit SQL migrations from the schema
npm run db:migrate    # apply migrations from ./drizzle
npm run db:seed       # seed sample company/users/employees/template/campaign data
npm run dev           # Next.js dev server on :3000
```

What is here:
- `src/db/schema.ts` — Drizzle Postgres schema specific to this domain
- `src/db/index.ts` — pooled `pg` + Drizzle client
- `drizzle.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — basic Next.js app scaffold
- `scripts/migrate.ts`, `scripts/seed.ts` — migration runner and idempotent seed script
- `.gitignore`, `.env.example`

What is still a stub:
- Auth (sessions, password reset, email verification)
- Payments (M-Pesa Daraja / Paystack / card) — stack-specific, add per project.
