-- Semana 13: registro anónimo de eventos y libreta de sesiones de observación.
-- Sin nombres, correos ni teléfonos: la persona observada se describe solo por rol.
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sesion_id uuid,
  tipo text not null check (tipo in ('pagina_vista','caso_creado','comparado','plano_reproducido','accion_asignada','accion_aplicada','accion_confirmada','calibrado','error_validacion','atasco','sesion_iniciada','sesion_terminada')),
  detalle jsonb not null default '{}'::jsonb check (octet_length(detalle::text) < 2000),
  t timestamptz not null default now()
);
create index if not exists eventos_user_idx on public.eventos (user_id, t desc);
alter table public.eventos enable row level security;
create policy "eventos_select_propios" on public.eventos for select using (user_id = auth.uid());
create policy "eventos_insert_propios" on public.eventos for insert with check (user_id = auth.uid());

create table if not exists public.sesiones (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creada timestamptz not null default now(),
  rol text not null check (rol in ('coordinador_pc','director_escuela','administrador_hospital','administrador_empresa','otro')),
  desconocido boolean not null,
  modalidad text not null check (modalidad in ('presencial','remota')),
  completo_solo boolean not null,
  segundos integer not null check (segundos between 0 and 7200),
  errores integer not null check (errores between 0 and 100),
  atascos jsonb not null default '[]'::jsonb check (jsonb_typeof(atascos) = 'array' and octet_length(atascos::text) < 4000),
  problema_principal text not null default '' check (char_length(problema_principal) <= 200),
  gravedad integer not null default 3 check (gravedad between 1 and 5),
  paga_hoy text not null default 'sin dato' check (char_length(paga_hoy) between 1 and 200),
  quien_firma text not null default 'sin dato' check (char_length(quien_firma) between 1 and 120),
  segundos_hoja integer check (segundos_hoja is null or segundos_hoja between 1 and 7200),
  volveria boolean not null,
  prueba_volver text not null default '' check (char_length(prueba_volver) <= 300)
);
create index if not exists sesiones_user_idx on public.sesiones (user_id, creada desc);
alter table public.sesiones enable row level security;
create policy "sesiones_select_propias" on public.sesiones for select using (user_id = auth.uid());
create policy "sesiones_insert_propias" on public.sesiones for insert with check (user_id = auth.uid());
create policy "sesiones_update_propias" on public.sesiones for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Decisión de diseño: no hay política de borrado. Las sesiones, también las que salen mal, se conservan.
