-- =====================================================================
-- Nombrar o quitar administradores desde el panel.
-- No se asigna por email al registrarse: con la confirmación por mail
-- apagada, cualquiera podría crear la cuenta con ese email antes que el
-- dueño. Un admin lo nombra después de verificar que es la persona.
-- =====================================================================

create function public.set_user_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores nombran administradores' using errcode = '42501';
  end if;
  if p_is_admin is null then
    raise exception 'valor_invalido' using errcode = 'P0001';
  end if;
  -- Nadie se quita el permiso a sí mismo (así nunca queda el panel sin admins por error).
  if p_user_id = (select auth.uid()) and not p_is_admin then
    raise exception 'es_tu_cuenta' using errcode = 'P0001';
  end if;

  update public.profiles
  set is_admin = p_is_admin
  where id = p_user_id and is_admin is distinct from p_is_admin;

  if not found then
    if not exists (select 1 from public.profiles where id = p_user_id) then
      raise exception 'usuario_no_existe' using errcode = 'P0001';
    end if;
    return;
  end if;

  if p_is_admin then
    insert into public.notifications (user_id, title, body, href)
    values (
      p_user_id,
      'Ahora sos administrador',
      'Ya podés entrar al panel para cargar torneos, jugadores y puntos.',
      '/admin'
    );
  end if;
end;
$$;

revoke execute on function public.set_user_admin(uuid, boolean) from public, anon;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;
