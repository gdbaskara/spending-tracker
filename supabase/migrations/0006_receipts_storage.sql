-- 0006_receipts_storage.sql
-- Attach a (compressed) receipt image to an expense, stored in a private
-- Supabase Storage bucket scoped to the user's household.
--
-- Path convention: "<household_id>/<expense_id>.jpg" — the first folder segment
-- is the household id, which the RLS policies below check against
-- my_household_ids() (defined in 0001).

-- 1) Column linking an expense to its stored object (NULL = no receipt).
alter table expenses
  add column if not exists receipt_path text;

-- 2) Private bucket. 5 MB hard cap (we upload ~150 KB compressed JPEGs); the
--    app compresses client-side, the cap is just a safety backstop.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

-- 3) RLS on storage.objects: a user may read/write only objects whose first
--    path folder is one of their household ids. (storage.objects already has
--    RLS enabled by Supabase.)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'receipts_select_own_household') then
    create policy "receipts_select_own_household" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'receipts'
        and ((storage.foldername(name))[1])::uuid in (select my_household_ids())
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'receipts_insert_own_household') then
    create policy "receipts_insert_own_household" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'receipts'
        and ((storage.foldername(name))[1])::uuid in (select my_household_ids())
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'receipts_update_own_household') then
    create policy "receipts_update_own_household" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'receipts'
        and ((storage.foldername(name))[1])::uuid in (select my_household_ids())
      )
      with check (
        bucket_id = 'receipts'
        and ((storage.foldername(name))[1])::uuid in (select my_household_ids())
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'receipts_delete_own_household') then
    create policy "receipts_delete_own_household" on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'receipts'
        and ((storage.foldername(name))[1])::uuid in (select my_household_ids())
      );
  end if;
end $$;
