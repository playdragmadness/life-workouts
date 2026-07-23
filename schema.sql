-- Rung schema v5. Safe to re-run in the Supabase SQL editor.
-- It includes workout grouping, rest, analytics, and custom-exercise muscle fields.
create extension if not exists pgcrypto;

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  notes text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  cat text not null check (cat in ('compound','isolation','leg')),
  weight numeric not null default 0,
  lo integer not null default 8,
  hi integer not null default 12,
  inc numeric not null default 5,
  target integer not null default 8,
  last jsonb not null default '[]'::jsonb,
  rec jsonb,
  sort integer not null default 0,
  machine_id uuid references public.machines(id) on delete set null,
  seat integer check (seat between 1 and 10),
  seat2 integer check (seat2 between 1 and 10),
  muscle text,
  muscles jsonb not null default '[]'::jsonb,
  body_area text check (body_area in ('upper','lower','core')),
  day text,
  pr jsonb,
  rest_seconds integer check (rest_seconds between 15 and 900),
  warmup_sets integer not null default 0 check (warmup_sets between 0 and 5),
  created_at timestamptz not null default now(),
  check (lo > 0 and hi >= lo and target between lo and hi)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Workout',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  cat text,
  muscle text,
  muscles jsonb not null default '[]'::jsonb,
  performed_at timestamptz not null default now(),
  sets jsonb not null default '[]'::jsonb,
  prescribed_weight numeric,
  target integer,
  result text check (result in ('go','hold','miss')),
  next_weight numeric,
  next_target integer,
  estimated_1rm numeric,
  volume_load numeric,
  note text,
  pr boolean not null default false
);

create table if not exists public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  activity text not null,
  minutes integer not null check (minutes between 1 and 600),
  distance numeric,
  distance_unit text check (distance_unit in ('mi','km')),
  effort text not null default 'moderate' check (effort in ('easy','moderate','hard')),
  minutes_easy integer not null default 0 check (minutes_easy between 0 and 600),
  minutes_moderate integer not null default 0 check (minutes_moderate between 0 and 600),
  minutes_hard integer not null default 0 check (minutes_hard between 0 and 600),
  average_heart_rate integer check (average_heart_rate between 20 and 260),
  max_heart_rate integer check (max_heart_rate between 20 and 260),
  active_energy numeric check (active_energy >= 0),
  source text not null default 'manual' check (source in ('manual','apple_health')),
  source_workout_id text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Migrate installations created by earlier versions.
alter table public.exercises add column if not exists rest_seconds integer check (rest_seconds between 15 and 900);
alter table public.exercises add column if not exists warmup_sets integer not null default 0 check (warmup_sets between 0 and 5);
-- These were part of the original create-table definition, but need explicit
-- migrations for databases that were created before adjustable machine settings.
alter table public.exercises add column if not exists seat integer check (seat between 1 and 10);
alter table public.exercises add column if not exists seat2 integer check (seat2 between 1 and 10);
alter table public.exercises add column if not exists muscles jsonb not null default '[]'::jsonb;
alter table public.exercises add column if not exists body_area text check (body_area in ('upper','lower','core'));
alter table public.sessions add column if not exists workout_id uuid references public.workouts(id) on delete set null;
alter table public.sessions add column if not exists muscles jsonb not null default '[]'::jsonb;
alter table public.sessions add column if not exists next_target integer;
alter table public.sessions add column if not exists estimated_1rm numeric;
alter table public.sessions add column if not exists volume_load numeric;
alter table public.cardio_sessions add column if not exists distance_unit text check (distance_unit in ('mi','km'));
alter table public.cardio_sessions add column if not exists minutes_easy integer not null default 0 check (minutes_easy between 0 and 600);
alter table public.cardio_sessions add column if not exists minutes_moderate integer not null default 0 check (minutes_moderate between 0 and 600);
alter table public.cardio_sessions add column if not exists minutes_hard integer not null default 0 check (minutes_hard between 0 and 600);
alter table public.cardio_sessions add column if not exists average_heart_rate integer check (average_heart_rate between 20 and 260);
alter table public.cardio_sessions add column if not exists max_heart_rate integer check (max_heart_rate between 20 and 260);
alter table public.cardio_sessions add column if not exists active_energy numeric check (active_energy >= 0);
alter table public.cardio_sessions add column if not exists source text not null default 'manual' check (source in ('manual','apple_health'));
alter table public.cardio_sessions add column if not exists source_workout_id text;
create unique index if not exists cardio_sessions_source_workout_idx on public.cardio_sessions (user_id, source, source_workout_id) where source_workout_id is not null;

create table if not exists public.keepalive (
  id integer primary key,
  ping timestamptz not null default now()
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;

create index if not exists sessions_exercise_performed_idx on public.sessions (exercise_id, performed_at desc);
create index if not exists sessions_workout_idx on public.sessions (workout_id, performed_at);
create index if not exists workouts_started_idx on public.workouts (user_id, started_at desc);
create index if not exists cardio_sessions_performed_idx on public.cardio_sessions (user_id, performed_at desc);

alter table public.machines enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.sessions enable row level security;
alter table public.cardio_sessions enable row level security;
alter table public.keepalive enable row level security;

drop policy if exists "own machines" on public.machines;
drop policy if exists "own exercises" on public.exercises;
drop policy if exists "own workouts" on public.workouts;
drop policy if exists "own sessions" on public.sessions;
drop policy if exists "own cardio sessions" on public.cardio_sessions;
drop policy if exists "read keepalive" on public.keepalive;

create policy "own machines" on public.machines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own exercises" on public.exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own workouts" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own cardio sessions" on public.cardio_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read keepalive" on public.keepalive for select using (true);
