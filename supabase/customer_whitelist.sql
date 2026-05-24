create table if not exists public.customer_whitelist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check (role in ('photographer', 'voyageur')),
  status text not null default 'pending' check (status in ('pending', 'registered')),
  added_at timestamptz default now(),
  registered_at timestamptz
);

-- Turn on Row Level Security
alter table public.customer_whitelist enable row level security;

-- Allow read access for everyone (so the callback can check emails)
create policy "Allow read access for everyone" on public.customer_whitelist
  for select using (true);

-- Allow insert/update access for everyone (for simplicity during development)
create policy "Allow all access for everyone" on public.customer_whitelist
  for all using (true) with check (true);
