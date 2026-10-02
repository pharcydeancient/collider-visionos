-- Collider media catalog
create extension if not exists "pgcrypto";
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('still', 'live', 'audio')),
  category text not null,
  title text not null,
  poster_path text,
  stream_path text not null,
  hi_path text,
  duration_ms integer,
  loopable boolean not null default true,
  motion text not null default 'none' check (motion in ('none', 'subtle', 'weather')),
  energy smallint check (energy between 1 and 5),
  bpm integer,
  license text,
  premium boolean not null default false,
  locked_treatment text not null default 'dim' check (locked_treatment in ('dim', 'mist', 'smoke', 'none')),
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists media_assets_active_kind_idx on public.media_assets (active, kind, sort);
alter table public.media_assets enable row level security;
drop policy if exists "public read active free assets" on public.media_assets;
create policy "public read active free assets" on public.media_assets for select to anon, authenticated using (active = true);
