-- =====================================================================
-- Jugadores que ya no compiten y cuentas que se dejan de usar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Un jugador inactivo sale del ranking público, pero conserva sus puntos,
-- su historial y su página. El admin lo puede volver a activar.
-- ---------------------------------------------------------------------
alter table public.players
  add column active boolean not null default true;

comment on column public.players.active is
  'false = ya no compite: no aparece en el ranking público, pero conserva puntos e historial.';

-- ---------------------------------------------------------------------
-- Borrar una cuenta desde el panel. Se borran en cascada su perfil, sus
-- avisos y sus inscripciones, así que no se permite si tiene alguna en un
-- torneo que todavía no terminó. Nunca la propia ni la de otro admin.
-- ---------------------------------------------------------------------
create function public.delete_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores borran cuentas' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'es_tu_cuenta' using errcode = 'P0001';
  end if;

  select p.is_admin into v_is_admin
  from public.profiles p
  where p.id = p_user_id;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
  end if;
  if v_is_admin then
    raise exception 'es_admin' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.tournament_registrations r
    join public.tournaments t on t.id = r.tournament_id
    where (r.user_id = p_user_id or r.partner_id = p_user_id)
      and r.status in ('invitacion', 'pendiente', 'confirmada')
      and t.status <> 'finalizado'
  ) then
    raise exception 'inscripciones_activas' using errcode = 'P0001';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke execute on function public.delete_user_account(uuid) from public, anon;
grant execute on function public.delete_user_account(uuid) to authenticated;
