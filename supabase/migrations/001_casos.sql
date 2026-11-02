-- Croquis Vivo: tabla de casos con RLS por usuario (inicio de sesión anónimo de Supabase).
-- Los casos solo contienen croquis de ejemplo, afirmaciones y acciones. Nada de datos personales de personas reales.
create table if not exists public.casos (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  datos jsonb not null check (octet_length(datos::text) < 200000),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists casos_user_idx on public.casos (user_id, actualizado desc);
alter table public.casos enable row level security;
create policy "casos_select_propios" on public.casos for select using (user_id = auth.uid());
create policy "casos_insert_propios" on public.casos for insert with check (user_id = auth.uid());
create policy "casos_update_propios" on public.casos for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "casos_delete_propios" on public.casos for delete using (user_id = auth.uid());
