# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Celengin** — a cute, pastel expense tracker for two people sharing a household: **Mei** and **Baskara**. UI is entirely in **Bahasa Indonesia**. Core jobs: record expenses + who paid, auto-compute who-owes-whom (split & settle up), and show monthly/yearly reports.

## Repository layout

| Path | What |
|------|------|
| `web/` | The web app — **Next.js (App Router) + TypeScript + Tailwind**, the current deliverable. Responsive: desktop sidebar → iPad icon rail → phone bottom tab. |
| `ios/` | Reserved for the native iOS app (placeholder; not yet implemented). |
| `supabase/migrations/` | Postgres schema + RLS + realtime (`0001_init.sql`). |
| `design-bundle/` | The Claude Design handoff this app was ported from. `spending-tracker/project/` holds the source HTML/JSX prototypes (web + phone) and screenshots; `chats/` holds the design conversation. Read-only reference. |
| `docs/PLAN.md` | Original product spec & data model. |

## Commands

All app commands run inside `web/`:

```bash
cd web
npm install
npm run dev          # dev server (localhost:3000)
npm run build        # production build
npm start            # serve the build
npm test             # engine unit tests (split/balance/format) via tsx
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

> `next build` is configured to skip the lint/typecheck phases for speed/CI
> resilience (`web/next.config.mjs`). Run `npm run typecheck` and `npm run lint`
> separately. The SWC compile is the source of truth for a green build.

## Architecture (web)

- **`src/lib/engine.ts`** — pure split & balance engine + `fmtRp`/`fmtRpShort`/date helpers. No side effects; unit-tested (`src/lib/__tests__/engine.test.ts`).
- **`src/lib/seed.ts`** — profiles, categories, expenses, settlements, recurring; ported verbatim from the design's `data.js`.
- **`src/lib/types.ts`** — domain types. **Money is always integer rupiah.**
- **`src/lib/store.tsx`** — React context store. Defaults to in-memory **local mode** (seed data, fully interactive offline); switches to **live mode** (Supabase read/write) when a session + profile exist.
- **`src/lib/supabase.ts` / `db.ts`** — browser client + row↔domain mapping.
- **`src/components/`** — shared UI: `Mascot` (the celengan SVG), `primitives` (Avatar/CatIcon/PayerBadge/BudgetBar), `DonutChart`, `CuteCalendar`, `icons`, `WebApp` (responsive shell + nav state).
- **`src/screens/`** — `Home`, `Reports`, `Settle`, `Settings`, `AddModal`.
- **`app/`** — routes: `/` (app), `/login`, `/onboarding`.

### Key invariants
- **Net balance is derived, never stored** (`engine.netMei`). For 2 people it resolves to one number + one direction. The seed reproduces the design's documented demo: *Mei utang Rp144.250 ke Baskara*.
- **`expense_shares` are stored inline** as `share_mei`/`share_bas` on `expenses` (atomic insert); DB CHECK enforces `share_mei + share_bas = amount`.
- **RLS** scopes every row to the user's household via the `my_household_ids()` SQL function.

## Design tokens (must stay exact)

Mei `#F7B5CB` (soft `#FDECF2`) · Baskara `#A8D8C8` (soft `#E7F4EF`) · accent `#FF8A5B` (dark `#F0703F`, soft `#FFE7DB`) · bg `#FBF5EF` · ink `#3F3530` · sub `#A99E94`. Fonts: **Fredoka** (display/numbers) + **Plus Jakarta Sans** (body). Tokens live in `src/lib/ui.ts` and `tailwind.config.ts`.

## Conventions

- No emoji in source/comments/docs (emoji are allowed as UI content/microcopy in the product).
- Conventional commits (`feat:`, `fix:`, `refactor:`, …).
- Money as integer rupiah; display via `fmtRp` (`Rp1.250.000`).
- TDD for engine/aggregation logic; round odd-rupiah split remainders to the payer.
- Secrets: only the **publishable (anon)** key may be `NEXT_PUBLIC_*`. The secret key is for local migrations only — never commit it; `.env.local` is gitignored.
