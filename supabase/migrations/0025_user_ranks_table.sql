-- 0025_user_ranks_table.sql
-- Create user_ranks table to track users' Top 10 and Rank Master status for email notifications

create table if not exists public.user_ranks (
  user_id uuid references public.users(id) on delete cascade primary key,
  username text not null,
  is_rank_master boolean default false,
  rank_master_since timestamp with time zone,
  latest_top_10_week text, -- 'YYYY-MM-DD' of the Monday of the latest top 10 week
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_ranks enable row level security;

-- Everyone can read
drop policy if exists "User ranks are viewable by everyone" on public.user_ranks;
create policy "User ranks are viewable by everyone" on public.user_ranks for select using (true);

-- Only service role can insert/update (implicitly handled by RLS bypassing service_role)
