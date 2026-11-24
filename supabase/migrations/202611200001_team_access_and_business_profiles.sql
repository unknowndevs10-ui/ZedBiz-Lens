create table if not exists public.team_members (
  email text primary key,
  display_name text not null,
  access_role text not null check (access_role in ('head_developer', 'developer', 'lecturer', 'finance')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint team_members_email_lowercase check (email = lower(email))
);

alter table public.team_members enable row level security;
revoke all on table public.team_members from anon, authenticated;

create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and tm.active
  );
$$;

comment on function public.is_team_member() is
  'Intentional boolean-only SECURITY DEFINER RPC: checks only the caller JWT email against the private allowlist and returns no member data.';

revoke all on function public.is_team_member() from public;
grant execute on function public.is_team_member() to authenticated;

create table if not exists public.business_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;
revoke all on table public.business_profiles from anon;
grant select, insert, update on table public.business_profiles to authenticated;

drop policy if exists "team members read own business profile" on public.business_profiles;
create policy "team members read own business profile"
  on public.business_profiles for select to authenticated
  using (user_id = (select auth.uid()) and public.is_team_member());

drop policy if exists "team members create own business profile" on public.business_profiles;
create policy "team members create own business profile"
  on public.business_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_team_member());

drop policy if exists "team members update own business profile" on public.business_profiles;
create policy "team members update own business profile"
  on public.business_profiles for update to authenticated
  using (user_id = (select auth.uid()) and public.is_team_member())
  with check (user_id = (select auth.uid()) and public.is_team_member());
