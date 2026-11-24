-- Allow any authenticated business account to manage only its own onboarding profile.
-- Team membership stays available for internal roles, but is not a prerequisite for signup.
grant select, insert, update on table public.business_profiles to authenticated;

drop policy if exists "team members read own business profile" on public.business_profiles;
drop policy if exists "team members create own business profile" on public.business_profiles;
drop policy if exists "team members update own business profile" on public.business_profiles;
drop policy if exists "authenticated users read own business profile" on public.business_profiles;
drop policy if exists "authenticated users create own business profile" on public.business_profiles;
drop policy if exists "authenticated users update own business profile" on public.business_profiles;

create policy "authenticated users read own business profile"
  on public.business_profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "authenticated users create own business profile"
  on public.business_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "authenticated users update own business profile"
  on public.business_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
