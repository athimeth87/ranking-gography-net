-- Server-side enforcement of the competition submission quota.
-- The upload UI caps submissions client-side, but a direct insert/update through
-- RLS could bypass it. This trigger enforces the rule in the database so it holds
-- for every write path.
--
-- Rule: at most 1 PUBLIC published photo per photographer per calendar day.
-- NOTE: apply this on Supabase (supabase db push / SQL editor) for it to take effect.

create or replace function public.enforce_daily_public_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  same_day_count int;
begin
  if NEW.visibility = 'public' and NEW.status = 'published' then
    select count(*) into same_day_count
    from public.photos
    where photographer_id = NEW.photographer_id
      and visibility = 'public'
      and status = 'published'
      and uploaded_at >= date_trunc('day', now())
      and id <> NEW.id;

    if same_day_count >= 1 then
      raise exception 'Daily public submission limit reached (1 photo per day)'
        using errcode = 'check_violation';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_daily_public_quota on public.photos;
create trigger trg_daily_public_quota
  before insert or update on public.photos
  for each row execute function public.enforce_daily_public_quota();
