"use client";

// Data-access layer: maps Supabase rows <-> domain objects. Shares are stored
// inline (share_mei/share_bas) so a single insert is atomic; net balance stays
// fully derived from the ledger (see engine.netMei).
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Expense,
  PersonId,
  Recurring,
  Settlement,
} from "./types";

export interface Membership {
  householdId: string;
  personKey: PersonId;
  name: string;
}

export interface ProfileRow {
  person_key: PersonId;
  name: string;
  color: string;
}

// Load both members' names+colors and the household name, so the app reflects
// edits instead of the hardcoded seed values.
export async function fetchHouseholdMeta(
  sb: SupabaseClient,
  householdId: string
): Promise<{ name: string | null; profiles: ProfileRow[] }> {
  const [hh, profs] = await Promise.all([
    sb.from("households").select("name").eq("id", householdId).maybeSingle(),
    sb.from("profiles").select("person_key, name, color").eq("household_id", householdId),
  ]);
  return {
    name: hh.data?.name ?? null,
    profiles: (profs.data ?? []) as ProfileRow[],
  };
}

export async function updateProfile(
  sb: SupabaseClient,
  userId: string,
  args: { name: string; color: string }
): Promise<boolean> {
  const { error } = await sb
    .from("profiles")
    .update({ name: args.name, color: args.color })
    .eq("id", userId);
  return !error;
}

export async function updateHouseholdName(
  sb: SupabaseClient,
  householdId: string,
  name: string
): Promise<boolean> {
  const { error } = await sb.from("households").update({ name }).eq("id", householdId);
  return !error;
}

export interface Snapshot {
  categories: Category[];
  expenses: Expense[];
  settlements: Settlement[];
  recurring: Recurring[];
}

export async function getMembership(
  sb: SupabaseClient,
  userId: string
): Promise<Membership | null> {
  const { data, error } = await sb
    .from("profiles")
    .select("household_id, person_key, name")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    householdId: data.household_id,
    personKey: data.person_key as PersonId,
    name: data.name,
  };
}

export async function fetchSnapshot(
  sb: SupabaseClient,
  householdId: string
): Promise<Snapshot> {
  const [cats, exps, setts, recs] = await Promise.all([
    sb.from("categories").select("*").eq("household_id", householdId),
    sb.from("expenses").select("*").eq("household_id", householdId).order("spent_at", { ascending: false }),
    sb.from("settlements").select("*").eq("household_id", householdId).order("settled_at", { ascending: false }),
    sb.from("recurring_expenses").select("*").eq("household_id", householdId),
  ]);
  return {
    categories: (cats.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      budget: c.monthly_budget,
    })),
    expenses: (exps.data ?? []).map(rowToExpense),
    settlements: (setts.data ?? []).map((s) => ({
      id: s.id,
      from_id: s.from_id,
      to_id: s.to_id,
      amount: s.amount,
      note: s.note,
      settled_at: s.settled_at,
    })),
    recurring: (recs.data ?? []).map((r) => ({
      id: r.id,
      description: r.description,
      category_id: r.category_id,
      payer_id: r.payer_id,
      amount: r.amount,
      split_type: r.split_type,
      day: r.day_of_month,
      active: r.active,
    })),
  };
}

// Shape of an `expenses` row as returned by Supabase. Narrows the untyped
// query result before mapping to the domain `Expense`.
interface ExpenseRow {
  id: string;
  spent_at: string;
  category_id: string;
  payer_id: PersonId;
  amount: number;
  description: string | null;
  split_type: Expense["split_type"];
  owner: PersonId | null;
  recurring: boolean | null;
  share_mei: number;
  share_bas: number;
}

function rowToExpense(e: ExpenseRow): Expense {
  return {
    id: e.id,
    spent_at: e.spent_at,
    category_id: e.category_id,
    payer_id: e.payer_id,
    amount: e.amount,
    description: e.description ?? "",
    split_type: e.split_type,
    owner: e.owner ?? undefined,
    recurring: e.recurring ?? false,
    shares: { mei: e.share_mei, bas: e.share_bas },
  };
}

export async function insertExpense(
  sb: SupabaseClient,
  householdId: string,
  e: Omit<Expense, "id">
): Promise<Expense | null> {
  const { data, error } = await sb
    .from("expenses")
    .insert({
      household_id: householdId,
      category_id: e.category_id,
      payer_id: e.payer_id,
      amount: e.amount,
      description: e.description,
      spent_at: e.spent_at,
      split_type: e.split_type,
      owner: e.owner ?? null,
      share_mei: e.shares.mei,
      share_bas: e.shares.bas,
      recurring: e.recurring ?? false,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return rowToExpense(data);
}

// Update an existing expense (all editable fields incl. recomputed shares).
export async function updateExpense(
  sb: SupabaseClient,
  householdId: string,
  e: Expense
): Promise<boolean> {
  const { error } = await sb
    .from("expenses")
    .update({
      category_id: e.category_id,
      payer_id: e.payer_id,
      amount: e.amount,
      description: e.description,
      spent_at: e.spent_at,
      split_type: e.split_type,
      owner: e.owner ?? null,
      share_mei: e.shares.mei,
      share_bas: e.shares.bas,
    })
    .eq("household_id", householdId)
    .eq("id", e.id);
  return !error;
}

export async function deleteExpense(
  sb: SupabaseClient,
  householdId: string,
  id: string
): Promise<boolean> {
  const { error } = await sb
    .from("expenses")
    .delete()
    .eq("household_id", householdId)
    .eq("id", id);
  return !error;
}

export async function insertSettlement(
  sb: SupabaseClient,
  householdId: string,
  s: Omit<Settlement, "id">
): Promise<Settlement | null> {
  const { data, error } = await sb
    .from("settlements")
    .insert({
      household_id: householdId,
      from_id: s.from_id,
      to_id: s.to_id,
      amount: s.amount,
      note: s.note,
      settled_at: s.settled_at,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    from_id: data.from_id,
    to_id: data.to_id,
    amount: data.amount,
    note: data.note,
    settled_at: data.settled_at,
  };
}

export async function setRecurringActive(
  sb: SupabaseClient,
  id: string,
  active: boolean
): Promise<void> {
  await sb.from("recurring_expenses").update({ active }).eq("id", id);
}

function recurringRow(householdId: string, r: Omit<Recurring, "id">) {
  return {
    household_id: householdId,
    payer_id: r.payer_id,
    category_id: r.category_id,
    amount: r.amount,
    description: r.description,
    split_type: r.split_type,
    day_of_month: r.day,
    active: r.active,
  };
}

export async function insertRecurring(
  sb: SupabaseClient,
  householdId: string,
  r: Omit<Recurring, "id">
): Promise<Recurring | null> {
  const { data, error } = await sb
    .from("recurring_expenses")
    .insert(recurringRow(householdId, r))
    .select("*")
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    description: data.description,
    category_id: data.category_id,
    payer_id: data.payer_id,
    amount: data.amount,
    split_type: data.split_type,
    day: data.day_of_month,
    active: data.active,
  };
}

export async function updateRecurring(
  sb: SupabaseClient,
  householdId: string,
  r: Recurring
): Promise<boolean> {
  const { error } = await sb
    .from("recurring_expenses")
    .update(recurringRow(householdId, r))
    .eq("household_id", householdId)
    .eq("id", r.id);
  return !error;
}

export async function deleteRecurring(
  sb: SupabaseClient,
  householdId: string,
  id: string
): Promise<boolean> {
  const { error } = await sb
    .from("recurring_expenses")
    .delete()
    .eq("household_id", householdId)
    .eq("id", id);
  return !error;
}

export async function updateSettlement(
  sb: SupabaseClient,
  householdId: string,
  s: Settlement
): Promise<boolean> {
  const { error } = await sb
    .from("settlements")
    .update({
      from_id: s.from_id,
      to_id: s.to_id,
      amount: s.amount,
      note: s.note,
      settled_at: s.settled_at,
    })
    .eq("household_id", householdId)
    .eq("id", s.id);
  return !error;
}

export async function deleteSettlement(
  sb: SupabaseClient,
  householdId: string,
  id: string
): Promise<boolean> {
  const { error } = await sb
    .from("settlements")
    .delete()
    .eq("household_id", householdId)
    .eq("id", id);
  return !error;
}

// Bootstrap a brand-new household with default categories + sample data.
// Uses the SECURITY DEFINER RPC (migration 0002) to create household + profile
// atomically, avoiding the insert-then-select RLS race. Returns the id, or
// throws with the DB error message so the UI can show why it failed.
export async function createHousehold(
  sb: SupabaseClient,
  _userId: string,
  args: { householdName: string; personKey: PersonId; name: string; color: string }
): Promise<string> {
  const { data, error } = await sb.rpc("create_household", {
    p_household_name: args.householdName,
    p_person_key: args.personKey,
    p_name: args.name,
    p_color: args.color,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function joinHousehold(
  sb: SupabaseClient,
  _userId: string,
  args: { householdId: string; personKey: PersonId; name: string; color: string }
): Promise<boolean> {
  const { error } = await sb.rpc("join_household", {
    p_household_id: args.householdId,
    p_person_key: args.personKey,
    p_name: args.name,
    p_color: args.color,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function seedHouseholdCategories(
  sb: SupabaseClient,
  householdId: string,
  categories: Category[]
): Promise<void> {
  await sb.from("categories").insert(
    categories.map((c) => ({
      id: c.id,
      household_id: householdId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      monthly_budget: c.budget,
    }))
  );
}

// Insert one new category (household-scoped; RLS allows household members).
export async function insertCategory(
  sb: SupabaseClient,
  householdId: string,
  c: Category
): Promise<boolean> {
  const { error } = await sb.from("categories").insert({
    id: c.id,
    household_id: householdId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    monthly_budget: c.budget,
  });
  return !error;
}

// Update an existing category's editable fields.
export async function updateCategory(
  sb: SupabaseClient,
  householdId: string,
  c: Category
): Promise<boolean> {
  const { error } = await sb
    .from("categories")
    .update({ name: c.name, icon: c.icon, color: c.color, monthly_budget: c.budget })
    .eq("household_id", householdId)
    .eq("id", c.id);
  return !error;
}

// Delete a category (household-scoped). Caller must ensure it is unused —
// expenses/recurring keep their category_id and would otherwise orphan.
export async function deleteCategory(
  sb: SupabaseClient,
  householdId: string,
  id: string
): Promise<boolean> {
  const { error } = await sb
    .from("categories")
    .delete()
    .eq("household_id", householdId)
    .eq("id", id);
  return !error;
}

export async function seedHouseholdSample(
  sb: SupabaseClient,
  householdId: string,
  expenses: Expense[],
  settlements: Settlement[],
  recurring: Recurring[]
): Promise<void> {
  await sb.from("expenses").insert(
    expenses.map((e) => ({
      household_id: householdId,
      category_id: e.category_id,
      payer_id: e.payer_id,
      amount: e.amount,
      description: e.description,
      spent_at: e.spent_at,
      split_type: e.split_type,
      owner: e.owner ?? null,
      share_mei: e.shares.mei,
      share_bas: e.shares.bas,
      recurring: e.recurring ?? false,
    }))
  );
  if (settlements.length)
    await sb.from("settlements").insert(
      settlements.map((s) => ({
        household_id: householdId,
        from_id: s.from_id,
        to_id: s.to_id,
        amount: s.amount,
        note: s.note,
        settled_at: s.settled_at,
      }))
    );
  if (recurring.length)
    await sb.from("recurring_expenses").insert(
      recurring.map((r) => ({
        household_id: householdId,
        category_id: r.category_id,
        payer_id: r.payer_id,
        amount: r.amount,
        description: r.description,
        split_type: r.split_type,
        day_of_month: r.day,
        active: r.active,
      }))
    );
}
