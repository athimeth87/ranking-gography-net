-- 0015_apply_photo_pulse.sql
-- Batch writer for the compute-pulse cron: one set-based UPDATE for the whole
-- run instead of N round-trips. Restricted to service_role (the cron) so no
-- client can inject scores.

create or replace function public.apply_photo_pulse(updates jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with data as (
    select (e->>'id')::uuid as id,
           (e->>'pulse')::numeric as pulse
    from jsonb_array_elements(updates) e
  )
  update public.photos p
    set pulse = d.pulse,
        peak_pulse = greatest(coalesce(p.peak_pulse, 0), d.pulse)
    from data d
    where p.id = d.id;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.apply_photo_pulse(jsonb) from public;
grant execute on function public.apply_photo_pulse(jsonb) to service_role;
