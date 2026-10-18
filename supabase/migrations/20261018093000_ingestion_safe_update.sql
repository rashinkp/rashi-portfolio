-- Supabase safe-update mode requires an explicit predicate for dataset replacement.
create or replace function public.replace_portfolio_documents(documents jsonb)
returns void language plpgsql set search_path = public, extensions as $$
begin
  if jsonb_array_length(documents) < 1 or jsonb_array_length(documents) > 100 then
    raise exception 'Expected 1 to 100 documents';
  end if;
  perform pg_advisory_xact_lock(781034);
  delete from public.portfolio_documents where id is not null;
  insert into public.portfolio_documents(id, title, url, content, embedding)
  select item->>'id', item->>'title', item->>'url', item->>'content', (item->>'embedding')::vector
  from jsonb_array_elements(documents) item;
end;
$$;
