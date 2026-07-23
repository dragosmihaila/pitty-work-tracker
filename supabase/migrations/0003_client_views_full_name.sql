drop view if exists public.work_sessions_client_view;

create view public.work_sessions_client_view
with (security_barrier = true)
as
select
  ws.worker_id,
  p.full_name,
  ws.work_type,
  ws.start_time,
  ws.end_time
from public.work_sessions ws
join public.profiles p on p.id = ws.worker_id;

revoke all on public.work_sessions_client_view from anon, authenticated;
grant select on public.work_sessions_client_view to authenticated;

comment on view public.work_sessions_client_view is
  'Client-safe work session projection. Exposes worker_id, worker full_name, work_type, start_time, and end_time only; amount_eur is deliberately excluded.';

drop view if exists public.pauses_client_view;

create view public.pauses_client_view
with (security_barrier = true)
as
select
  ps.worker_id,
  p.full_name,
  ps.start_time,
  ps.end_time
from public.pauses ps
join public.profiles p on p.id = ps.worker_id;

revoke all on public.pauses_client_view from anon, authenticated;
grant select on public.pauses_client_view to authenticated;

comment on view public.pauses_client_view is
  'Client-safe pause projection. Exposes worker_id, worker full_name, start_time, and end_time only.';

