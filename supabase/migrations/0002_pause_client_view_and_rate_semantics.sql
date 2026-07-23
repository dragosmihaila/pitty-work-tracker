comment on column public.work_sessions.amount_eur is
  'Sensitive worker-only hourly rate in EUR. Session earnings are calculated as amount_eur multiplied by hours worked.';

create or replace view public.pauses_client_view
with (security_barrier = true)
as
select
  worker_id,
  start_time,
  end_time
from public.pauses;

revoke all on public.pauses_client_view from anon, authenticated;
grant select on public.pauses_client_view to authenticated;

comment on view public.pauses_client_view is
  'Client-safe pause projection. This view exposes only worker_id, start_time, and end_time.';

