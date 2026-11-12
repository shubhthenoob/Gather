-- Highlight: initial schema

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  google_id text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  highlight_colour text not null default '#fff3a3',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  selected_text text not null check (length(btrim(selected_text)) > 0),
  normalised_text text generated always as (lower(regexp_replace(btrim(selected_text), '\s+', ' ', 'g'))) stored,
  note text,
  source_url text not null,
  canonical_url text not null,
  page_title text not null default '',
  domain text not null default '',
  prefix text not null default '',
  suffix text not null default '',
  anchor_data jsonb not null default '{}'::jsonb,
  search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(selected_text, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(note, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(page_title, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(domain, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Duplicate prevention: same user, page, normalised text and surrounding context.
create unique index highlights_dedupe on public.highlights
  (user_id, canonical_url, md5(normalised_text), md5(prefix || '|' || suffix));
create index highlights_user_url on public.highlights (user_id, canonical_url);
create index highlights_user_created on public.highlights (user_id, created_at desc);
create index highlights_search on public.highlights using gin (search);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  title text,
  content text not null default '',
  search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'A')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_created on public.notes (user_id, created_at desc);
create index notes_search on public.notes using gin (search);

-- updated_at maintenance
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger highlights_touch before update on public.highlights for each row execute function public.touch_updated_at();
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();
create trigger prefs_touch before update on public.user_preferences for each row execute function public.touch_updated_at();

-- Provision a profile on first sign-in
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, google_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'provider_id'
  ) on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Row Level Security: every row is private to its owner
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.highlights enable row level security;
alter table public.notes enable row level security;

create policy "own profile" on public.users for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own prefs" on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own highlights" on public.highlights for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notes" on public.notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Date-wise pages, derived from UTC timestamps in the user's timezone
create or replace function public.day_pages()
returns table (day date, highlight_count bigint, note_count bigint)
language sql stable security invoker set search_path = public as $$
  with tz as (select coalesce((select timezone from public.users where id = auth.uid()), 'UTC') as name),
  items as (
    select (h.created_at at time zone (select name from tz))::date as day, 1 as hc, 0 as nc from public.highlights h
    union all
    select (n.created_at at time zone (select name from tz))::date, 0, 1 from public.notes n
  )
  select day, sum(hc)::bigint, sum(nc)::bigint from items group by day order by day desc;
$$;

-- Global search across highlights and notes
create or replace function public.search_content(q text)
returns table (kind text, id uuid, title text, body text, note text, domain text, url text, created_at timestamptz, rank real)
language sql stable security invoker set search_path = public as $$
  with query as (select websearch_to_tsquery('simple', q) as tsq, '%' || q || '%' as pat)
  select * from (
    select 'highlight'::text, h.id, h.page_title, h.selected_text, h.note, h.domain, h.source_url, h.created_at,
           ts_rank(h.search, query.tsq)
    from public.highlights h, query
    where h.search @@ query.tsq or h.selected_text ilike query.pat or h.note ilike query.pat
       or h.page_title ilike query.pat or h.domain ilike query.pat
    union all
    select 'note'::text, n.id, n.title, n.content, null, null, null, n.created_at, ts_rank(n.search, query.tsq)
    from public.notes n, query
    where n.search @@ query.tsq or n.content ilike query.pat or n.title ilike query.pat
  ) r
  order by 9 desc, 8 desc
  limit 100;
$$;

alter publication supabase_realtime add table public.highlights, public.notes;
