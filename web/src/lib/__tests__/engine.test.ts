// Lightweight, dependency-free assertions for the split/balance engine.
// Run with: npx tsx src/lib/__tests__/engine.test.ts  (or wire into Vitest).
import assert from "node:assert";
import {
  computeShares,
  netMei,
  owesView,
  fmtRp,
  parseRpInput,
  MAX_AMOUNT,
  fmtRpShort,
  dateLabel,
  shiftISO,
  expensesIn,
  totalThisMonth,
  spendByCategory,
  yearlyTrend,
  inPeriod,
  stepPeriod,
} from "../engine";
import type { Expense, Settlement } from "../types";

// minimal expense factory for period tests
function ex(id: string, spent_at: string, amount: number, payer: "mei" | "bas" = "mei", cat = "makan"): Expense {
  return {
    id,
    spent_at,
    category_id: cat,
    payer_id: payer,
    amount,
    description: "",
    split_type: "equal",
    shares: { mei: Math.floor(amount / 2), bas: amount - Math.floor(amount / 2) },
  };
}

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log("  ok -", name);
}

// equal split, even amount
test("equal split even", () => {
  assert.deepStrictEqual(computeShares(84000, "equal", "mei"), { mei: 42000, bas: 42000 });
});

// equal split, odd remainder goes to payer
test("equal split odd -> payer", () => {
  assert.deepStrictEqual(computeShares(85001, "equal", "mei"), { mei: 42501, bas: 42500 });
  assert.deepStrictEqual(computeShares(85001, "equal", "bas"), { mei: 42500, bas: 42501 });
});

// shares always sum to amount
test("equal split sums to amount", () => {
  for (const amt of [1, 3, 99, 432501, 1000001]) {
    const s = computeShares(amt, "equal", "mei");
    assert.strictEqual(s.mei + s.bas, amt);
  }
});

// full split -> owner carries all
test("full split owner", () => {
  assert.deepStrictEqual(computeShares(220000, "full", "mei", { owner: "mei" }), { mei: 220000, bas: 0 });
  assert.deepStrictEqual(computeShares(100000, "full", "bas", { owner: "bas" }), { mei: 0, bas: 100000 });
});

// custom split passthrough
test("custom split", () => {
  assert.deepStrictEqual(computeShares(100000, "custom", "mei", { shares: { mei: 70000, bas: 30000 } }), {
    mei: 70000,
    bas: 30000,
  });
});

// net balance: Mei pays 100k equal -> Baskara owes Mei 50k
test("net balance basic", () => {
  const exps: Expense[] = [
    { id: "x", spent_at: "2026-05-01", category_id: "makan", payer_id: "mei", amount: 100000, description: "", split_type: "equal", shares: { mei: 50000, bas: 50000 } },
  ];
  assert.strictEqual(netMei(exps, []), 50000);
  const v = owesView(50000);
  assert.deepStrictEqual(v, { debtor: "bas", creditor: "mei", amt: 50000 });
});

// settlement zeroes the balance
test("settlement zeroes", () => {
  const exps: Expense[] = [
    { id: "x", spent_at: "2026-05-01", category_id: "makan", payer_id: "mei", amount: 100000, description: "", split_type: "equal", shares: { mei: 50000, bas: 50000 } },
  ];
  const setts: Settlement[] = [{ id: "s", from_id: "bas", to_id: "mei", amount: 50000, note: null, settled_at: "2026-05-02" }];
  assert.strictEqual(netMei(exps, setts), 0);
  assert.strictEqual(owesView(0), null);
});

// the design's documented demo balance: Mei utang Rp144.250 ke Baskara
test("seed demo balance sign", () => {
  // imported lazily to avoid circular weight; recompute from seed
  const { SEED_EXPENSES, SEED_SETTLEMENTS } = require("../seed");
  const net = netMei(SEED_EXPENSES, SEED_SETTLEMENTS);
  const v = owesView(net);
  assert.ok(v, "expected a non-zero balance");
  assert.strictEqual(v!.debtor, "mei");
  assert.strictEqual(v!.creditor, "bas");
  assert.strictEqual(v!.amt, 144250);
});

// currency formatting
test("fmtRp", () => {
  assert.strictEqual(fmtRp(84000), "Rp84.000");
  assert.strictEqual(fmtRp(-1500000), "-Rp1.500.000");
});
test("fmtRpShort", () => {
  assert.strictEqual(fmtRpShort(3000000), "Rp3 jt");
  assert.strictEqual(fmtRpShort(385000), "Rp385rb");
});
test("dateLabel is relative to the given today", () => {
  assert.strictEqual(dateLabel("2026-05-31", "2026-05-31"), "Hari ini");
  assert.strictEqual(dateLabel("2026-05-30", "2026-05-31"), "Kemarin");
  assert.strictEqual(dateLabel("2026-05-18", "2026-05-31"), "18 Mei");
});

test("shiftISO crosses month and year boundaries", () => {
  assert.strictEqual(shiftISO("2026-05-31", -1), "2026-05-30");
  assert.strictEqual(shiftISO("2026-03-01", -1), "2026-02-28");
  assert.strictEqual(shiftISO("2026-12-31", 1), "2027-01-01");
  assert.strictEqual(shiftISO("2024-02-28", 1), "2024-02-29"); // leap year
});

// ── Period filtering & monthly total (the "pengeluaran bulan ini" path) ──────
const SAMPLE: Expense[] = [
  ex("a", "2026-05-31", 100000),
  ex("b", "2026-05-01", 50000, "bas"),
  ex("c", "2026-04-30", 999000), // previous month — must be excluded
  ex("d", "2026-06-01", 7000), // next month — must be excluded
  ex("e", "2025-05-15", 1, "bas"), // same month, different YEAR — excluded
];

test("inPeriod matches year+month only", () => {
  assert.strictEqual(inPeriod("2026-05-31", { y: 2026, m: 4 }), true);
  assert.strictEqual(inPeriod("2026-04-30", { y: 2026, m: 4 }), false);
  assert.strictEqual(inPeriod("2025-05-31", { y: 2026, m: 4 }), false);
});

test("expensesIn filters to the selected month", () => {
  const may = expensesIn(SAMPLE, { y: 2026, m: 4 });
  assert.deepStrictEqual(may.map((e) => e.id).sort(), ["a", "b"]);
});

test("totalThisMonth = sum of that month only (Pengeluaran bulan ini)", () => {
  // May 2026: 100000 + 50000 = 150000  (April's 999000 must NOT leak in)
  assert.strictEqual(totalThisMonth(expensesIn(SAMPLE, { y: 2026, m: 4 })), 150000);
  // April 2026: only the 999000 expense
  assert.strictEqual(totalThisMonth(expensesIn(SAMPLE, { y: 2026, m: 3 })), 999000);
  // a month with nothing => 0
  assert.strictEqual(totalThisMonth(expensesIn(SAMPLE, { y: 2026, m: 0 })), 0);
});

test("spendByCategory sums per category within the given list", () => {
  const list = [ex("x", "2026-05-01", 30000, "mei", "makan"), ex("y", "2026-05-02", 20000, "mei", "makan"), ex("z", "2026-05-03", 5000, "bas", "transport")];
  const by = spendByCategory(list);
  assert.strictEqual(by.makan, 50000);
  assert.strictEqual(by.transport, 5000);
});

test("yearlyTrend buckets by month for one year", () => {
  const t = yearlyTrend(SAMPLE, 2026);
  assert.strictEqual(t[4].total, 150000); // May (index 4)
  assert.strictEqual(t[3].total, 999000); // April
  assert.strictEqual(t[5].total, 7000); // June
  assert.strictEqual(t.length, 12);
  // 2025 row excluded from 2026 trend
  assert.strictEqual(t.reduce((s, x) => s + x.total, 0), 150000 + 999000 + 7000);
});

test("stepPeriod wraps year boundaries", () => {
  assert.deepStrictEqual(stepPeriod({ y: 2026, m: 0 }, -1), { y: 2025, m: 11 });
  assert.deepStrictEqual(stepPeriod({ y: 2026, m: 11 }, 1), { y: 2027, m: 0 });
  assert.deepStrictEqual(stepPeriod({ y: 2026, m: 4 }, 1), { y: 2026, m: 5 });
});

// ── Native numeric input → integer rupiah ────────────────────────────────────
test("parseRpInput reads plain digit strings", () => {
  assert.strictEqual(parseRpInput("0", 0), 0);
  assert.strictEqual(parseRpInput("5", 0), 5);
  assert.strictEqual(parseRpInput("125000", 0), 125000);
});

test("parseRpInput round-trips a formatted Rp value (strips separators)", () => {
  // The input is controlled with fmtRp(amount), so onChange receives the
  // formatted string back — it must parse to the same integer.
  assert.strictEqual(parseRpInput(fmtRp(1_250_000), 0), 1_250_000);
  assert.strictEqual(parseRpInput("Rp1.250.000", 0), 1_250_000);
});

test("parseRpInput treats empty / non-digit input as zero", () => {
  assert.strictEqual(parseRpInput("", 9999), 0);
  assert.strictEqual(parseRpInput("Rp", 9999), 0);
  assert.strictEqual(parseRpInput("abc", 9999), 0);
});

test("parseRpInput strips leading zeros via Number()", () => {
  assert.strictEqual(parseRpInput("007", 0), 7);
});

test("parseRpInput rejects values past MAX_AMOUNT, keeping the current amount", () => {
  assert.strictEqual(parseRpInput(String(MAX_AMOUNT), 0), MAX_AMOUNT);
  assert.strictEqual(parseRpInput(String(MAX_AMOUNT + 1), 4200), 4200);
  // a long digit run (one more digit appended) is rejected, not truncated
  assert.strictEqual(parseRpInput("9999999990", 123), 123);
});

console.log(`\n${passed} tests passed.`);
