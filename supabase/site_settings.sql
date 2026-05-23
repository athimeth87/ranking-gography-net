create table if not exists public.site_settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table public.site_settings enable row level security;

create policy "Settings are viewable by everyone" 
on public.site_settings for select using (true);

create policy "Settings are editable by admins" 
on public.site_settings for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
);

-- Insert default Voyageurs section content
insert into public.site_settings (id, value)
values (
  'voyageurs_section',
  '{
    "title": "Travelled with us?\\nBecome a Voyageur",
    "description": "Customers who have travelled with GOGRAPHY earn Voyageur status — eligible to submit photos in a customer-only category. Each season the winner receives a 50,000 THB voucher, and the top 10 receive cashback on their next trip.",
    "reward1_amount": "50,000 THB",
    "reward1_label": "VOUCHER",
    "reward1_sub": "ต่อหมวด",
    "reward2_amount": "3-15%",
    "reward2_label": "CASHBACK",
    "reward2_sub": "TOP 10"
  }'
) on conflict (id) do nothing;
