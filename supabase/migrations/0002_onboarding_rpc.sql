-- Fix onboarding RLS chicken-and-egg: creating a household then SELECTing its id
-- fails because my_household_ids() has no membership row yet. These SECURITY
-- DEFINER functions create household+profile (or join) atomically and return the
-- household id, bypassing the per-statement RLS race while still being safe
-- (they only ever act on auth.uid()).

create or replace function public.create_household(
  p_household_name text,
  p_person_key text,
  p_name text,
  p_color text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_person_key not in ('mei','bas') then
    raise exception 'invalid person_key';
  end if;
  -- one profile per user
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'already in a household';
  end if;

  insert into households (name) values (p_household_name) returning id into v_hid;
  insert into profiles (id, household_id, person_key, name, color)
    values (auth.uid(), v_hid, p_person_key, p_name, p_color);
  return v_hid;
end;
$$;

create or replace function public.join_household(
  p_household_id uuid,
  p_person_key text,
  p_name text,
  p_color text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_person_key not in ('mei','bas') then
    raise exception 'invalid person_key';
  end if;
  if not exists (select 1 from households where id = p_household_id) then
    raise exception 'household not found';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'already in a household';
  end if;
  -- the chosen identity must be free in this household
  if exists (select 1 from profiles where household_id = p_household_id and person_key = p_person_key) then
    raise exception 'identity already taken in this household';
  end if;

  insert into profiles (id, household_id, person_key, name, color)
    values (auth.uid(), p_household_id, p_person_key, p_name, p_color);
  return p_household_id;
end;
$$;

grant execute on function public.create_household(text, text, text, text) to authenticated;
grant execute on function public.join_household(uuid, text, text, text) to authenticated;
