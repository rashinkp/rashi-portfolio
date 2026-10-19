-- Enforce single-use locally as well as through Cloudflare Siteverify.
-- The original limiter holds the same transaction lock and owns bounded cleanup.
create function public.consume_verified_portfolio_chat_budget(client_hash text, verification_hash text)
returns boolean language plpgsql set search_path = public as $$
begin
  if verification_hash is null or verification_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  perform pg_advisory_xact_lock(781035);
  if exists (select 1 from public.portfolio_chat_limits
    where bucket = 'verified-token:' || verification_hash and expires_at > now()
  ) then return false; end if;
  if not public.consume_portfolio_chat_budget(client_hash) then return false; end if;
  insert into public.portfolio_chat_limits (bucket, requests, expires_at)
    values ('verified-token:' || verification_hash, 1, now() + interval '10 minutes')
    on conflict (bucket) do update set requests = 1, expires_at = excluded.expires_at;
  return true;
end;
$$;

revoke all on function public.consume_verified_portfolio_chat_budget from public, anon, authenticated;
grant execute on function public.consume_verified_portfolio_chat_budget to service_role;
