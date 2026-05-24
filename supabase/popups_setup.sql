-- Create popup_campaigns table
create table if not exists public.popup_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text not null,
  target_url text,
  audience text default 'all' check (audience in ('all', 'logged_in', 'guest')),
  frequency text default 'once_session' check (frequency in ('once_session', 'always', 'once_day')),
  status text default 'draft' check (status in ('active', 'paused', 'draft')),
  impressions integer default 0,
  clicks integer default 0,
  start_date timestamptz default now(),
  end_date timestamptz,
  created_at timestamptz default now(),
  created_by uuid references public.users(id)
);

-- RLS Policies
alter table public.popup_campaigns enable row level security;

-- Public can read active popups
create policy "Allow read access for active popups" on public.popup_campaigns 
for select using (status = 'active');

-- Admins can read all popups
create policy "Allow read access for admins" on public.popup_campaigns 
for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
);

-- Admins can create/update/delete popups
create policy "Allow all access for admins" on public.popup_campaigns 
for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
) with check (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
);

-- Allow anonymous or authenticated to increment impressions/clicks securely
create or replace function increment_popup_stat(campaign_id uuid, stat_type text)
returns void as $$
begin
  if stat_type = 'impression' then
    update public.popup_campaigns set impressions = impressions + 1 where id = campaign_id;
  elsif stat_type = 'click' then
    update public.popup_campaigns set clicks = clicks + 1 where id = campaign_id;
  end if;
end;
$$ language plpgsql security definer;
