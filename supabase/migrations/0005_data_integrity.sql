-- Data-integrity hardening (additive, idempotent, orphan-safe).
--   1. Foreign keys: expenses/recurring_expenses.category_id must point at a real
--      category in the same household. With the default ON DELETE NO ACTION this
--      also blocks deleting a category that is still in use (the check runs at
--      statement end, so a household cascade-delete that removes both the
--      category and its expenses in one statement still succeeds). This mirrors
--      the client-side guard in CategoryEditor as defense in depth.
--   2. Settlements can't be self-directed (from_id <> to_id). Both directions
--      across time stay valid — Mei can pay Bas one month and Bas pay Mei the
--      next — so only the self-pay case is rejected.
--   3. The monthly recurring cron computes "current month" in Asia/Jakarta (the
--      household's timezone) instead of UTC, so a run near a month boundary
--      targets the month the household is actually in.
--
-- New constraints are added NOT VALID, then validated best-effort: a fresh DB
-- validates immediately; a DB with pre-existing orphan/legacy rows keeps the
-- constraint enforced for new writes without failing the migration.

-- An index on the referencing columns keeps the FK checks and the
-- "is this category still used?" lookups cheap.
create index if not exists idx_expenses_household_category
  on expenses (household_id, category_id);

-- ── 1. Category foreign keys ────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_category_fk') then
    alter table expenses
      add constraint expenses_category_fk
      foreign key (household_id, category_id)
      references categories (household_id, id)
      not valid;
  end if;
end $$;

do $$
begin
  alter table expenses validate constraint expenses_category_fk;
exception when others then
  raise notice 'expenses_category_fk left NOT VALID (pre-existing orphan rows): %', sqlerrm;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'recurring_category_fk') then
    alter table recurring_expenses
      add constraint recurring_category_fk
      foreign key (household_id, category_id)
      references categories (household_id, id)
      not valid;
  end if;
end $$;

do $$
begin
  alter table recurring_expenses validate constraint recurring_category_fk;
exception when others then
  raise notice 'recurring_category_fk left NOT VALID (pre-existing orphan rows): %', sqlerrm;
end $$;

-- ── 2. Settlements cannot be self-directed ──────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'settlements_distinct_parties') then
    alter table settlements
      add constraint settlements_distinct_parties check (from_id <> to_id) not valid;
  end if;
end $$;

do $$
begin
  alter table settlements validate constraint settlements_distinct_parties;
exception when others then
  raise notice 'settlements_distinct_parties left NOT VALID (pre-existing rows): %', sqlerrm;
end $$;

-- ── 3. Recurring cron: compute the current month in the household timezone ───
create or replace function public.generate_recurring_current_month()
returns int
language sql
security definer
set search_path = public
as $$
  select public.generate_recurring_for_month(
    extract(year  from (now() at time zone 'Asia/Jakarta'))::int,
    extract(month from (now() at time zone 'Asia/Jakarta'))::int
  );
$$;

-- Redefining the function re-grants the default execute to PUBLIC; re-revoke so
-- only the cron job (running as table owner) can call it (see 0004).
revoke execute on function public.generate_recurring_current_month() from public, anon, authenticated;
