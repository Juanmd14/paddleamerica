-- =====================================================================
-- La categoría la asigna el organizador, no el jugador.
-- Antes cada usuario la elegía en Mi cuenta, y alguien de 5ta podía
-- declararse 8va para anotarse en torneos de menor nivel.
-- =====================================================================

revoke update (category) on public.profiles from authenticated;

comment on column public.profiles.category is
  'Categoría asignada por un admin con set_profile_category: 1 = 1ra … 8 = 8va.';

-- Sin p_category (o null) le quita la categoría.
create function public.set_profile_category(
  p_user_id uuid,
  p_category smallint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old smallint;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores asignan categorías' using errcode = '42501';
  end if;
  if p_category is not null and p_category not between 1 and 8 then
    raise exception 'categoria_invalida' using errcode = 'P0001';
  end if;

  select p.category into v_old
  from public.profiles p
  where p.id = p_user_id
  for update;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
  end if;
  if v_old is not distinct from p_category then
    return;
  end if;

  update public.profiles set category = p_category where id = p_user_id;

  if p_category is not null then
    insert into public.notifications (user_id, title, body, href)
    values (
      p_user_id,
      'Tu categoría es ' || p_category
        || (array['ra', 'da', 'ra', 'ta', 'ta', 'ta', 'ma', 'va'])[p_category],
      'La asignó el organizador. Ya podés anotarte en los torneos de tu categoría.',
      '/torneos'
    );
  end if;
end;
$$;

revoke execute on function public.set_profile_category(uuid, smallint) from public, anon;
grant execute on function public.set_profile_category(uuid, smallint) to authenticated;
