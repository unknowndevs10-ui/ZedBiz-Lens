grant select on table public.team_members to authenticated;

drop policy if exists "team members read own active allowlist row" on public.team_members;
create policy "team members read own active allowlist row"
  on public.team_members for select to authenticated
  using (email = lower((select auth.jwt() ->> 'email')) and active);

drop policy if exists "team members read own business profile" on public.business_profiles;
create policy "team members read own business profile"
  on public.business_profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.team_members tm
      where tm.email = lower((select auth.jwt() ->> 'email')) and tm.active
    )
  );

drop policy if exists "team members create own business profile" on public.business_profiles;
create policy "team members create own business profile"
  on public.business_profiles for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.team_members tm
      where tm.email = lower((select auth.jwt() ->> 'email')) and tm.active
    )
  );

drop policy if exists "team members update own business profile" on public.business_profiles;
create policy "team members update own business profile"
  on public.business_profiles for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.team_members tm
      where tm.email = lower((select auth.jwt() ->> 'email')) and tm.active
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.team_members tm
      where tm.email = lower((select auth.jwt() ->> 'email')) and tm.active
    )
  );

drop function if exists public.is_team_member();
