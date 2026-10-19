-- Keep cleanup indexed and bounded even if the old limiter accumulated buckets.
create index if not exists portfolio_chat_limits_expiry_idx
  on public.portfolio_chat_limits (expires_at);

create or replace function public.consume_portfolio_chat_budget(client_hash text)
returns boolean language plpgsql set search_path = public as $$
declare
  minute_bucket text := to_char(now() at time zone 'UTC', 'YYYYMMDDHH24MI');
  day_bucket text := to_char(now() at time zone 'UTC', 'YYYYMMDD');
  month_bucket text := to_char(now() at time zone 'UTC', 'YYYYMM');
  minute_end timestamptz := date_trunc('minute', now()) + interval '1 minute';
  day_end timestamptz := (date_trunc('day', now() at time zone 'UTC') + interval '1 day') at time zone 'UTC';
  month_end timestamptz := (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC';
begin
  if client_hash is null or client_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  -- Same lock as the original function: rolling deployments share the budget.
  perform pg_advisory_xact_lock(781035);
  -- Check global caps FIRST. Rejected identities allocate no rows or cleanup work.
  if exists (select 1 from public.portfolio_chat_limits where
    (bucket = 'global-minute:' || minute_bucket and requests >= 20) or
    (bucket = 'global-day:' || day_bucket and requests >= 200) or
    (bucket = 'global-month:' || month_bucket and requests >= 3000)
  ) then return false; end if;
  if exists (select 1 from public.portfolio_chat_limits where expires_at > now() and (
    (bucket = 'ip-cooldown:' || client_hash and requests >= 1) or
    (bucket = 'ip-minute:' || client_hash || ':' || minute_bucket and requests >= 5) or
    (bucket = 'ip-day:' || client_hash || ':' || day_bucket and requests >= 30)
  )) then return false; end if;

  delete from public.portfolio_chat_limits where bucket in (
    select bucket from public.portfolio_chat_limits where expires_at <= now()
    order by expires_at limit 100
  );
  insert into public.portfolio_chat_limits as limits (bucket, requests, expires_at) values
    ('global-minute:' || minute_bucket, 1, minute_end),
    ('global-day:' || day_bucket, 1, day_end),
    ('global-month:' || month_bucket, 1, month_end),
    ('ip-minute:' || client_hash || ':' || minute_bucket, 1, minute_end),
    ('ip-day:' || client_hash || ':' || day_bucket, 1, day_end),
    ('ip-cooldown:' || client_hash, 1, now() + interval '5 seconds')
  on conflict (bucket) do update set
    requests = case when limits.expires_at <= now() then 1 else limits.requests + 1 end,
    expires_at = excluded.expires_at;
  return true;
end;
$$;

revoke all on function public.consume_portfolio_chat_budget from public, anon, authenticated;
grant execute on function public.consume_portfolio_chat_budget to service_role;
