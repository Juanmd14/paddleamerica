-- =====================================================================
-- Las inscripciones se abren solas en la fecha y hora que elige el admin.
-- Antes "Abren las inscripciones" era solo una fecha informativa y el
-- admin tenía que cambiar el estado a mano ese día.
-- =====================================================================

-- Fecha → fecha y hora. Las que ya estaban cargadas quedan a las 00:00 de Argentina.
alter table public.tournaments
  rename column registration_opens_on to registration_opens_at;

alter table public.tournaments
  alter column registration_opens_at type timestamptz
  using (registration_opens_at::timestamp at time zone 'America/Argentina/Buenos_Aires');

comment on column public.tournaments.registration_opens_at is
  'Cuándo se abren solas las inscripciones: un torneo en "proximo" pasa a "inscripciones" a esa hora.';

-- ---------------------------------------------------------------------
-- Abre los torneos cuya hora ya llegó. La corre pg_cron cada minuto;
-- nadie más la puede llamar.
-- ---------------------------------------------------------------------
create function public.open_scheduled_registrations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_opened integer;
begin
  update public.tournaments
  set status = 'inscripciones'
  where status = 'proximo'
    and registration_opens_at is not null
    and registration_opens_at <= now();

  get diagnostics v_opened = row_count;
  return v_opened;
end;
$$;

revoke execute on function public.open_scheduled_registrations() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'abrir-inscripciones',
  '* * * * *',
  'select public.open_scheduled_registrations()'
);
