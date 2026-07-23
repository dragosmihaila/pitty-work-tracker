create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('worker', 'client')),
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  work_type text not null check (work_type in ('manual', 'excavator')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  amount_eur numeric(12, 2) not null check (amount_eur >= 0),
  created_at timestamptz not null default now(),
  constraint work_sessions_end_after_start check (end_time > start_time)
);

create table if not exists public.pauses (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  created_at timestamptz not null default now(),
  constraint pauses_end_after_start check (end_time > start_time)
);

create or replace function public.set_pause_end_time()
returns trigger
language plpgsql
as $$
begin
  if new.end_time is null then
    new.end_time := new.start_time + interval '24 hours';
  end if;

  return new;
end;
$$;

drop trigger if exists set_pause_end_time_before_insert on public.pauses;
create trigger set_pause_end_time_before_insert
before insert on public.pauses
for each row
execute function public.set_pause_end_time();

alter table public.pauses
  alter column end_time set not null;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.work_sessions enable row level security;
alter table public.pauses enable row level security;

alter table public.profiles force row level security;
alter table public.work_sessions force row level security;
alter table public.pauses force row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Workers can read their own work sessions" on public.work_sessions;
create policy "Workers can read their own work sessions"
on public.work_sessions
for select
to authenticated
using (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
);

drop policy if exists "Workers can insert their own work sessions" on public.work_sessions;
create policy "Workers can insert their own work sessions"
on public.work_sessions
for insert
to authenticated
with check (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
);

drop policy if exists "Workers can update their own work sessions" on public.work_sessions;
create policy "Workers can update their own work sessions"
on public.work_sessions
for update
to authenticated
using (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
)
with check (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
);

drop policy if exists "Workers can read their own pauses" on public.pauses;
create policy "Workers can read their own pauses"
on public.pauses
for select
to authenticated
using (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
);

drop policy if exists "Workers can insert their own pauses" on public.pauses;
create policy "Workers can insert their own pauses"
on public.pauses
for insert
to authenticated
with check (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
);

drop policy if exists "Workers can update their own pauses" on public.pauses;
create policy "Workers can update their own pauses"
on public.pauses
for update
to authenticated
using (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
)
with check (
  worker_id = auth.uid()
  and public.current_profile_role() = 'worker'
);

create or replace view public.work_sessions_client_view
with (security_barrier = true)
as
select
  worker_id,
  work_type,
  start_time,
  end_time
from public.work_sessions;

revoke all on public.profiles from anon, authenticated;
revoke all on public.work_sessions from anon, authenticated;
revoke all on public.pauses from anon, authenticated;
revoke all on public.work_sessions_client_view from anon, authenticated;

grant select on public.profiles to authenticated;
grant select, insert, update on public.work_sessions to authenticated;
grant select, insert, update on public.pauses to authenticated;
grant select on public.work_sessions_client_view to authenticated;

comment on view public.work_sessions_client_view is
  'Client-safe work session projection. This view deliberately excludes amount_eur; clients must query this view instead of public.work_sessions.';

comment on column public.work_sessions.amount_eur is
  'Sensitive worker-only value. Client profiles have no RLS policy allowing direct work_sessions reads.';
