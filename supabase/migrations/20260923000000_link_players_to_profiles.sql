-- =====================================================================
-- Cada cuenta puede tener su jugador del ranking.
-- Hasta ahora eran dos cosas sueltas: las cuentas (con categoría) y los
-- jugadores del ranking (con puntos). El admin los conecta desde la ficha
-- del usuario, creando el jugador con sus puntos iniciales o vinculando uno
-- que ya existía.
-- =====================================================================

alter table public.players
  add column profile_id uuid unique references public.profiles (id) on delete set null;

comment on column public.players.profile_id is
  'Cuenta del jugador. Si se borra la cuenta, el jugador sigue en el ranking sin vínculo.';

-- ---------------------------------------------------------------------
-- La categoría de la cuenta manda: al asignarla, también se actualiza la
-- del jugador vinculado ("1ra" … "8va", como la guarda el ranking).
-- ---------------------------------------------------------------------
create or replace function public.set_profile_category(
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
  v_name text;
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
    v_name := p_category
      || (array['ra', 'da', 'ra', 'ta', 'ta', 'ta', 'ma', 'va'])[p_category];

    update public.players set category = v_name where profile_id = p_user_id;

    insert into public.notifications (user_id, title, body, href)
    values (
      p_user_id,
      'Tu categoría es ' || v_name,
      'La asignó el organizador. Ya podés anotarte en los torneos de tu categoría.',
      '/torneos'
    );
  end if;
end;
$$;
