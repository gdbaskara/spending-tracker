-- Celengin schema — households of exactly 2 people sharing a ledger.
-- Money is integer rupiah. Net balance is derived (engine.netMei), never stored.

-- ── Tables ───────────────────────────────────────────────────────────────────
create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- One profile per auth user, bound to a household. person_key keeps the app's
-- two-person model ('mei' | 'bas') stable regardless of display name.
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  household_id  uuid not null references households(id) on delete cascade,
  person_key    text not null check (person_key in ('mei','bas')),
  name          text not null,
  color         text not null,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  unique (household_id, person_key)
);

create table if not exists categories (
  id              text not null,
  household_id    uuid not null references households(id) on delete cascade,
  name            text not null,
  icon            text not null,
  color           text not null,
  monthly_budget  integer,
  created_at      timestamptz not null default now(),
  primary key (household_id, id)
);

create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  payer_id      text not null check (payer_id in ('mei','bas')),
  category_id   text not null,
  amount        integer not null check (amount > 0),
  description   text not null default '',
  spent_at      date not null,
  split_type    text not null check (split_type in ('equal','custom','full')),
  owner         text check (owner in ('mei','bas')),
  share_mei     integer not null,
  share_bas     integer not null,
  recurring     boolean not null default false,
  created_at    timestamptz not null default now(),
  -- invariant: shares sum to amount
  check (share_mei + share_bas = amount)
);

create table if not exists settlements (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  from_id       text not null check (from_id in ('mei','bas')),
  to_id         text not null check (to_id in ('mei','bas')),
  amount        integer not null check (amount > 0),
  note          text,
  settled_at    date not null,
  created_at    timestamptz not null default now()
);

create table if not exists recurring_expenses (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  payer_id      text not null check (payer_id in ('mei','bas')),
  category_id   text not null,
  amount        integer not null check (amount > 0),
  description   text not null,
  split_type    text not null check (split_type in ('equal','custom','full')),
  day_of_month  smallint not null check (day_of_month between 1 and 28),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_expenses_household_date on expenses (household_id, spent_at desc);
create index if not exists idx_settlements_household on settlements (household_id, settled_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table households enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table expenses enable row level security;
alter table settlements enable row level security;
alter table recurring_expenses enable row level security;

-- Helper: the set of household ids the current user belongs to.
create or replace function public.my_household_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from profiles where id = auth.uid()
$$;

-- households: members can read; any authenticated user can create.
drop policy if exists hh_select on households;
create policy hh_select on households for select
  using (id in (select public.my_household_ids()));
drop policy if exists hh_insert on households;
create policy hh_insert on households for insert
  with check (auth.uid() is not null);

-- profiles: you can read profiles in your household; you can insert your own row.
drop policy if exists pr_select on profiles;
create policy pr_select on profiles for select
  using (household_id in (select public.my_household_ids()) or id = auth.uid());
drop policy if exists pr_insert on profiles;
create policy pr_insert on profiles for insert
  with check (id = auth.uid());
drop policy if exists pr_update on profiles;
create policy pr_update on profiles for update
  using (id = auth.uid());

-- Generic household-scoped policies for ledger tables.
do $$
declare t text;
begin
  foreach t in array array['categories','expenses','settlements','recurring_expenses']
  loop
    execute format('drop policy if exists %1$s_all on %1$s;', t);
    execute format(
      'create policy %1$s_all on %1$s for all
         using (household_id in (select public.my_household_ids()))
         with check (household_id in (select public.my_household_ids()));', t);
  end loop;
end $$;

-- ── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table settlements;
alter publication supabase_realtime add table recurring_expenses;
