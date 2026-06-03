"use client";

// App store: holds the ledger and exposes derived values + mutations.
// - "local" mode (no Supabase session): in-memory seed data, fully interactive.
// - "live" mode (logged in): reads/writes Supabase, scoped to the household.
import React from "react";
import { getSupabase } from "./supabase";
import { UI, FREDOKA } from "./ui";
import {
  CATEGORY_LIST,
  CATEGORIES,
  MONTHLY_TREND,
  PROFILES,
  SEED_EXPENSES,
  SEED_RECURRING,
  SEED_SETTLEMENTS,
} from "./seed";
import {
  computeShares,
  netMei,
  owesView,
  paidByPerson,
  spendByCategory,
  totalThisMonth,
  expensesIn,
  inPeriod,
  yearlyTrend,
  stepPeriod,
  todayPeriod,
  todayISO,
  type Period,
} from "./engine";
import * as db from "./db";
import type {
  Category,
  Expense,
  PersonId,
  Profile,
  Recurring,
  Settlement,
  Shares,
  SplitType,
  TrendPoint,
} from "./types";

interface AddExpenseInput {
  amount: number;
  category_id: string;
  payer_id: PersonId;
  description: string;
  spent_at: string;
  split_type: SplitType;
  customShares?: Shares; // only when split_type === 'custom'
  receiptBlob?: Blob | null; // new/replacement compressed receipt to store
  removeReceipt?: boolean; // edit: drop the existing receipt
}

// Transient bottom toast, used to offer "Urungkan" (undo) after a delete.
interface ToastState {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface StoreValue {
  ready: boolean;
  mode: "local" | "live";
  householdId: string | null;
  me: PersonId; // which person the logged-in user is (defaults to 'mei' offline)
  profiles: Record<PersonId, Profile>; // live names/colors (falls back to seed)
  householdName: string;
  categories: Category[];
  categoryMap: Record<string, Category>;
  expenses: Expense[]; // all expenses (unfiltered)
  settlements: Settlement[];
  recurring: Recurring[];
  // period
  period: Period;
  setPeriod: (p: Period) => void;
  monthExpenses: Expense[]; // expenses within the selected period
  prevTotal: number; // total of the previous month (for MoM comparison)
  // derived (spending = per selected period; balance = all-time)
  total: number;
  net: number;
  owes: ReturnType<typeof owesView>;
  spendByCat: Record<string, number>;
  paid: { mei: number; bas: number };
  trend: TrendPoint[];
  // actions
  addExpense: (input: AddExpenseInput) => Promise<void>;
  editExpense: (id: string, input: AddExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  receiptUrl: (path: string | null | undefined) => Promise<string | null>;
  settleUp: () => Promise<void>;
  toggleRecurring: (id: string) => Promise<void>;
  addRecurring: (r: Omit<Recurring, "id">) => Promise<void>;
  editRecurring: (r: Recurring) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  editSettlement: (s: Settlement) => Promise<void>;
  removeSettlement: (id: string) => Promise<void>;
  saveCategory: (c: Category) => Promise<void>;
  addCategory: (input: { name: string; icon: string; color: string; budget: number | null }) => Promise<void>;
  /** Delete a category. Caller should ensure it is unused (see CategoryEditor). */
  removeCategory: (id: string) => Promise<void>;
  /** Generate expenses for active recurring items in `period` that don't exist yet. Returns count created. */
  generateRecurring: (p: Period) => Promise<number>;
  /** Update the logged-in user's display name + identity color. */
  saveProfile: (args: { name: string; color: string }) => Promise<void>;
  /** Rename the household. */
  saveHouseholdName: (name: string) => Promise<void>;
}

const Ctx = React.createContext<StoreValue | null>(null);

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Gagal membaca gambar"));
    r.readAsDataURL(blob);
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [mode, setMode] = React.useState<"local" | "live">("local");
  const [me, setMe] = React.useState<PersonId>("mei");
  const [householdId, setHouseholdId] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<Category[]>(CATEGORY_LIST);
  const [expenses, setExpenses] = React.useState<Expense[]>(SEED_EXPENSES);
  const [settlements, setSettlements] = React.useState<Settlement[]>(SEED_SETTLEMENTS);
  const [recurring, setRecurring] = React.useState<Recurring[]>(SEED_RECURRING);
  const [profiles, setProfiles] = React.useState<Record<PersonId, Profile>>(PROFILES);
  const [householdName, setHouseholdName] = React.useState("Rumah Mei & Baskara");

  // Bottom toast (used for undo-on-delete). Auto-dismisses after 5s.
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissToast = React.useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);
  const showToast = React.useCallback(
    (message: string, opts?: { actionLabel?: string; onAction?: () => void }) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      const t: ToastState = { id: uid("t"), message, actionLabel: opts?.actionLabel, onAction: opts?.onAction };
      setToast(t);
      toastTimer.current = setTimeout(() => setToast((cur) => (cur && cur.id === t.id ? null : cur)), 5000);
    },
    []
  );

  // Try to go live if a session exists; otherwise stay on seed data.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      if (!sb) {
        setReady(true);
        return;
      }
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        setReady(true);
        return;
      }
      const membership = await db.getMembership(sb, session.user.id);
      if (!membership) {
        // Logged in but no profile yet -> onboarding handles it elsewhere.
        setReady(true);
        return;
      }
      const [snap, meta] = await Promise.all([
        db.fetchSnapshot(sb, membership.householdId),
        db.fetchHouseholdMeta(sb, membership.householdId),
      ]);
      if (cancelled) return;
      setHouseholdId(membership.householdId);
      setMe(membership.personKey);
      if (snap.categories.length) setCategories(snap.categories);
      setExpenses(snap.expenses);
      setSettlements(snap.settlements);
      setRecurring(snap.recurring);
      // overlay live profile names/colors onto the seed defaults
      if (meta.profiles.length) {
        setProfiles((prev) => {
          const next = { ...prev };
          for (const p of meta.profiles) {
            next[p.person_key] = { ...next[p.person_key], name: p.name, color: p.color, initial: p.name.charAt(0).toUpperCase() };
          }
          return next;
        });
      }
      if (meta.name) setHouseholdName(meta.name);
      setMode("live");
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime sync: when live, subscribe to the household's ledger tables so one
  // partner's edits appear on the other's device. Any change re-pulls a fresh
  // snapshot (cheap for a 2-person household, and keeps derived state correct).
  React.useEffect(() => {
    if (mode !== "live" || !householdId) return;
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    let pending: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      if (pending) clearTimeout(pending);
      // debounce bursts (e.g. multi-row settlement) into one fetch
      pending = setTimeout(async () => {
        const snap = await db.fetchSnapshot(sb, householdId);
        if (!alive) return;
        if (snap.categories.length) setCategories(snap.categories);
        setExpenses(snap.expenses);
        setSettlements(snap.settlements);
        setRecurring(snap.recurring);
      }, 250);
    };

    const channel = sb
      .channel(`household:${householdId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `household_id=eq.${householdId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "settlements", filter: `household_id=eq.${householdId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_expenses", filter: `household_id=eq.${householdId}` }, refresh)
      .subscribe();

    return () => {
      alive = false;
      if (pending) clearTimeout(pending);
      sb.removeChannel(channel);
    };
  }, [mode, householdId]);

  const categoryMap = React.useMemo(() => {
    const m: Record<string, Category> = {};
    for (const c of categories) m[c.id] = c;
    return m;
  }, [categories]);

  // Selected reporting period (spending views). Defaults to the real current
  // month; users step it with the topbar switcher.
  const [period, setPeriod] = React.useState<Period>(todayPeriod);

  // In offline/demo mode the seed data lives in a past month, so the current
  // month would look empty. Once, on first load, jump to the latest month that
  // actually has expenses so the demo lands populated. Live mode is left on the
  // real current month (an empty current month there is correct).
  const didInitPeriod = React.useRef(false);
  React.useEffect(() => {
    if (!ready || didInitPeriod.current) return;
    didInitPeriod.current = true;
    if (mode !== "local" || expenses.length === 0) return;
    if (expenses.some((e) => inPeriod(e.spent_at, period))) return;
    const latest = expenses.reduce((a, e) => (e.spent_at > a ? e.spent_at : a), expenses[0].spent_at);
    const [y, m] = latest.split("-").map(Number);
    setPeriod({ y, m: m - 1 });
  }, [ready, mode, expenses, period]);

  const monthExpenses = React.useMemo(() => expensesIn(expenses, period), [expenses, period]);

  // Spending values are scoped to the selected period.
  const total = React.useMemo(() => totalThisMonth(monthExpenses), [monthExpenses]);
  // Previous month's total, for the real month-over-month comparison badge.
  const prevTotal = React.useMemo(
    () => totalThisMonth(expensesIn(expenses, stepPeriod(period, -1))),
    [expenses, period]
  );
  const spendByCat = React.useMemo(() => spendByCategory(monthExpenses), [monthExpenses]);
  const paid = React.useMemo(() => paidByPerson(monthExpenses), [monthExpenses]);
  // Balance is ALL-TIME (debts carry across months), never per-period.
  const net = React.useMemo(() => netMei(expenses, settlements), [expenses, settlements]);
  const owes = React.useMemo(() => owesView(net), [net]);
  // Trend = real per-month totals for the selected year (fallback to baseline
  // template for empty early months so the demo year still looks alive).
  const trend = React.useMemo<TrendPoint[]>(() => {
    const real = yearlyTrend(expenses, period.y);
    // In the current year, decorate empty months BEFORE this month with the
    // demo baseline so the chart looks alive; the current month uses real data
    // and future months stay empty.
    const now = todayPeriod();
    if (period.y !== now.y) return real;
    return real.map((t, i) =>
      t.total === 0 && i < now.m && MONTHLY_TREND[i]
        ? { m: t.m, total: MONTHLY_TREND[i].total }
        : t
    );
  }, [expenses, period.y]);

  const addExpense = React.useCallback(
    async (input: AddExpenseInput) => {
      const shares =
        input.split_type === "custom" && input.customShares
          ? input.customShares
          : computeShares(input.amount, input.split_type, input.payer_id, { owner: input.payer_id });
      const base: Omit<Expense, "id"> = {
        spent_at: input.spent_at,
        category_id: input.category_id,
        payer_id: input.payer_id,
        amount: input.amount,
        description: input.description,
        split_type: input.split_type,
        owner: input.split_type === "full" ? input.payer_id : undefined,
        recurring: false,
        shares,
      };
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) {
          const saved = await db.insertExpense(sb, householdId, base);
          if (saved) {
            // Upload the receipt under the new id, then persist its path
            // (immutably — never mutate the row returned by the data layer).
            let stored = saved;
            if (input.receiptBlob) {
              const path = await db.uploadReceipt(sb, householdId, saved.id, input.receiptBlob);
              if (path) {
                stored = { ...saved, receipt_path: path };
                await db.updateExpense(sb, householdId, stored);
              }
            }
            setExpenses((prev) => [stored, ...prev]);
            return;
          }
        }
      }
      // Local mode: keep the image inline as a data URL.
      const localReceipt = input.receiptBlob ? await blobToDataUrl(input.receiptBlob).catch(() => null) : null;
      setExpenses((prev) => [{ ...base, id: uid("e"), receipt_path: localReceipt }, ...prev]);
    },
    [mode, householdId]
  );

  const editExpense = React.useCallback(
    async (id: string, input: AddExpenseInput) => {
      const shares =
        input.split_type === "custom" && input.customShares
          ? input.customShares
          : computeShares(input.amount, input.split_type, input.payer_id, { owner: input.payer_id });
      const prevExpense = expenses.find((e) => e.id === id);
      const sb = mode === "live" && householdId ? getSupabase() : null;

      // Resolve the receipt: remove, replace, or keep the existing one.
      let receipt_path = prevExpense?.receipt_path ?? null;
      if (input.removeReceipt) {
        if (sb) await db.removeReceipt(sb, receipt_path);
        receipt_path = null;
      } else if (input.receiptBlob) {
        if (sb && householdId) {
          receipt_path = (await db.uploadReceipt(sb, householdId, id, input.receiptBlob)) ?? receipt_path;
        } else {
          receipt_path = await blobToDataUrl(input.receiptBlob).catch(() => receipt_path);
        }
      }

      const patch = {
        spent_at: input.spent_at,
        category_id: input.category_id,
        payer_id: input.payer_id,
        amount: input.amount,
        description: input.description,
        split_type: input.split_type,
        owner: input.split_type === "full" ? input.payer_id : undefined,
        shares,
        receipt_path,
      };
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

      if (sb && householdId && prevExpense) {
        await db.updateExpense(sb, householdId, { ...prevExpense, ...patch });
      }
    },
    [mode, householdId, expenses]
  );

  const restoreExpense = React.useCallback(
    async (e: Expense) => {
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) {
          const { id: _omit, ...base } = e;
          const saved = await db.insertExpense(sb, householdId, base);
          if (saved) {
            setExpenses((prev) => [saved, ...prev]);
            return;
          }
        }
      }
      setExpenses((prev) => [e, ...prev]);
    },
    [mode, householdId]
  );

  const removeExpense = React.useCallback(
    async (id: string) => {
      const removed = expenses.find((e) => e.id === id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.deleteExpense(sb, householdId, id);
        // The receipt object is intentionally NOT deleted here so "Urungkan"
        // (undo) can restore the expense with its image intact. This leaves a
        // small orphan only when a delete is not undone; RLS still scopes it to
        // the household. (Future: sweep orphans after the undo window.)
      }
      if (removed) {
        showToast("Transaksi dihapus", { actionLabel: "Urungkan", onAction: () => void restoreExpense(removed) });
      }
    },
    [expenses, mode, householdId, showToast, restoreExpense]
  );

  const settleUp = React.useCallback(async () => {
    const v = owesView(netMei(expenses, settlements));
    if (!v) return;
    const base: Omit<Settlement, "id"> = {
      from_id: v.debtor,
      to_id: v.creditor,
      amount: v.amt,
      note: "Pelunasan",
      settled_at: todayISO(),
    };
    if (mode === "live" && householdId) {
      const sb = getSupabase();
      if (sb) {
        const saved = await db.insertSettlement(sb, householdId, base);
        if (saved) {
          setSettlements((prev) => [saved, ...prev]);
          return;
        }
      }
    }
    setSettlements((prev) => [{ ...base, id: uid("s") }, ...prev]);
  }, [expenses, settlements, mode, householdId]);

  const toggleRecurring = React.useCallback(
    async (id: string) => {
      const cur = recurring.find((r) => r.id === id);
      if (!cur) return;
      const next = !cur.active;
      setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, active: next } : r)));
      if (mode === "live") {
        const sb = getSupabase();
        if (sb) await db.setRecurringActive(sb, id, next);
      }
    },
    [recurring, mode]
  );

  const addRecurring = React.useCallback(
    async (r: Omit<Recurring, "id">) => {
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) {
          const saved = await db.insertRecurring(sb, householdId, r);
          if (saved) {
            setRecurring((prev) => [...prev, saved]);
            return;
          }
        }
      }
      setRecurring((prev) => [...prev, { ...r, id: uid("r") }]);
    },
    [mode, householdId]
  );

  const editRecurring = React.useCallback(
    async (r: Recurring) => {
      setRecurring((prev) => prev.map((x) => (x.id === r.id ? r : x)));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.updateRecurring(sb, householdId, r);
      }
    },
    [mode, householdId]
  );

  const removeRecurring = React.useCallback(
    async (id: string) => {
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.deleteRecurring(sb, householdId, id);
      }
    },
    [mode, householdId]
  );

  const editSettlement = React.useCallback(
    async (s: Settlement) => {
      setSettlements((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.updateSettlement(sb, householdId, s);
      }
    },
    [mode, householdId]
  );

  const restoreSettlement = React.useCallback(
    async (s: Settlement) => {
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) {
          const { id: _omit, ...base } = s;
          const saved = await db.insertSettlement(sb, householdId, base);
          if (saved) {
            setSettlements((prev) => [saved, ...prev]);
            return;
          }
        }
      }
      setSettlements((prev) => [s, ...prev]);
    },
    [mode, householdId]
  );

  const removeSettlement = React.useCallback(
    async (id: string) => {
      const removed = settlements.find((s) => s.id === id);
      setSettlements((prev) => prev.filter((s) => s.id !== id));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.deleteSettlement(sb, householdId, id);
      }
      if (removed) {
        showToast("Pelunasan dihapus", { actionLabel: "Urungkan", onAction: () => void restoreSettlement(removed) });
      }
    },
    [settlements, mode, householdId, showToast, restoreSettlement]
  );

  const generateRecurring = React.useCallback(
    async (p: Period): Promise<number> => {
      const active = recurring.filter((r) => r.active);
      const pad = (n: number) => String(n).padStart(2, "0");
      let created = 0;
      const toAdd: Expense[] = [];
      for (const r of active) {
        const day = Math.min(r.day, new Date(p.y, p.m + 1, 0).getDate());
        const iso = `${p.y}-${pad(p.m + 1)}-${pad(day)}`;
        // skip if an expense from this recurring template already exists this month
        const exists = expenses.some(
          (e) => e.recurring && e.description === r.description && e.spent_at.slice(0, 7) === iso.slice(0, 7)
        );
        if (exists) continue;
        const shares = computeShares(r.amount, r.split_type, r.payer_id, { owner: r.payer_id });
        const base: Omit<Expense, "id"> = {
          spent_at: iso,
          category_id: r.category_id,
          payer_id: r.payer_id,
          amount: r.amount,
          description: r.description,
          split_type: r.split_type,
          owner: r.split_type === "full" ? r.payer_id : undefined,
          recurring: true,
          shares,
        };
        let saved: Expense | null = null;
        if (mode === "live" && householdId) {
          const sb = getSupabase();
          if (sb) saved = await db.insertExpense(sb, householdId, base);
        }
        toAdd.push(saved ?? { ...base, id: uid("e") });
        created++;
      }
      if (toAdd.length) setExpenses((prev) => [...toAdd, ...prev]);
      return created;
    },
    [recurring, expenses, mode, householdId]
  );

  const saveCategory = React.useCallback(
    async (c: Category) => {
      setCategories((prev) => prev.map((x) => (x.id === c.id ? c : x)));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.updateCategory(sb, householdId, c);
      }
    },
    [mode, householdId]
  );

  const addCategory = React.useCallback(
    async (input: { name: string; icon: string; color: string; budget: number | null }) => {
      const id = uid("cat");
      const c: Category = { id, name: input.name, icon: input.icon, color: input.color, budget: input.budget };
      setCategories((prev) => [...prev, c]);
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.insertCategory(sb, householdId, c);
      }
    },
    [mode, householdId]
  );

  const restoreCategory = React.useCallback(
    async (c: Category) => {
      setCategories((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.insertCategory(sb, householdId, c);
      }
    },
    [mode, householdId]
  );

  const removeCategory = React.useCallback(
    async (id: string) => {
      const removed = categories.find((c) => c.id === id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.deleteCategory(sb, householdId, id);
      }
      if (removed) {
        showToast("Kategori dihapus", { actionLabel: "Urungkan", onAction: () => void restoreCategory(removed) });
      }
    },
    [categories, mode, householdId, showToast, restoreCategory]
  );

  const saveProfile = React.useCallback(
    async (args: { name: string; color: string }) => {
      setProfiles((prev) => ({
        ...prev,
        [me]: { ...prev[me], name: args.name, color: args.color, initial: args.name.charAt(0).toUpperCase() },
      }));
      if (mode === "live") {
        const sb = getSupabase();
        const { data: { session } = { session: null } } = sb ? await sb.auth.getSession() : { data: { session: null } };
        if (sb && session) await db.updateProfile(sb, session.user.id, args);
      }
    },
    [me, mode]
  );

  const saveHouseholdName = React.useCallback(
    async (name: string) => {
      setHouseholdName(name);
      if (mode === "live" && householdId) {
        const sb = getSupabase();
        if (sb) await db.updateHouseholdName(sb, householdId, name);
      }
    },
    [mode, householdId]
  );

  // Resolve a receipt path to a viewable URL: a short-lived signed URL in live
  // mode, or the inline data URL kept in local mode.
  const receiptUrl = React.useCallback(async (path: string | null | undefined): Promise<string | null> => {
    if (!path) return null;
    if (path.startsWith("data:")) return path;
    const sb = getSupabase();
    return sb ? db.signedReceiptUrl(sb, path) : null;
  }, []);

  const value: StoreValue = {
    ready,
    mode,
    householdId,
    me,
    profiles,
    householdName,
    categories,
    categoryMap,
    expenses,
    settlements,
    recurring,
    period,
    setPeriod,
    monthExpenses,
    prevTotal,
    total,
    net,
    owes,
    spendByCat,
    paid,
    trend,
    addExpense,
    editExpense,
    deleteExpense: removeExpense,
    receiptUrl,
    settleUp,
    toggleRecurring,
    addRecurring,
    editRecurring,
    removeRecurring,
    editSettlement,
    removeSettlement,
    saveCategory,
    addCategory,
    removeCategory,
    generateRecurring,
    saveProfile,
    saveHouseholdName,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastHost toast={toast} onDismiss={dismissToast} />
    </Ctx.Provider>
  );
}

// Global bottom toast surface. Rendered inside the provider so any screen's
// mutation can raise it (e.g. undo after a delete) without extra plumbing.
function ToastHost({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  if (!toast) return null;
  return (
    <div
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 300, display: "flex", justifyContent: "center", padding: 16, pointerEvents: "none" }}
    >
      <div
        className="anim-pop"
        style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 14, background: UI.ink, color: "#fff", borderRadius: 16, padding: "12px 16px", boxShadow: "0 10px 30px rgba(63,53,48,0.3)", maxWidth: 420, width: "100%" }}
      >
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{toast.message}</span>
        {toast.onAction && toast.actionLabel && (
          <button
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
            style={{ border: "none", background: "transparent", color: UI.accent, fontFamily: FREDOKA, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            {toast.actionLabel}
          </button>
        )}
        <button
          onClick={onDismiss}
          aria-label="Tutup"
          style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useStore(): StoreValue {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}

// Non-throwing accessor for shared primitives (Avatar/PayerBadge) that may also
// render outside the provider (e.g. the onboarding page). Falls back to the seed
// profiles so it always returns a valid map.
export function useLiveProfiles(): Record<PersonId, Profile> {
  const v = React.useContext(Ctx);
  return v?.profiles ?? PROFILES;
}

// Non-throwing accessor for the live category map (id -> Category). Used by
// CatIcon so expenses tagged with a user-created category render that category's
// icon/color instead of falling back to the seed default. Falls back to the seed
// map when rendered outside the provider.
export function useCategoryMap(): Record<string, Category> {
  const v = React.useContext(Ctx);
  return v?.categoryMap ?? CATEGORIES;
}

export { CATEGORIES };
