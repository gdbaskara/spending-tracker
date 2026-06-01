-- The recurring-generation functions must NOT be callable by app clients
-- (anon/authenticated) — only the cron job (runs as table owner) needs them.
-- Revoke the default PostgREST-exposed execute grants.
revoke execute on function public.generate_recurring_for_month(int, int) from public, anon, authenticated;
revoke execute on function public.generate_recurring_current_month() from public, anon, authenticated;
