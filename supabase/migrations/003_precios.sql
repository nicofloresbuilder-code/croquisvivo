-- Semana 14: escenarios del simulador de precios y registro de conversaciones de precio.
-- Sin datos personales: la persona de una conversación se describe solo por rol.
create table if not exists public.escenarios (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creada timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 60),
  segmento text not null check (segmento in ('A','B')),
  alcanzados integer not null check (alcanzados between 0 and 1000000),
  conversion_pct numeric not null check (conversion_pct between 0 and 100),
  precio_anual numeric not null check (precio_anual between 0 and 1000000),
  costo_entrega_anual numeric check (costo_entrega_anual is null or costo_entrega_anual between 0 and 1000000),
  costo_actual_anual numeric check (costo_actual_anual is null or costo_actual_anual between 0 and 100000000),
  costo_fijo_mensual numeric not null default 0 check (costo_fijo_mensual between 0 and 10000000)
);
create index if not exists escenarios_user_idx on public.escenarios (user_id, creada desc);
alter table public.escenarios enable row level security;
create policy "escenarios_select_propios" on public.escenarios for select using (user_id = auth.uid());
create policy "escenarios_insert_propios" on public.escenarios for insert with check (user_id = auth.uid());
create policy "escenarios_update_propios" on public.escenarios for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "escenarios_delete_propios" on public.escenarios for delete using (user_id = auth.uid());

create table if not exists public.conversaciones_precio (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creada timestamptz not null default now(),
  rol text not null check (rol in ('coordinador_pc','director_escuela','administrador_hospital','administrador_empresa','otro')),
  segmento text not null check (segmento in ('A','B')),
  desconocido boolean not null,
  tarea_hoy text not null check (char_length(tarea_hoy) between 1 and 300),
  quien_firma text not null check (char_length(quien_firma) between 1 and 120),
  costo_actual text not null check (char_length(costo_actual) between 1 and 200),
  precio_preguntado numeric not null check (precio_preguntado > 0 and precio_preguntado <= 1000000),
  resultado text not null check (resultado in ('rechazo','interes_dicho','pidio_propuesta','compromiso_firmado','pago_hecho')),
  cita text not null check (char_length(cita) between 1 and 300),
  siguiente_paso text not null check (char_length(siguiente_paso) between 1 and 200)
);
create index if not exists conversaciones_user_idx on public.conversaciones_precio (user_id, creada desc);
alter table public.conversaciones_precio enable row level security;
create policy "conv_select_propias" on public.conversaciones_precio for select using (user_id = auth.uid());
create policy "conv_insert_propias" on public.conversaciones_precio for insert with check (user_id = auth.uid());
create policy "conv_update_propias" on public.conversaciones_precio for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Decisión de diseño: no hay política de borrado en conversaciones. Los rechazos también se conservan.
