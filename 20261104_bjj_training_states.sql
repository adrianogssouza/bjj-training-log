-- Execute no SQL Editor do projeto Supabase já usado pelo NutriPlan.
-- Este script cria somente a tabela do BJJ Training Log.
begin;

create table if not exists public.bjj_training_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

alter table public.bjj_training_states enable row level security;
revoke all on public.bjj_training_states from anon;
revoke all on public.bjj_training_states from authenticated;
grant select, insert, update on public.bjj_training_states to authenticated;

drop policy if exists "bjj_read_own" on public.bjj_training_states;
create policy "bjj_read_own" on public.bjj_training_states
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "bjj_insert_own" on public.bjj_training_states;
create policy "bjj_insert_own" on public.bjj_training_states
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "bjj_update_own" on public.bjj_training_states;
create policy "bjj_update_own" on public.bjj_training_states
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
