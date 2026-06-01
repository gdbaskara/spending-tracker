// Seed data — ported verbatim from the design's data.js. Used as the offline
// fallback and as the source for the Supabase seed migration. Money in rupiah.
import { computeShares, todayISO, shiftISO, diffDays } from "./engine";
import type {
  Category,
  Expense,
  PersonId,
  Profile,
  Recurring,
  Settlement,
  SplitType,
  TrendPoint,
} from "./types";

export const PROFILES: Record<PersonId, Profile> = {
  mei: { id: "mei", name: "Mei", color: "#F7B5CB", soft: "#FDECF2", initial: "M" },
  bas: { id: "bas", name: "Baskara", color: "#A8D8C8", soft: "#E7F4EF", initial: "B" },
};

export const CATEGORIES: Record<string, Category> = {
  makan: { id: "makan", name: "Makan", icon: "makan", color: "#FF9E64", budget: 1_200_000 },
  sewa: { id: "sewa", name: "Sewa Rumah", icon: "sewa", color: "#7FA9D6", budget: 3_000_000 },
  tagihan: { id: "tagihan", name: "Tagihan", icon: "tagihan", color: "#F4C04E", budget: 1_200_000 },
  belanja: { id: "belanja", name: "Belanja", icon: "belanja", color: "#5FC6B0", budget: 1_500_000 },
  hiburan: { id: "hiburan", name: "Hiburan", icon: "hiburan", color: "#F58BB0", budget: 400_000 },
  transport: { id: "transport", name: "Transport", icon: "transport", color: "#B59CE6", budget: 500_000 },
  lainnya: { id: "lainnya", name: "Lainnya", icon: "lainnya", color: "#9AA7B5", budget: null },
};

export const CATEGORY_LIST: Category[] = Object.values(CATEGORIES);

// ── Keep the demo "current" ──────────────────────────────────────────────────
// The sample data was authored with this as the most-recent date ("today").
// At runtime we shift every sample date by (real today - anchor), so the demo
// always shows recent activity ending today, no matter when the app is opened
// or deployed. Amounts/payers/splits are untouched, so the documented demo
// balance (Mei utang Rp144.250 ke Baskara) is preserved.
const SEED_ANCHOR = "2026-05-30";
const SEED_OFFSET = diffDays(todayISO(), SEED_ANCHOR);
const rel = (iso: string): string => shiftISO(iso, SEED_OFFSET);

// helper to build an expense with computed shares
function exp(
  id: string,
  spent_at: string,
  category_id: string,
  payer_id: PersonId,
  amount: number,
  description: string,
  split_type: SplitType = "equal",
  extra: { owner?: PersonId; recurring?: boolean } = {}
): Expense {
  return {
    id,
    spent_at: rel(spent_at),
    category_id,
    payer_id,
    amount,
    description,
    split_type,
    owner: extra.owner,
    recurring: extra.recurring,
    shares: computeShares(amount, split_type, payer_id, { owner: extra.owner }),
  };
}

export const SEED_EXPENSES: Expense[] = [
  // Makan
  exp("e1", "2026-05-30", "makan", "mei", 84_000, "Makan malam Padang"),
  exp("e2", "2026-05-29", "makan", "mei", 36_000, "Kopi Kenangan x2"),
  exp("e3", "2026-05-27", "makan", "bas", 58_000, "GoFood ayam geprek"),
  exp("e4", "2026-05-24", "makan", "mei", 175_000, "Brunch akhir pekan"),
  exp("e5", "2026-05-18", "makan", "bas", 268_000, "Sushi date 🍣"),
  exp("e6", "2026-05-15", "makan", "mei", 40_000, "Nasi goreng pinggir jalan"),
  exp("e7", "2026-05-12", "makan", "bas", 52_000, "Bakso malam"),
  exp("e8", "2026-05-08", "makan", "mei", 187_000, "Belanja bahan masak"),
  exp("e9", "2026-05-05", "makan", "bas", 65_000, "Martabak manis"),
  exp("e10", "2026-05-03", "makan", "mei", 195_000, "Catering meeting"),
  // Sewa
  exp("e11", "2026-05-01", "sewa", "bas", 3_000_000, "Sewa rumah Mei", "equal", { recurring: true }),
  // Tagihan
  exp("e12", "2026-05-25", "tagihan", "bas", 385_000, "Listrik PLN", "equal", { recurring: true }),
  exp("e13", "2026-05-20", "tagihan", "mei", 350_000, "Internet IndiHome", "equal", { recurring: true }),
  exp("e14", "2026-05-15", "tagihan", "bas", 150_000, "Air PDAM", "equal", { recurring: true }),
  exp("e15", "2026-05-12", "tagihan", "mei", 100_000, "Pulsa & paket data"),
  exp("e16", "2026-05-08", "tagihan", "bas", 100_000, "Spotify + Netflix", "equal", { recurring: true }),
  // Belanja
  exp("e17", "2026-05-28", "belanja", "bas", 432_500, "Belanja bulanan Superindo"),
  exp("e18", "2026-05-18", "belanja", "mei", 220_000, "Skincare Mei", "full", { owner: "mei" }),
  exp("e19", "2026-05-10", "belanja", "bas", 118_000, "Sabun & deterjen"),
  exp("e20", "2026-05-06", "belanja", "mei", 99_000, "Galon & gas"),
  // Hiburan
  exp("e21", "2026-05-22", "hiburan", "bas", 100_000, "Tiket bioskop XXI"),
  exp("e22", "2026-05-16", "hiburan", "mei", 250_000, "Tiket konser"),
  exp("e23", "2026-05-04", "hiburan", "bas", 100_000, "Game & App Store", "full", { owner: "bas" }),
  // Transport
  exp("e24", "2026-05-24", "transport", "mei", 50_000, "Bensin motor"),
  exp("e25", "2026-05-20", "transport", "bas", 28_000, "Gojek ke kantor"),
  exp("e26", "2026-05-17", "transport", "mei", 32_000, "Gojek pulang"),
  exp("e27", "2026-05-09", "transport", "bas", 25_000, "Parkir & tol"),
  exp("e28", "2026-05-02", "transport", "mei", 45_000, "Bensin motor"),
  // Lainnya
  exp("e29", "2026-05-09", "lainnya", "bas", 150_000, "Kado ultah teman"),
];

export const SEED_SETTLEMENTS: Settlement[] = [
  { id: "s1", from_id: "mei", to_id: "bas", amount: 1_500_000, note: "Lunasin sewa", settled_at: rel("2026-05-02") },
];

export const SEED_RECURRING: Recurring[] = [
  { id: "r1", description: "Sewa rumah Mei", category_id: "sewa", payer_id: "bas", amount: 3_000_000, split_type: "equal", day: 1, active: true },
  { id: "r2", description: "Listrik PLN", category_id: "tagihan", payer_id: "bas", amount: 385_000, split_type: "equal", day: 25, active: true },
  { id: "r3", description: "Internet IndiHome", category_id: "tagihan", payer_id: "mei", amount: 350_000, split_type: "equal", day: 20, active: true },
  { id: "r4", description: "Air PDAM", category_id: "tagihan", payer_id: "bas", amount: 150_000, split_type: "equal", day: 15, active: true },
  { id: "r5", description: "Spotify + Netflix", category_id: "tagihan", payer_id: "bas", amount: 100_000, split_type: "equal", day: 8, active: false },
];

// 12-month baseline totals (Jan..Des). Used only to decorate empty months that
// fall BEFORE the current month in the demo year, so the yearly chart looks
// alive regardless of when the app is opened. The current month is filled at
// runtime from real expenses; future months stay empty. See store.tsx.
export const MONTHLY_TREND: TrendPoint[] = [
  { m: "Jan", total: 6_320_000 },
  { m: "Feb", total: 6_180_000 },
  { m: "Mar", total: 6_910_000 },
  { m: "Apr", total: 6_540_000 },
  { m: "Mei", total: 6_730_000 },
  { m: "Jun", total: 6_410_000 },
  { m: "Jul", total: 6_880_000 },
  { m: "Agu", total: 6_250_000 },
  { m: "Sep", total: 6_700_000 },
  { m: "Okt", total: 6_490_000 },
  { m: "Nov", total: 6_820_000 },
  { m: "Des", total: 6_600_000 },
];
