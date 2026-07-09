# PartsBench

A workflow-based dashboard for testing, organising, valuing, listing, and selling second-hand PC components.

See [`docs/00-OVERVIEW.md`](docs/00-OVERVIEW.md) for the full project overview, stack, and locked-in design decisions. The build is broken into sections in [`docs/build/`](docs/build/); repo/coding conventions are in [`docs/standards/`](docs/standards/).

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the values (see comments in the file for which build section each group belongs to).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript, no emit
- `npm run format` / `npm run format:check` — Prettier

## Stack

Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, Neon (Postgres) + Prisma, Cloudflare R2, deployed on Vercel. Full rationale in [`docs/00-OVERVIEW.md`](docs/00-OVERVIEW.md).
