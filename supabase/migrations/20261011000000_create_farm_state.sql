create table if not exists public.farm_state (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.farm_state enable row level security;

create policy "A farm owner can read their state"
  on public.farm_state for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "A farm owner can create their state"
  on public.farm_state for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "A farm owner can update their state"
  on public.farm_state for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

grant select, insert, update on public.farm_state to authenticated;
