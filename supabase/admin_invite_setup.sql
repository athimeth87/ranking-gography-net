-- 1. Create a table to store pending admin invites
create table if not exists public.admin_invites (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  role text not null,
  created_at timestamptz default now()
);

alter table public.admin_invites enable row level security;
create policy "Allow read access" on public.admin_invites for select using (true);
create policy "Allow insert access" on public.admin_invites for insert with check (true);
create policy "Allow delete access" on public.admin_invites for delete using (true);

-- 2. Create a secure function to bypass RLS and promote users
create or replace function promote_to_admin(target_email text, role_name text)
returns boolean as $$
declare
  updated_count integer;
begin
  update public.users
  set is_admin = true,
      is_super_admin = (role_name = 'superadmin')
  where email = target_email;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- If we successfully updated a user, delete their pending invite if any
  if updated_count > 0 then
    delete from public.admin_invites where email = target_email;
    return true;
  end if;
  
  return false;
end;
$$ language plpgsql security definer;
