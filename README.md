# TICAP Logistics Management System

**TICAP Logistics (TLMS)** — _Centralized Scheduling and Logistics Services_

TLMS is the official logistics portal for a college cybersecurity organization. Phase 1 provides thesis-group photoshoot event configuration, capacity-safe scheduling, attendance operations, notifications, auditing, and role-aware exports. Room reservations, equipment requests, event logistics, gate-pass/document tracking, and general concerns are intentionally represented only as Coming Soon services.

## Stack

- Next.js App Router, React, strict TypeScript, Tailwind CSS
- Supabase Authentication and hosted PostgreSQL
- Prisma ORM with the PostgreSQL driver adapter
- Zod runtime validation; native accessible forms compatible with progressive enhancement
- Resend behind a transactional email interface, with a development logger
- ExcelJS for CSV and `.xlsx` exports
- Vitest, ESLint, and Prettier
- Vercel-compatible runtime and secure response headers

## Architecture and security model

```text
Browser → Next.js Server Component / Action / Route Handler
              ↓ verifies session
          Supabase Auth
              ↓ loads UserProfile and authorizes action
          Central RBAC/access layer
              ↓ only after authorization + Zod validation
          Prisma transaction → Supabase PostgreSQL
```

Supabase Auth proves identity. `UserProfile.role`, status, group membership, and event assignments are server-controlled. The browser never assigns a privileged role and never queries protected application tables using `supabase-js`. Prisma is imported only by server modules.

Prisma connections commonly use the database owner or another role that bypasses PostgreSQL RLS. **Prisma queries are therefore not claimed to be protected by Supabase RLS.** The initial migration revokes table/sequence access from `anon` and `authenticated` and enables RLS with no browser policies. This intentionally disables Supabase Data API access to application tables. If direct browser-readable tables are introduced later, grant only those tables and add narrowly scoped RLS policies first.

Protected operations call `requireActor`/`requirePermission`, apply resource checks (student group ownership or member assignment), validate untrusted data with Zod, and then use Prisma. UI visibility is convenience, never the boundary. Audit payloads strip credential-like keys. Public routes never expose private booking or group data.

### Booking integrity

- A PostgreSQL partial unique index permits one active booking per group/event.
- `idempotencyKey` is globally unique; a repeat by the same group returns its original booking.
- Slot claims use conditional `updateMany` (`reservedCount < capacity`) inside a serializable transaction.
- PostgreSQL checks keep capacity positive and `reservedCount` between zero and capacity.
- Rescheduling increments/claims the new slot before changing the booking and decrementing the old slot in the same transaction.
- Cancellation changes status, clears the current slot, decrements capacity, appends history, and audits the action atomically.
- Deadlines, slot/event status, ownership, and administrative override role/reason are checked on the server.
- Booking references use 64 random bits encoded as URL-safe text with a `TLMS-` prefix. They are display identifiers, not authorization tokens.

## Roles

- **Superadmin (Logistics Head):** full access, role/security management, restricted exports, settings, and complete audit visibility. Only this role can assign superadmin.
- **Admin (Assistant Logistics Head):** event/slot/booking/assignment/announcement operations, ordinary exports, and limited non-security audits.
- **Logistics Member:** assigned-event operational access and check-in/completion/no-show actions; no role, settings, configuration, or unrestricted export access.
- **Student:** own profile/group/booking/notifications only. Anonymous visitors may see public aggregate information but cannot finalize bookings.

## Local setup

Prerequisites: a supported Node.js release, npm, a Supabase project, and PostgreSQL credentials from that project.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and replace placeholders. Do not commit it.
3. Generate Prisma Client: `npm run db:generate`
4. Apply migrations to a development database: `npm run db:migrate`
5. Start: `npm run dev`

The application intentionally reports a clear environment-validation error if a database/auth integration is used without required configuration. Static public UI can be compiled without real credentials by supplying non-secret syntactically valid build placeholders; deployed protected routes require real values.

## Supabase setup

1. Create a Supabase project and retain the project URL and anon/publishable key for the `NEXT_PUBLIC_*` variables.
2. Copy the pooled connection string to `DATABASE_URL`; copy the direct/session connection string to `DIRECT_URL`. Percent-encode special characters in passwords.
3. In Authentication, enable email magic links (or verified-email OTP). Configure the production Site URL and allow `/auth/callback` for local and deployed redirect origins.
4. Customize Supabase authentication email content and SMTP for institutional delivery. Authentication mail is owned by Supabase; application transactional mail is owned by the email abstraction/Resend.
5. Apply `npm run db:deploy`. Confirm the migration revoked `anon`/`authenticated` access and that protected tables are not exposed by the Data API.
6. Do not place service-role keys or database URLs in `NEXT_PUBLIC_*` variables.

### Migrations

- Development: `npm run db:migrate`
- Production/CI: `npm run db:deploy`
- Client generation: `npm run db:generate`
- Inspection: `npm run db:studio`

The baseline migration includes Prisma-generated tables, enums, indexes, foreign keys, partial uniqueness, check constraints, Data API revocations, and RLS enablement. Historical bookings, booking history, audits, check-ins, and assignments use restrictive deletes so operational evidence is not silently erased.

## Environment variables

See `.env.example` for every variable and explanation.

Required at runtime: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, and `DIRECT_URL`. Production email also requires `RESEND_API_KEY` and `EMAIL_FROM`. `RATE_LIMIT_REDIS_URL`, `BOT_PROTECTION_SECRET`, and `TEST_DATABASE_URL` are integration points; no credentials are fabricated.

The included process-memory rate limiter is suitable only for local development because serverless instances do not share state. Connect a durable Redis-backed adapter and bot challenge before opening high-volume public booking. Supabase applies its own auth rate controls separately.

## Initial superadmin

There is no public seed route and no hardcoded account.

1. Configure Supabase, migrate, and have the intended Logistics Head complete one verified magic-link sign-in. This creates a `STUDENT` profile only.
2. In a trusted local/admin shell, set `DIRECT_URL`, `BOOTSTRAP_SUPERADMIN_EMAIL` to that exact verified email, and `BOOTSTRAP_CONFIRM=CREATE_INITIAL_SUPERADMIN`.
3. Run `npm run bootstrap:superadmin`.
4. Remove both `BOOTSTRAP_*` variables immediately.

The script refuses to run if any superadmin already exists, if confirmation is absent, or if the verified profile does not exist. Later role changes go through authenticated superadmin operations and are audited.

## Email

Supabase sends auth/magic-link mail. TLMS uses `EmailProvider` for booking confirmation and is structured for reschedule, cancellation, schedule/venue change, and reminder templates. With `RESEND_API_KEY` and `EMAIL_FROM`, it uses Resend. In non-production without those values it logs only recipient, subject, and a generated message ID—not private message content. Production refuses to silently use the logger.

Add and verify the sender domain in Resend, place keys in Vercel server environment variables, and configure institutional DNS records. A durable job queue/retry scheduler is a recommended follow-up for reminders and transient failures.

## Commands and testing

```text
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run format:check
npm run build
```

Unit tests cover the permission hierarchy, staff restrictions, student resource isolation, active-booking status semantics, full/blocked/past slot rejection, deadline overrides, acknowledgements, group-member validation, and export parameter constraints. Transaction logic additionally relies on the migration’s partial unique/check constraints and serializable conditional updates. A real Supabase/PostgreSQL integration suite for simultaneous connections and browser E2E workflows remains the next testing milestone; use a disposable `TEST_DATABASE_URL`, never production data.

## Deployment to Vercel

1. Import the repository into Vercel.
2. Add all required variables for Production and Preview, using separate Supabase projects when possible.
3. Run `npm run db:deploy` from controlled CI before promoting the application; do not run development migrations during requests.
4. Use `npm run build` as the build command. Prisma Client generation should run in CI (`npm run db:generate`) before build.
5. Add the Vercel origin to Supabase Auth redirect allow-lists and set `NEXT_PUBLIC_APP_URL`.
6. Configure Resend’s verified sender and a shared rate-limit provider.
7. Verify security headers, magic-link cookies, mobile/desktop layouts, exports, and least-privilege database grants in the deployed environment.

## Current Phase 1 limitations

- The normalized models and secured actions implement the booking core, group creation, event/slot generation, attendance, role changes and invitations, assignments, announcements/settings, notifications, audit records, and exports. A richer event edit form and staff “book on behalf” flow remain follow-up screens even though their domain/security foundations exist.
- Public schedule and announcements use safe empty states until database-backed publication views are enabled.
- Rate limiting is process-local in development; bot protection is an integration point.
- Email is sent inline after booking; background retries/reminders are not scheduled.
- Database concurrency needs verification against a disposable hosted PostgreSQL instance because no project credentials are committed.
- Official TICAP logo, palette, contact channel, policies, dates, and venue must be supplied by the organization. Current tokens and `TL` mark are replaceable placeholders.
- Future services are navigation/domain entries only and are not implemented.

## Roadmap

The recommended next milestone is a deployment hardening sprint: connect a disposable Supabase environment, run true concurrent booking/rescheduling integration tests, add Playwright coverage for student and staff workflows, finish admin mutation dialogs/editors, add Redis rate limiting and bot protection, enqueue email retries/reminders, and conduct an accessibility/privacy review with real institutional content. After photoshoot operations are accepted, introduce future modules along `Service → Request → Resource → Schedule → Approval → Fulfillment` without forcing photoshoots into an overly generic model.
