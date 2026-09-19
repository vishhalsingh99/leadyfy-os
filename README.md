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
