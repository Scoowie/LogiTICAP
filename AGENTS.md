# AGENTS.md — TICAP Logistics

## Purpose

This repository is TLMS, the official TICAP Logistics portal. Phase 1 is the cybersecurity thesis-group photoshoot scheduler. Room, equipment, event, gate-pass/document, and general-concern modules remain Coming Soon until explicitly commissioned.

## Boundaries and technology

- Use Next.js App Router, strict TypeScript, Tailwind, accessible reusable components, Supabase Auth/PostgreSQL, server-only Prisma, Zod, the email abstraction, and CSV/XLSX exports.
- Supabase proves identity. Server RBAC/resource checks authorize. Prisma performs authorized operations. PostgreSQL constraints preserve integrity.
- Never say Prisma is protected by Supabase RLS when its connection role bypasses RLS.
- Browser code must not import `src/lib/db.ts`, Prisma Client, database URLs, service-role keys, or privileged environment variables.
- Protected application tables are Prisma-only. Keep Supabase Data API grants revoked unless a specific direct table use has reviewed RLS policies.
- Keep photoshoot concepts explicit; do not introduce a generic service/request abstraction that makes the Phase 1 domain harder to understand.

## Commands

- `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`
- `npm test`, `npm run test:coverage`, `npm run format`, `npm run format:check`
- `npm run db:generate`, `npm run db:migrate`, `npm run db:deploy`, `npm run db:studio`
- `npm run bootstrap:superadmin` is one-time only and must retain all safety checks.

## Conventions

- Validate every untrusted form, action, route, search/filter, export query, and environment input with Zod.
- Keep Server Actions thin; place reusable domain logic under `src/lib`.
- Call `requireActor`/`requirePermission` and enforce resource ownership/assignment before each protected Prisma operation.
- Use fixed enums/statuses. Do not accept roles from public registration metadata.
- Display user dates in `Asia/Manila`; store timezone-aware instants.
- Use semantic labels/headings/tables, visible focus, screen-reader status/error text, keyboard-operable controls, confirmation for disruptive actions, and overflow-safe responsive layouts.
- The active UI system is Hextech Arcane Academia. Keep its canonical ivory, bronze, gold, sky, forest, and banner tokens in `src/app/globals.css`; do not scatter alternative palettes through feature code.
- Use locally bundled Cinzel for ceremonial display text and Source Sans 3 for interfaces. Prefer `Button`, `Card`, `Status`, `EmptyState`, `.hex-btn`, `.hex-input`, and `.hex-panel` before creating one-off primitives.
- Public pages use the brighter Sky-Citadel atmosphere; authenticated operational pages use the restrained Conservatory atmosphere. Use fine metallic borders, soft depth, archival surfaces, and crisp operational typography—never hard black offset shadows or sticker rotation.
- Decorative motifs must remain secondary to content, respect `prefers-reduced-motion`, and all controls must remain at least 44px tall.
- The TL lettermark remains a replaceable placeholder; do not invent official logos, dates, contacts, or policies.
- Preserve unrelated user changes. Never commit secrets or use destructive Git commands.

## Role hierarchy

- SUPERADMIN: complete system/security access; only role that may assign SUPERADMIN.
- ADMIN: events, slots, bookings, assignments, announcements, standard exports, limited audit. No superadmin assignment/security actions.
- LOGISTICS_MEMBER: assigned-event operational data and attendance only.
- STUDENT: own profile/group/booking/notifications only.

UI visibility is never authorization. Add both permission and row/resource tests for every new protected operation.

## Booking invariants

- One active booking per thesis group/event; retain completed/cancelled/no-show history.
- One representative per group. Structured members, never a single text blob.
- Never trust browser availability. Claim capacity conditionally in a serializable transaction.
- Idempotency keys must safely return/reject duplicates and must not cross group boundaries.
- Enforce event/slot state, capacity, ownership, and all deadlines on the server.
- Reschedule by claiming the new slot before releasing the old slot in one transaction.
- Cancellation restores capacity atomically.
- Administrative overrides require an authorized role, written reason, history, and audit.
- Append booking history; never overwrite evidence of the prior schedule.
- Public references are random display identifiers, never authentication credentials.

## Security and tests

- Minimize sensitive output, keep private data out of public URLs/pages, sanitize audit payloads, and return generic safe errors.
- Maintain response headers, secure Supabase cookies/session validation, rate-limit and bot adapters, export field restrictions, and sensitive-export audits.
- Review every cascade. Do not cascade-delete bookings, histories, attendance, assignments, or audits.
- Test permissions, isolation, staff restrictions, duplicates, full slots, concurrency, rescheduling ordering, cancellation capacity, deadlines, record-ID manipulation, export authorization, and Zod schemas.
- Before handoff run install, Prisma generation, lint, typecheck, tests, and production build. Report external checks honestly when credentials prevent them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
