-- Semanita — tope diario de pedidos a la IA por usuario.
-- Correr una vez en el SQL Editor de Supabase, después de entitlements.sql.
--
-- La cuota gratuita de Gemini es del proyecto entero: sin un tope por usuario,
-- un solo tester regenerando comidas la agota para todos. Los límites viven en
-- el backend (`src/usage.ts`), no acá, para poder cambiarlos sin migrar.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Día calendario en Argentina, no en UTC: el cupo se renueva a medianoche de
  -- quien usa la app, no a las 21 hs.
  day date not null,
  -- Lista cerrada: la función de abajo es llamable por cualquier usuario
  -- logueado, y sin esto podría llenar la tabla de operaciones inventadas.
  operation text not null check (operation in ('photo', 'menu', 'swap', 'recipe', 'shopping')),
  count integer not null default 0,
  primary key (user_id, day, operation)
);

alter table public.ai_usage enable row level security;

-- Leer lo propio, nada más. No hay insert, update ni delete: si el usuario
-- pudiera escribir, se reiniciaría el contador. Escribe solo la función.
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own"
  on public.ai_usage
  for select
  using (auth.uid() = user_id);

-- Suma uno y dice si entraba, en una sola sentencia. Leer el contador y después
-- escribirlo dejaría pasar dos pedidos simultáneos con el último lugar libre.
--
-- `security definer` porque la tabla no tiene política de escritura. El usuario
-- sale de `auth.uid()`, nunca de un parámetro: nadie puede gastar el cupo de
-- otro. Que alguien la llame directo con un límite enorme no le sirve de nada —
-- el que decide es el backend, con su propio límite.
create or replace function public.consume_ai_quota(p_operation text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'consume_ai_quota requiere un usuario logueado';
  end if;

  insert into public.ai_usage (user_id, day, operation, count)
  values (auth.uid(), v_day, p_operation, 1)
  on conflict (user_id, day, operation)
  do update set count = ai_usage.count + 1
  where ai_usage.count < p_limit
  returning count into v_count;

  -- Sin fila devuelta = el `where` del update no se cumplió = ya estaba lleno.
  return v_count is not null;
end;
$$;

revoke execute on function public.consume_ai_quota(text, integer) from public, anon;
grant execute on function public.consume_ai_quota(text, integer) to authenticated;
