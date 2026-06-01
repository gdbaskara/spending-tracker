# Celengin — Web (Next.js)

Responsive web app (desktop sidebar → iPad icon rail → phone bottom tab) ported
pixel-for-pixel from the Claude Design handoff (`../design-bundle`). Bahasa
Indonesia, cute pastel theme, for Mei & Baskara.

Stack: **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind**.

## Quick start

```bash
cd web
cp .env.local.example .env.local   # fill in Supabase keys (see below)
npm install
npm run dev                        # http://localhost:3000
```

Without Supabase keys the app still runs fully — it falls back to in-memory seed
data ("local mode"), so you can click through every screen offline.

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the build |
| `npm test` | All tests (engine + components) |
| `npm run test:engine` | Pure split/balance/format logic via tsx |
| `npm run test:components` | Vitest + Testing Library (jsdom) |
| `npm run typecheck` | `tsc --noEmit` (build itself skips typecheck for speed) |
| `npm run lint` | ESLint |

> Note: `next build` is configured to skip the lint/typecheck phases
> (`next.config.mjs`) — run `npm run typecheck` / `npm run lint` separately.

## Architecture

- `src/lib/engine.ts` — pure split & balance engine + currency/date helpers. Unit-tested.
- `src/lib/seed.ts` — seed data (profiles, categories, expenses, settlements, recurring) ported from the design's `data.js`.
- `src/lib/types.ts` — domain types. Money is always integer rupiah.
- `src/lib/store.tsx` — React context store. Local (seed) mode by default; switches to live Supabase mode when a session + profile exist.
- `src/lib/supabase.ts` / `src/lib/db.ts` — Supabase browser client + data-access mapping.
- `src/components/` — shared UI: `Mascot`, `primitives` (Avatar/CatIcon/PayerBadge/BudgetBar), `DonutChart`, `CuteCalendar`, `icons`, `WebApp` (responsive shell).
- `src/screens/` — `Home`, `Reports`, `Settle`, `Settings`, and `AddModal`
  (composed from `src/screens/add/`: `AmountInput`, `DeleteConfirmOverlay`,
  `SavedOverlay`, shared `styles`).
- `app/` — Next App Router: `/` (app), `/login`, `/onboarding`, and
  `/api/scan-receipt` (Gemini receipt OCR).

The net balance is **always derived** from the ledger (`engine.netMei`), never
stored — for 2 people it resolves to a single number + direction. The seed data
reproduces the design's documented demo balance: **Mei utang Rp144.250 ke Baskara**.

### Amount entry

The "Jumlah" field is a native numeric `<input>` (`inputMode="numeric"`), so
mobile/iPad show the system numpad instead of an in-app keypad. Typed digits are
parsed into integer rupiah by `parseRpInput` (strips separators, caps at
`MAX_AMOUNT`) while the formatted `Rp…` display stays in sync.

### Testing

Two harnesses, kept separate so they never collide:

- **Engine** — dependency-free assertions for split/balance/format logic
  (`src/lib/__tests__/engine.test.ts`), run with tsx.
- **Components** — Vitest + Testing Library under jsdom, scoped to `*.test.tsx`
  (`vitest.config.ts` / `vitest.setup.ts`).

## Supabase

1. Run the migration in `../supabase/migrations/0001_init.sql` (SQL Editor or CLI).
2. Put your project URL + **publishable (anon)** key in `.env.local`.
3. Sign up at `/login`, then `/onboarding` creates your household, seeds default
   categories (and optionally sample data), and maps you to `mei`/`bas`.

RLS scopes every row to the user's household via `my_household_ids()`. Realtime is
enabled on `expenses`, `settlements`, `recurring_expenses`.

> Security: the **secret** key must never be in `NEXT_PUBLIC_*` or committed —
> it's only for running migrations from your machine. Rotate it if it has been shared.
