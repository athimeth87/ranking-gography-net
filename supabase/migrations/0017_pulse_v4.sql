-- 0017_pulse_v4.sql
-- Implements V4 role-weighted engagement snapshots at vote time.

-- 1. Add engagement column to photos
alter table public.photos add column if not exists engagement numeric(10, 4) default 0;

-- Backfill existing engagement using 'regular' role weights (like:1, fav:2, comment:4)
update public.photos
set engagement = (coalesce(likes_count, 0) * 1) + 
                 (coalesce(favorites_count, 0) * 2) + 
                 (coalesce(comments_count, 0) * 4)
where engagement = 0;

-- 2. Function to compute vote weight based on photo age
create or replace function public.vote_age_weight(photo_created_at timestamptz)
returns numeric language plpgsql immutable as $$
declare
  age_hours numeric;
begin
  age_hours := extract(epoch from (now() - photo_created_at)) / 3600.0;
  if age_hours <= 24 then
    return 1.0;
  elsif age_hours <= 30 then
    -- 1.0 -> 0.1 across hours 24..30
    return 1.0 - 0.9 * ((age_hours - 24) / 6.0);
  end if;
  return 0.1;
end;
$$;

-- 3. Trigger for votes (likes)
create or replace function public.tr_v4_like()
returns trigger language plpgsql security definer as $$
declare
  p_created_at timestamptz;
  u_role text;
  v_weight numeric;
  v_value numeric;
begin
  if tg_op = 'INSERT' then
    select uploaded_at into p_created_at from public.photos where id = new.photo_id;
    
    select case 
      when photographer_status = 'approved' then 'ambassador'
      when is_customer = true then 'rankmaster'
      else 'regular'
    end into u_role
    from public.users where id = new.user_id;

    v_weight := public.vote_age_weight(p_created_at);
    
    v_value := case u_role
      when 'ambassador' then 5
      when 'rankmaster' then 3
      else 1
    end;

    update public.photos set engagement = engagement + (v_value * v_weight) where id = new.photo_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_v4_like_trigger on public.votes;
create trigger tr_v4_like_trigger after insert on public.votes
for each row execute function public.tr_v4_like();

-- 4. Trigger for favorites
create or replace function public.tr_v4_favorite()
returns trigger language plpgsql security definer as $$
declare
  p_created_at timestamptz;
  u_role text;
  v_weight numeric;
  v_value numeric;
begin
  if tg_op = 'INSERT' then
    select uploaded_at into p_created_at from public.photos where id = new.photo_id;
    
    select case 
      when photographer_status = 'approved' then 'ambassador'
      when is_customer = true then 'rankmaster'
      else 'regular'
    end into u_role
    from public.users where id = new.user_id;

    v_weight := public.vote_age_weight(p_created_at);
    
    v_value := case u_role
      when 'ambassador' then 10
      when 'rankmaster' then 6
      else 2
    end;

    update public.photos set engagement = engagement + (v_value * v_weight) where id = new.photo_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_v4_fav_trigger on public.favorites;
create trigger tr_v4_fav_trigger after insert on public.favorites
for each row execute function public.tr_v4_favorite();

-- 5. Trigger for comments (treated as 'share' equivalent in matrix for now, or just double favorite)
create or replace function public.tr_v4_comment()
returns trigger language plpgsql security definer as $$
declare
  p_created_at timestamptz;
  u_role text;
  v_weight numeric;
  v_value numeric;
begin
  if tg_op = 'INSERT' then
    select uploaded_at into p_created_at from public.photos where id = new.photo_id;
    
    select case 
      when photographer_status = 'approved' then 'ambassador'
      when is_customer = true then 'rankmaster'
      else 'regular'
    end into u_role
    from public.users where id = new.user_id;

    v_weight := public.vote_age_weight(p_created_at);
    
    v_value := case u_role
      when 'ambassador' then 20
      when 'rankmaster' then 12
      else 4
    end;

    update public.photos set engagement = engagement + (v_value * v_weight) where id = new.photo_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_v4_comment_trigger on public.comments;
create trigger tr_v4_comment_trigger after insert on public.comments
for each row execute function public.tr_v4_comment();

-- 6. RPC for bulk updating pulse stats
create or replace function public.apply_photo_pulse_v4(updates jsonb)
returns integer language plpgsql security definer as $$
declare
  n integer;
begin
  with data as (
    select (e->>'id')::uuid as id,
           (e->>'pulse')::numeric as pulse,
           (e->>'score')::numeric as score,
           (e->>'percentile')::numeric as percentile,
           nullif(e->>'badge', '') as badge
    from jsonb_array_elements(updates) e
  )
  update public.photos p
    set pulse       = d.pulse,
        score_v2    = d.score,
        percentile  = d.percentile,
        badge       = d.badge,
        peak_pulse  = greatest(coalesce(p.peak_pulse, 0), d.pulse)
    from data d
    where p.id = d.id;

  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function public.apply_photo_pulse_v4(jsonb) to service_role;
