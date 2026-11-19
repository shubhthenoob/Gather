-- Gather: categories for highlights.
-- Additive only, so older extension versions keep working.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

-- One category per name per user (case-insensitive).
create unique index categories_user_name on public.categories (user_id, lower(btrim(name)));
create index categories_user_used on public.categories (user_id, last_used_at desc);

alter table public.categories enable row level security;
create policy "own categories" on public.categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A highlight can be in several categories. The first id is its main category,
-- which decides the highlight colour on the page. Empty means uncategorised.
alter table public.highlights add column category_ids uuid[] not null default '{}';
create index highlights_categories on public.highlights using gin (category_ids);

-- Deleting a category only removes it from highlights; the highlights stay.
create or replace function public.remove_category_from_highlights() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  update public.highlights
     set category_ids = array_remove(category_ids, old.id)
   where user_id = old.user_id and old.id = any(category_ids);
  return old;
end $$;
create trigger categories_cleanup after delete on public.categories
  for each row execute function public.remove_category_from_highlights();

-- Search now also returns each highlight's categories (return type changes, so drop first).
drop function if exists public.search_content(text);
create function public.search_content(q text)
returns table (kind text, id uuid, title text, body text, note text, domain text, url text, created_at timestamptz, rank real, category_ids uuid[])
language sql stable security invoker set search_path = public as $$
  with query as (select websearch_to_tsquery('simple', q) as tsq, '%' || q || '%' as pat)
  select * from (
    select 'highlight'::text, h.id, h.page_title, h.selected_text, h.note, h.domain, h.source_url, h.created_at,
           ts_rank(h.search, query.tsq), h.category_ids
    from public.highlights h, query
    where h.search @@ query.tsq or h.selected_text ilike query.pat or h.note ilike query.pat
       or h.page_title ilike query.pat or h.domain ilike query.pat
       or exists (select 1 from public.categories c where c.id = any(h.category_ids) and c.name ilike query.pat)
    union all
    select 'note'::text, n.id, n.title, n.content, null, null, null, n.created_at, ts_rank(n.search, query.tsq), '{}'::uuid[]
    from public.notes n, query
    where n.search @@ query.tsq or n.content ilike query.pat or n.title ilike query.pat
  ) r
  order by 9 desc, 8 desc
  limit 100;
$$;

alter publication supabase_realtime add table public.categories;
