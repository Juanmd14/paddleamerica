-- =====================================================================
-- Dueños de club.
--
-- Un admin vincula una cuenta a un club (club_owners). El dueño puede:
--   · crear, editar y borrar (sin inscripciones) torneos de SU club;
--   · ver las inscripciones de esos torneos y confirmarlas o rechazarlas;
--   · subir flyers y fotos del álbum del club a su carpeta de Storage.
-- Nada más: no ve emails ni teléfonos (las inscripciones le llegan por
-- club_tournament_registrations, sin contact_phone ni notas), no toca
-- jugadores, puntos, noticias, usuarios ni otros clubes, y no puede
-- destacar torneos en el inicio (eso sigue siendo del admin).
-- =====================================================================

create table public.club_owners (
  club_id bigint not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create index club_owners_user_idx on public.club_owners (user_id);

alter table public.club_owners enable row level security;

create policy "Cada dueño ve sus clubes y los admins ven todos"
  on public.club_owners for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Sin insert/update/delete: solo se cambia con set_club_owner (admins).
grant select on public.club_owners to authenticated;

-- ---------------------------------------------------------------------
-- Helpers de permisos
-- ---------------------------------------------------------------------
create function public.is_club_owner(p_club_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.club_owners o
    where o.club_id = p_club_id
      and o.user_id = (select auth.uid())
  );
$$;

create function public.is_any_club_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.club_owners o
    where o.user_id = (select auth.uid())
  );
$$;

-- Para la política de borrado: el dueño no ve las inscripciones ajenas por
-- RLS, así que un exists directo daría siempre falso.
create function public.tournament_has_registrations(p_tournament_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tournament_registrations r
    where r.tournament_id = p_tournament_id
  );
$$;

revoke execute on function public.is_club_owner(bigint) from public, anon;
revoke execute on function public.is_any_club_owner() from public, anon;
revoke execute on function public.tournament_has_registrations(bigint) from public, anon;
grant execute on function public.is_club_owner(bigint) to authenticated;
grant execute on function public.is_any_club_owner() to authenticated;
grant execute on function public.tournament_has_registrations(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Torneos del club
-- ---------------------------------------------------------------------
create policy "Dueños cargan torneos en su club"
  on public.tournaments for insert to authenticated
  with check (club_id is not null and public.is_club_owner(club_id));

-- El with check impide pasar el torneo a otro club o dejarlo sin club.
create policy "Dueños editan los torneos de su club"
  on public.tournaments for update to authenticated
  using (club_id is not null and public.is_club_owner(club_id))
  with check (club_id is not null and public.is_club_owner(club_id));

create policy "Dueños borran torneos de su club sin inscripciones"
  on public.tournaments for delete to authenticated
  using (
    club_id is not null
    and public.is_club_owner(club_id)
    and not public.tournament_has_registrations(id)
  );

-- Lo que un dueño no puede hacer aunque arme el pedido a mano, sin pasar por
-- el sitio:
--   · destacar en el inicio (es del admin): esos campos quedan como estaban;
--   · poner un flyer que no esté en nuestro Storage;
--   · poner en "Cómo llegar" un link que no sea de Google Maps.
-- Sin sesión (el cron de inscripciones) no se toca nada.
create function public.guard_club_owner_tournament()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if new.cover_url is not null
     and new.cover_url !~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/' then
    raise exception 'flyer_externo';
  end if;
  if new.maps_url is not null
     and new.maps_url !~ '^https://(maps\.app\.goo\.gl|goo\.gl|([a-z0-9-]+\.)*google\.[a-z.]+)/' then
    raise exception 'mapa_externo';
  end if;

  if tg_op = 'INSERT' then
    new.featured := null;
    new.sponsor_name := null;
  else
    new.featured := old.featured;
    new.sponsor_name := old.sponsor_name;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_club_owner_tournament() from public, anon, authenticated;

create trigger tournaments_guard_club_owner
  before insert or update on public.tournaments
  for each row execute function public.guard_club_owner_tournament();

-- ---------------------------------------------------------------------
-- Inscripciones de los torneos del club (sin teléfono ni notas)
-- ---------------------------------------------------------------------
create function public.club_tournament_registrations(p_tournament_id bigint)
returns table (
  id bigint,
  status text,
  user_id uuid,
  partner_id uuid,
  partner_name text,
  player_category smallint,
  partner_category smallint,
  created_at timestamptz,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id, r.status, r.user_id, r.partner_id, r.partner_name,
    r.player_category, r.partner_category, r.created_at, r.accepted_at
  from public.tournament_registrations r
  join public.tournaments t on t.id = r.tournament_id
  where r.tournament_id = p_tournament_id
    and t.club_id is not null
    and public.is_club_owner(t.club_id)
  order by r.created_at;
$$;

revoke execute on function public.club_tournament_registrations(bigint) from public, anon;
grant execute on function public.club_tournament_registrations(bigint) to authenticated;

-- Confirmar, rechazar o volver a pendiente, con aviso a los dos jugadores.
-- Mismas reglas que el panel del admin, más: una inscripción cancelada por
-- los jugadores no la revive el club.
create function public.club_set_registration_status(
  p_registration_id bigint,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.tournament_registrations;
  v_tournament public.tournaments;
  v_title text;
  v_body text;
begin
  if p_status not in ('pendiente', 'confirmada', 'rechazada') then
    raise exception 'estado_invalido';
  end if;

  select * into v_registration
  from public.tournament_registrations
  where id = p_registration_id
  for update;
  if not found then
    raise exception 'inscripcion_no_encontrada';
  end if;

  select * into v_tournament
  from public.tournaments
  where id = v_registration.tournament_id;

  if v_tournament.club_id is null
     or not public.is_club_owner(v_tournament.club_id) then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;

  if v_registration.status = p_status then
    return;
  end if;
  if v_registration.status = 'cancelada' then
    raise exception 'inscripcion_cancelada';
  end if;
  if v_registration.status = 'invitacion' and p_status <> 'rechazada' then
    raise exception 'falta_que_acepte';
  end if;

  update public.tournament_registrations
  set status = p_status
  where id = p_registration_id;

  if p_status in ('confirmada', 'rechazada') then
    v_title := case p_status
      when 'confirmada' then 'Tu inscripción al ' || v_tournament.name || ' fue confirmada'
      else 'Tu inscripción al ' || v_tournament.name || ' fue rechazada'
    end;
    v_body := case p_status
      when 'confirmada' then 'Ya tienen su lugar. ¡Nos vemos en la cancha!'
      else 'La organización no pudo confirmar tu lugar. Si tenés dudas, escribinos.'
    end;

    insert into public.notifications (user_id, title, body, href)
    select player, v_title, v_body, '/torneos/' || v_tournament.slug || '#inscripcion'
    from unnest(array[v_registration.user_id, v_registration.partner_id]) as player
    where player is not null;
  end if;
end;
$$;

revoke execute on function public.club_set_registration_status(bigint, text) from public, anon;
grant execute on function public.club_set_registration_status(bigint, text) to authenticated;

-- ---------------------------------------------------------------------
-- El admin vincula o desvincula dueños
-- ---------------------------------------------------------------------
create function public.set_club_owner(
  p_club_id bigint,
  p_user_id uuid,
  p_owner boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_club public.clubs;
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'sin_permiso' using errcode = '42501';
  end if;

  select * into v_club from public.clubs where id = p_club_id;
  if not found then
    raise exception 'club_no_encontrado';
  end if;

  if p_owner then
    insert into public.club_owners (club_id, user_id)
    values (p_club_id, p_user_id)
    on conflict do nothing;
    get diagnostics v_count = row_count;

    if v_count > 0 then
      insert into public.notifications (user_id, title, body, href)
      values (
        p_user_id,
        'Ahora administrás ' || v_club.name,
        'Desde “Mi club” podés crear los torneos del club y confirmar a las parejas que se anotan.',
        '/mi-club'
      );
    end if;
  else
    delete from public.club_owners
    where club_id = p_club_id and user_id = p_user_id;
  end if;
end;
$$;

revoke execute on function public.set_club_owner(bigint, uuid, boolean) from public, anon;
grant execute on function public.set_club_owner(bigint, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- Flyers: cada dueño sube solo a media/flyers-club/<su id>/
-- ---------------------------------------------------------------------
create policy "Dueños de club suben flyers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'flyers-club'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg', 'webp')
    and (select public.is_any_club_owner())
  );
create policy "Dueños de club ven sus flyers"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'flyers-club'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------
-- Álbum del club: fotos que suben el dueño o un admin, opcionalmente de un
-- torneo del mismo club. Se ven en la página pública del club.
-- ---------------------------------------------------------------------
create table public.club_photos (
  id bigint generated always as identity primary key,
  club_id bigint not null references public.clubs (id) on delete cascade,
  tournament_id bigint references public.tournaments (id) on delete set null,
  -- Solo fotos subidas a nuestro Storage (bucket media), nunca links externos.
  url text not null check (
    url ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/'
  ),
  caption text check (char_length(caption) <= 140),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index club_photos_club_idx on public.club_photos (club_id, created_at desc);

alter table public.club_photos enable row level security;

create policy "Fotos de clubes visibles para todos"
  on public.club_photos for select to anon, authenticated
  using (true);
create policy "Dueños y admins suben fotos del club"
  on public.club_photos for insert to authenticated
  with check ((select public.is_admin()) or public.is_club_owner(club_id));
create policy "Dueños y admins borran fotos del club"
  on public.club_photos for delete to authenticated
  using ((select public.is_admin()) or public.is_club_owner(club_id));

grant select on public.club_photos to anon, authenticated;
grant insert (club_id, tournament_id, url, caption), delete
  on public.club_photos to authenticated;

-- El torneo tiene que ser del mismo club, y cada club tiene un tope de fotos.
create function public.check_club_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tournament_id is not null and not exists (
    select 1 from public.tournaments t
    where t.id = new.tournament_id and t.club_id = new.club_id
  ) then
    raise exception 'torneo_de_otro_club';
  end if;

  if (select count(*) from public.club_photos p where p.club_id = new.club_id) >= 200 then
    raise exception 'album_lleno';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_club_photo() from public, anon, authenticated;

create trigger club_photos_check
  before insert on public.club_photos
  for each row execute function public.check_club_photo();

-- Storage: cada dueño sube las fotos del álbum solo a media/album-club/<su id>/
create policy "Dueños de club suben fotos del álbum"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'album-club'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg', 'webp')
    and (select public.is_any_club_owner())
  );
create policy "Dueños de club ven las fotos de su álbum"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'album-club'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
