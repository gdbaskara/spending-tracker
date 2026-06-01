-- Enable pg_cron (Supabase ships it; harmless if already enabled).
create extension if not exists pg_cron;

-- Auto-recurring: generate expenses from active recurring templates on a
-- schedule, so tagihan rutin appear without anyone tapping a button.
-- Mirrors engine.computeShares: equal => floor(amount/2) with remainder to the
-- payer; full => owner carries all. Idempotent: skips a template if an expense
-- for the same household+description already exists in the target month.

create or replace function public.generate_recurring_for_month(p_year int, p_month int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_day int;
  v_iso date;
  v_half int;
  v_rem int;
  v_share_mei int;
  v_share_bas int;
  created int := 0;
begin
  for r in
    select * from recurring_expenses where active = true
  loop
    -- clamp the day to the month length (handles Feb etc.)
    v_day := least(r.day_of_month, extract(day from (make_date(p_year, p_month, 1) + interval '1 month - 1 day'))::int);
    v_iso := make_date(p_year, p_month, v_day);

    -- skip if this template already produced an expense this month
    if exists (
      select 1 from expenses e
      where e.household_id = r.household_id
        and e.recurring = true
        and e.description = r.description
        and date_trunc('month', e.spent_at) = make_date(p_year, p_month, 1)
    ) then
      continue;
    end if;

    -- shares
    if r.split_type = 'full' then
      v_share_mei := case when r.payer_id = 'mei' then r.amount else 0 end;
      v_share_bas := r.amount - v_share_mei;
    else
      -- equal (and custom fallback): split in two, remainder to payer
      v_half := r.amount / 2;          -- integer division
      v_rem := r.amount - v_half * 2;
      v_share_mei := v_half + (case when r.payer_id = 'mei' then v_rem else 0 end);
      v_share_bas := v_half + (case when r.payer_id = 'bas' then v_rem else 0 end);
    end if;

    insert into expenses (
      household_id, payer_id, category_id, amount, description, spent_at,
      split_type, owner, share_mei, share_bas, recurring
    ) values (
      r.household_id, r.payer_id, r.category_id, r.amount, r.description, v_iso,
      r.split_type, case when r.split_type = 'full' then r.payer_id else null end,
      v_share_mei, v_share_bas, true
    );
    created := created + 1;
  end loop;
  return created;
end;
$$;

-- Convenience wrapper: generate for the current month (used by the cron job).
create or replace function public.generate_recurring_current_month()
returns int
language sql
security definer
set search_path = public
as $$
  select public.generate_recurring_for_month(
    extract(year from now())::int,
    extract(month from now())::int
  );
$$;

-- Schedule it via pg_cron if the extension is available. Runs 06:00 UTC on the
-- 1st of every month. Safe to re-run: unschedule the old job first.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('celengin-monthly-recurring')
      where exists (select 1 from cron.job where jobname = 'celengin-monthly-recurring');
    perform cron.schedule(
      'celengin-monthly-recurring',
      '0 6 1 * *',
      $cron$ select public.generate_recurring_current_month(); $cron$
    );
  end if;
end $$;
