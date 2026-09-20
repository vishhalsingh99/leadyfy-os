# Leadyfy OS

Internal agency management platform for a UGC/digital marketing agency —
covers the full lifecycle from lead and client onboarding through scripting,
creator booking, shoots, video production, client review, delivery, and
payouts.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions / Server Components over a service
  layer (`src/lib/services`)
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Auth:** Supabase Auth with custom RBAC (role/employee-role/client
  scoping enforced in the service layer)

## Getting started

1. Copy `.env.example` to `.env` and fill in your Supabase project's
   connection strings and API keys.
2. Install dependencies and set up the database:

   ```bash
   pnpm install
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

3. Run the dev server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). The seed script
   prints demo login credentials for each role (Owner, Admin, Sales, Script
   Writer, Shoot Manager, Editor, and two Client portal accounts) to the
   console when it runs.

## Roles

- **Owner / Admin** — full internal access, financials, dashboard, RBAC and
  system administration.
- **Employee** (Sales / Script Writer / Shoot Manager / Editor) — scoped to
  their own assigned work across clients, orders, scripts, shoots, and
  videos.
- **Client** — an isolated portal (`/portal`) for order progress, script and
  video approvals, invoices, and support tickets.

## What's implemented

- **Auth & RBAC**: real Supabase Auth login, four roles (Owner, Admin,
  Employee, Client) plus four Employee sub-roles (Sales, Script Writer,
  Shoot Manager, Editor), all enforced in the service layer rather than at
  the UI level. Deactivating a user locks them out immediately even with a
  valid session.
- **Clients, Orders, Scripts, Creators (+ availability), Shoots, Videos,
  Tasks** — full list/create/edit/detail flows, each scoped so a Sales rep
  only sees their own clients/orders, a Script Writer only their assigned
  scripts, and so on. Owner/Admin see everything.
- **Script and video pipelines** are state machines, not free-text status
  fields — a script can't jump from "Draft" to "Approved" skipping review,
  and a video can't skip QA. Owner/Admin don't bypass this.
- **Double-booking prevention** for creators (can't schedule the same
  creator on two active shoots the same day) and duplicate-payout
  prevention (can't approve/pay a creator twice for the same shoot).
- **Client portal**: a separate set of screens and queries (not a filtered
  view of the internal ones) for orders, scripts, videos, invoices, and
  support tickets — a client can never see cost breakdowns, creator
  identities, or other clients' data.
- **Financial ledgers** (Payments, Expenses, Creator Payouts) and an
  **executive dashboard** with role-branched KPIs — financial figures only
  show for Owner/Admin, and every number is computed live from the same
  data the list pages show (never a separately-maintained total that could
  drift out of sync).
- **Admin utilities**: Users & RBAC (with deactivate/reactivate), Employee
  directory, system-wide Activity Log, in-app Notifications.

## What hasn't been touched

Cross-checked against the original requirements doc — these are real gaps,
not hedging:

- **No file/asset storage.** Videos have `draftAssetId`/`finalAssetId`
  columns and there's an `Asset` table, but nothing in the UI writes to
  them yet — there's currently no way to actually attach a Drive link (or
  any file) to a video. This is the biggest functional hole: final delivery
  doesn't produce a usable link today.
- **No automatic notifications.** The `Notification` model, the bell in the
  header, and "mark all read" all work — but nothing in the codebase
  actually *creates* a notification when a script gets approved, a shoot is
  coming up, a payment comes in, etc. The engine described in the spec
  (auto-alerts on ~10 different events) isn't wired up; only the demo data
  and the read/display side exist.
- **No REST or GraphQL API.** Everything goes through Server Actions and
  Server Components calling the service layer directly. That's fine for
  this app, but there's no documented external API surface, which the
  handover requirements call for.
- **Employee records are read-only.** Creating a new employee also means
  creating a new Supabase Auth login, which needs the service-role key —
  that's currently only used by the seed script. Right now the only way to
  add staff is to add them to the seed and re-run it.
- **Several entity fields from the spec were left out** in favor of a
  smaller, working schema: Creator profiles don't have photo, gender, age
  group, or bank/UPI/portfolio details; Client records don't have WhatsApp,
  a separate brand name, GST/Tax ID, lead source, or brand-kit assets;
  Orders don't break out GST or support more than one assigned employee;
  Shoots don't have separate Cameraman/Shooting Assistant fields or a
  pre-shoot checklist / post-shoot verification step; Employees don't track
  salary, joining date, or performance stats; Tasks have no attachments;
  Expenses don't record who logged them or a receipt file.
- **No calendar view.** Shoots are a sortable list/table, not the daily /
  weekly / monthly calendar the spec describes.
- **Never opened in an actual browser.** Every check so far was done by
  replaying HTTP requests or testing the underlying logic directly (no
  Playwright/browser automation was available in this environment). It
  should work in a real browser — but that's still worth doing once before
  trusting it fully.
- **Not deployed.** Runs locally against the real Supabase project; nothing
  has been pushed to Vercel or any hosting yet, and there's no backup
  policy or deployment runbook written.

## Suggested next steps

Roughly in priority order:

- Storage abstraction + Drive-link paste UI for videos — the biggest
  functional hole (final delivery has no usable link today).
- Automatic notification triggers (~10 event types across services) — the
  read/display side already works, only the write side is missing.
- Employee provisioning (create a real login via the Supabase Admin API)
  instead of editing the seed script.
- Thin REST API layer over the existing services, for the handover
  deliverable / future integrations.
- Real browser test pass (Playwright smoke suite) and a small unit-test
  suite around the service layer.
- Row Level Security as defense-in-depth on top of the existing
  service-layer authorization.
- Extended fields across Client, Order, Creator, Employee, Shoot (GST,
  brand kit, demographics, bank/UPI, salary, pre/post-shoot checklists) —
  straightforward schema/UI additions, no architectural risk.
- Task attachments and Expense receipt files.
- Calendar view for shoots (daily/weekly/monthly) instead of the current
  sortable list.
- Deployment guide / backup policy write-up.

None of this requires re-architecting anything already built — it's
breadth (more fields, more screens), not a hard problem.
