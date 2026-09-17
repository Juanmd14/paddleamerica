-- =====================================================================
-- Hacer y quitar admins desde el panel (Usuarios → ficha → Hacer admin),
-- sin tener que correr SQL. Siempre queda al menos un admin.
-- =====================================================================

create function public.set_profile_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old boolean;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores cambian admins' using errcode = '42501';
  end if;
  if p_is_admin is null then
    raise exception 'valor_invalido' using errcode = 'P0001';
  end if;
  if p_user_id = (select auth.uid()) and not p_is_admin then
    raise exception 'es_tu_cuenta' using errcode = 'P0001';
  end if;

  -- Bloquea a los admins actuales: si dos admins se quitan el permiso al mismo
  -- tiempo, el segundo espera y vuelve a comprobar que sigue siendo admin.
  perform 1 from public.profiles where is_admin for update;
  if not public.is_admin() then
    raise exception 'Solo los administradores cambian admins' using errcode = '42501';
  end if;

  select p.is_admin into v_old
  from public.profiles p
  where p.id = p_user_id
  for update;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
  end if;
  if v_old = p_is_admin then
    return;
  end if;

  if not p_is_admin
    and (select count(*) from public.profiles where is_admin) <= 1 then
    raise exception 'ultimo_admin' using errcode = 'P0001';
  end if;

  update public.profiles set is_admin = p_is_admin where id = p_user_id;

  insert into public.notifications (user_id, title, body, href)
  values (
    p_user_id,
    case when p_is_admin
      then 'Ahora sos admin de PaddleAmerica'
      else 'Ya no sos admin' end,
    case when p_is_admin
      then 'Tenés acceso al panel: torneos, jugadores, usuarios y puntos.'
      else 'Si creés que es un error, hablá con el organizador.' end,
    case when p_is_admin then '/admin' else null end
  );
end;
$$;

revoke execute on function public.set_profile_admin(uuid, boolean) from public, anon;
grant execute on function public.set_profile_admin(uuid, boolean) to authenticated;
