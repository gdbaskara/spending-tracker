// Pure split & balance engine — the heart of the app. Faithful port of the
// design's data.js logic, plus currency/date helpers. No side effects so it is
// trivially unit-testable (see PLAN.md verification section).
import type {
  Expense,
  PersonId,
  Settlement,
  Shares,
  SplitType,
} from "./types";

/**
 * Compute each person's owed share for one expense.
 * - equal: split in two; the odd-rupiah remainder goes to the payer so
 *   SUM(shares) === amount exactly.
 * - full: one person (owner, defaults to payer) carries the whole amount.
 * - custom: explicit shares passed via opts.shares (must already sum to amount).
 */
export function computeShares(
  amount: number,
  type: SplitType,
  payerId: PersonId,
  opts: { owner?: PersonId; shares?: Shares } = {}
): Shares {
  if (type === "full") {
    const owner = opts.owner ?? payerId;
    return {
      mei: owner === "mei" ? amount : 0,
      bas: owner === "bas" ? amount : 0,
    };
  }
  if (type === "custom" && opts.shares) {
    return { ...opts.shares };
  }
  // equal
  const half = Math.floor(amount / 2);
  const remainder = amount - half * 2;
  return {
    mei: half + (payerId === "mei" ? remainder : 0),
    bas: half + (payerId === "bas" ? remainder : 0),
  };
}

/**
 * Mei's net position. Positive => Baskara owes Mei; negative => Mei owes Baskara.
 * net = (money Mei fronted) - (Mei's obligations) - (Mei->Bas settlements) + (Bas->Mei settlements)
 */
export function netMei(expenses: Expense[], settlements: Settlement[]): number {
  let net = 0;
  for (const e of expenses) {
    if (e.payer_id === "mei") net += e.amount;
    net -= e.shares.mei;
  }
  for (const s of settlements) {
    if (s.from_id === "mei") net += s.amount;
    if (s.to_id === "mei") net -= s.amount;
  }
  return net;
}

/** Resolve the human-readable "who owes whom" view from the net balance. */
export function owesView(net: number): {
  debtor: PersonId;
  creditor: PersonId;
  amt: number;
} | null {
  if (Math.round(net) === 0) return null;
  // net > 0 => Baskara owes Mei
  return net > 0
    ? { debtor: "bas", creditor: "mei", amt: Math.abs(net) }
    : { debtor: "mei", creditor: "bas", amt: Math.abs(net) };
}

export function totalThisMonth(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function spendByCategory(expenses: Expense[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) out[e.category_id] = (out[e.category_id] ?? 0) + e.amount;
  return out;
}

export function paidByPerson(expenses: Expense[]): { mei: number; bas: number } {
  const out = { mei: 0, bas: 0 };
  for (const e of expenses) out[e.payer_id] += e.amount;
  return out;
}

// ── Currency ───────────────────────────────────────────────────────────────
// Largest amount accepted from manual entry (caps a single expense).
export const MAX_AMOUNT = 999_999_999;

export function fmtRp(n: number): string {
  const neg = n < 0;
  const v = Math.abs(Math.round(n));
  return (neg ? "-" : "") + "Rp" + v.toLocaleString("id-ID");
}

/**
 * Parse free-form input from the native numeric field into integer rupiah.
 * Strips every non-digit (so a formatted "Rp1.250.000" round-trips cleanly),
 * and rejects values past MAX_AMOUNT by keeping the previous amount.
 */
export function parseRpInput(raw: string, current: number): number {
  const digits = raw.replace(/\D/g, "");
  const next = digits ? Number(digits) : 0;
  return next > MAX_AMOUNT ? current : next;
}

export function fmtRpShort(n: number): string {
  const v = Math.round(n);
  if (v >= 1_000_000)
    return (
      "Rp" +
      (v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) +
      " jt"
    );
  if (v >= 1000) return "Rp" + Math.round(v / 1000) + "rb";
  return "Rp" + v;
}

// ── Dates ────────────────────────────────────────────────────────────────────
export const ST_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
export const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Long Indonesian date for an ISO day, e.g. "Senin, 1 Juni 2026". */
export function dateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  return `${WEEKDAYS[wd]}, ${d} ${ST_MONTHS[m - 1]} ${y}`;
}

export function isoOf(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

/** Real-world "today" in local time, month 0-indexed. */
export function todayParts(): { y: number; m: number; d: number } {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
}

/** Today as an ISO date string (YYYY-MM-DD) in local time. */
export function todayISO(): string {
  const t = todayParts();
  return isoOf(t.y, t.m, t.d);
}

/** Whole-day difference `aIso - bIso` (both YYYY-MM-DD), calendar-accurate. */
export function diffDays(aIso: string, bIso: string): number {
  const [ay, am, ad] = aIso.split("-").map(Number);
  const [by, bm, bd] = bIso.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000);
}

/** Shift an ISO date by a number of days, calendar-safe across month/year. */
export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return isoOf(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

/** Yesterday as an ISO date string. */
export function yesterdayISO(): string {
  return shiftISO(todayISO(), -1);
}

/** Relative label vs `todayIso` (defaults to the real today), else "30 Mei". */
export function dateLabel(iso: string, todayIso: string = todayISO()): string {
  if (iso === todayIso) return "Hari ini";
  if (iso === shiftISO(todayIso, -1)) return "Kemarin";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${SHORT_MONTHS[m - 1]}`;
}
export const dateChipLabel = dateLabel;

// ── Period filtering ─────────────────────────────────────────────────────────
export interface Period {
  y: number;
  m: number; // 0-indexed
}

/** True if an ISO date falls in the given year+month. */
export function inPeriod(iso: string, p: Period): boolean {
  const [y, m] = iso.split("-").map(Number);
  return y === p.y && m - 1 === p.m;
}

/** Filter expenses to one month. */
export function expensesIn<T extends { spent_at: string }>(items: T[], p: Period): T[] {
  return items.filter((e) => inPeriod(e.spent_at, p));
}

/** "Mei 2026" */
export function periodLabel(p: Period): string {
  return `${ST_MONTHS[p.m]} ${p.y}`;
}

/** "Mei" */
export function periodShort(p: Period): string {
  return SHORT_MONTHS[p.m];
}

export function stepPeriod(p: Period, dir: -1 | 1): Period {
  let m = p.m + dir;
  let y = p.y;
  if (m < 0) {
    m = 11;
    y -= 1;
  }
  if (m > 11) {
    m = 0;
    y += 1;
  }
  return { y, m };
}

/** The month (Period) containing real today. */
export function todayPeriod(): Period {
  const t = todayParts();
  return { y: t.y, m: t.m };
}

/** Per-month totals for a whole year, computed from real expenses. */
export function yearlyTrend(
  expenses: { spent_at: string; amount: number }[],
  year: number
): { m: string; total: number }[] {
  const totals = new Array(12).fill(0);
  for (const e of expenses) {
    const [y, mo] = e.spent_at.split("-").map(Number);
    if (y === year) totals[mo - 1] += e.amount;
  }
  return SHORT_MONTHS.map((m, i) => ({ m, total: totals[i] }));
}
