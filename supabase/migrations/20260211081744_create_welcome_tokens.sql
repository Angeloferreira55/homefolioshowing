-- Create welcome_tokens table for onboarding new users
create table if not exists public.welcome_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  email text not null,
  full_name text,
  company text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  used boolean default false
);

-- Add RLS policies
alter table public.welcome_tokens enable row level security;

-- Anyone can read their own welcome token (by token, not user_id)
create policy "Anyone can read welcome tokens by token"
  on public.welcome_tokens for select
  using (true);

-- Only service role can insert/update
create policy "Service role can insert welcome tokens"
  on public.welcome_tokens for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update welcome tokens"
  on public.welcome_tokens for update
  using (auth.role() = 'service_role');

-- Create index for faster token lookups
create index if not exists welcome_tokens_token_idx on public.welcome_tokens(token);
create index if not exists welcome_tokens_user_id_idx on public.welcome_tokens(user_id);
