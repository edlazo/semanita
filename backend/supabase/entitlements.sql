-- Semanita — estado de suscripción por usuario.
-- Correr una vez en el SQL Editor de Supabase.
--
-- El ensayo NO puede vivir en el teléfono: se saltearía reinstalando la app.
-- Vive acá, atado a la cuenta, y lo verifica el backend.

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  trial_started_at timestamptz not null default now(),
  -- Null = nunca se suscribió. Lo escribe el backend cuando se confirma un pago.
  subscribed_until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- El usuario puede LEER su propia fila, y nada más.
-- No hay política de insert ni de update a propósito: si el usuario pudiera
-- escribir acá, podría estirarse el ensayo solo. Escriben únicamente el trigger
-- de abajo (security definer) y el backend con la service role key.
drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own"
  on public.entitlements
  for select
  using (auth.uid() = user_id);

-- La fila se crea sola al registrarse, así el ensayo arranca en el alta y no en
-- el primer uso de la app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Las cuentas creadas antes de esta migración también necesitan su fila.
insert into public.entitlements (user_id, trial_started_at)
select id, created_at from auth.users
on conflict (user_id) do nothing;
