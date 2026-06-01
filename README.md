# Celengin

A cute, pastel **expense tracker for two people** sharing a household (Mei and Baskara). Record expenses and who paid, auto-compute who-owes-whom (split and settle up), and view monthly and yearly reports. The UI is entirely in **Bahasa Indonesia**.

> Live: https://celengin-mei-baskara.netlify.app

## Features

- **Record expenses** with category, payer, note, and date (with a cute calendar picker).
- **Flexible splitting** per expense: split evenly (_bagi rata_), custom portions (_beda porsi_), or paid solo (_sendiri_).
- **Automatic balance** — derives a single "who owes whom" number and direction for the two people; no balances are stored.
- **Settle up** — record settlements that zero out the running balance.
- **Receipt scanning** — snap a struk and Gemini Flash performs OCR, extracts the total/date/merchant, and classifies the category.
- **Reports** — monthly totals, spend-by-category donut, and a yearly trend.
- **Native numeric entry** — the amount field uses the device's system numpad (no in-app keypad).
- **Works offline** — defaults to an in-memory local mode with seed data; switches to live mode (Supabase) once signed in.
- **Responsive** — desktop sidebar, iPad icon rail, phone bottom tab.

## Tech stack

- **Web:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + RLS + Realtime + Auth)
- **Receipt OCR:** Google Gemini Flash (server-side route)
- **Hosting:** Netlify (`@netlify/plugin-nextjs`)
- **Tests:** Vitest + Testing Library (components) and a lightweight `tsx` runner (pure engine logic)

## Repository layout

| Path | What |
|------|------|
| `web/` | The web app (the current deliverable). |
| `ios/` | Reserved for a future native iOS app (placeholder). |
| `supabase/migrations/` | Postgres schema, RLS, realtime, and cron migrations. |
| `docs/PLAN.md` | Original product spec and data model. |
| `design-bundle/` | The design handoff this app was ported from (read-only reference). |
| `CLAUDE.md` / `AGENTS.md` | Guidance for AI coding assistants working in this repo. |

See [`web/README.md`](web/README.md) for app architecture and development details.

## Getting started

Prerequisites: Node.js 20+ and a Supabase project.

```bash
cd web
cp .env.local.example .env.local   # then fill in your keys
npm install
npm run dev                        # http://localhost:3000
```

### Environment variables

Copy `web/.env.local.example` to `web/.env.local` and fill in:

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | browser | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser | Publishable (anon) key. Safe to expose. |
| `SUPABASE_SECRET_KEY` | local only | For running migrations/seeds from your machine. **Never** commit or prefix with `NEXT_PUBLIC_`. |
| `GEMINI_API_KEY` | server | Receipt OCR. Get a free key at https://aistudio.google.com/apikey |

`.env.local` is gitignored.

## Commands

All commands run inside `web/`:

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build
npm start            # serve the build
npm test             # engine unit tests + component tests
npm run test:engine  # pure split/balance/format logic (tsx)
npm run test:components  # Vitest + Testing Library
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

> `next build` skips lint/typecheck for CI resilience; run `npm run typecheck`
> and `npm run lint` separately. The SWC compile is the source of truth.

## Database

Migrations live in `supabase/migrations/` and are applied in order. They define
the schema, row-level security (every row scoped to the user's household via the
`my_household_ids()` function), realtime, and the recurring-expense cron job.

## Deployment

Hosted on Netlify, linked to the `celengin-mei-baskara` project. The three
public/server env vars are configured in the Netlify project (the secret key is
local-only and is not needed at runtime).

```bash
cd web
netlify deploy --build --prod
```

## License

Private project. All rights reserved.
