create extension if not exists vector with schema extensions;
grant usage on schema extensions to service_role;

create table public.portfolio_documents (
  id text primary key,
  title text not null,
  url text not null,
  content text not null,
  embedding extensions.vector(384) not null,
  updated_at timestamptz not null default now()
);
alter table public.portfolio_documents enable row level security;
-- Only Edge Functions using the service role may read or write knowledge.
revoke all on public.portfolio_documents from anon, authenticated;
grant all on public.portfolio_documents to service_role;

create function public.match_portfolio_documents(query_embedding extensions.vector(384), match_count integer default 5)
returns table (id text, title text, url text, content text, similarity double precision)
language sql stable set search_path = public, extensions as $$
  select id, title, url, content, 1 - (embedding <=> query_embedding) as similarity
  from public.portfolio_documents
  order by embedding <=> query_embedding limit least(greatest(match_count, 1), 6);
$$;
revoke all on function public.match_portfolio_documents from public, anon, authenticated;
grant execute on function public.match_portfolio_documents to service_role;

-- Transactional replacement: a failed ingestion leaves the previous knowledge intact.
create function public.replace_portfolio_documents(documents jsonb)
returns void language plpgsql set search_path = public, extensions as $$
begin
  if jsonb_array_length(documents) < 1 or jsonb_array_length(documents) > 100 then
    raise exception 'Expected 1 to 100 documents';
  end if;
  perform pg_advisory_xact_lock(781034);
  delete from public.portfolio_documents;
  insert into public.portfolio_documents(id, title, url, content, embedding)
  select item->>'id', item->>'title', item->>'url', item->>'content', (item->>'embedding')::vector
  from jsonb_array_elements(documents) item;
end;
$$;
revoke all on function public.replace_portfolio_documents from public, anon, authenticated;
grant execute on function public.replace_portfolio_documents to service_role;

create table public.portfolio_chat_limits (
  bucket text primary key,
  requests integer not null default 0,
  expires_at timestamptz not null
);
alter table public.portfolio_chat_limits enable row level security;
revoke all on public.portfolio_chat_limits from anon, authenticated;
grant all on public.portfolio_chat_limits to service_role;

-- Check and increment all budgets together to bound public AI usage across instances.
create function public.consume_portfolio_chat_budget(client_hash text)
returns boolean language plpgsql set search_path = public as $$
declare
  minute_bucket text := to_char(now() at time zone 'UTC', 'YYYYMMDDHH24MI');
  day_bucket text := to_char(now() at time zone 'UTC', 'YYYYMMDD');
  limited boolean;
begin
  perform pg_advisory_xact_lock(781035);
  delete from public.portfolio_chat_limits where expires_at < now();
  insert into public.portfolio_chat_limits(bucket, expires_at) values
    ('ip-minute:' || client_hash || ':' || minute_bucket, now() + interval '2 minutes'),
    ('ip-day:' || client_hash || ':' || day_bucket, now() + interval '1 day'),
    ('global-day:' || day_bucket, now() + interval '1 day')
  on conflict do nothing;
  select exists (
    select 1 from public.portfolio_chat_limits where
      (bucket = 'ip-minute:' || client_hash || ':' || minute_bucket and requests >= 5) or
      (bucket = 'ip-day:' || client_hash || ':' || day_bucket and requests >= 30) or
      (bucket = 'global-day:' || day_bucket and requests >= 200)
  ) into limited;
  if limited then return false; end if;
  update public.portfolio_chat_limits set requests = requests + 1 where bucket in (
    'ip-minute:' || client_hash || ':' || minute_bucket,
    'ip-day:' || client_hash || ':' || day_bucket,
    'global-day:' || day_bucket
  );
  return true;
end;
$$;
revoke all on function public.consume_portfolio_chat_budget from public, anon, authenticated;
grant execute on function public.consume_portfolio_chat_budget to service_role;
