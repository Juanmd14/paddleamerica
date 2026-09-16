-- =====================================================================
-- Panel de administración: rol admin, permisos de carga, avisos,
-- imágenes en Storage y carga masiva de puntos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Perfiles: rol admin y email (para contactar a los inscriptos)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column is_admin boolean not null default false,
  add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  return new;
end;
$$;

create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Cada usuario edita solo sus datos: nunca is_admin ni email.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- ¿El usuario actual es admin? Security definer para poder usarla dentro de
-- las políticas de profiles sin recursión.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "Admins ven todos los perfiles"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Torneos, noticias y jugadores: los admins cargan, editan y borran
-- ---------------------------------------------------------------------
create policy "Admins cargan torneos"
  on public.tournaments for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins editan torneos"
  on public.tournaments for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins borran torneos"
  on public.tournaments for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins ven todas las noticias"
  on public.news for select to authenticated
  using ((select public.is_admin()));
create policy "Admins cargan noticias"
  on public.news for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins editan noticias"
  on public.news for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins borran noticias"
  on public.news for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins cargan jugadores"
  on public.players for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins editan jugadores"
  on public.players for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins borran jugadores"
  on public.players for delete to authenticated
  using ((select public.is_admin()));

grant insert, update, delete on public.tournaments, public.news, public.players to authenticated;

-- ---------------------------------------------------------------------
-- Inscripciones: los admins ven todas y cambian el estado
-- ---------------------------------------------------------------------
alter table public.tournament_registrations
  drop constraint tournament_registrations_status_check;
alter table public.tournament_registrations
  add constraint tournament_registrations_status_check
  check (status in ('pendiente', 'confirmada', 'rechazada', 'cancelada'));

create policy "Admins ven todas las inscripciones"
  on public.tournament_registrations for select to authenticated
  using ((select public.is_admin()));
create policy "Admins cambian el estado de las inscripciones"
  on public.tournament_registrations for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant update (status) on public.tournament_registrations to authenticated;

-- Una pareja rechazada no puede borrarse y volver a anotarse.
drop policy "Cada usuario cancela su inscripción mientras estén abiertas"
  on public.tournament_registrations;
create policy "Cada usuario cancela su inscripción mientras estén abiertas"
  on public.tournament_registrations for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and status in ('pendiente', 'confirmada')
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.status = 'inscripciones'
    )
  );

-- ---------------------------------------------------------------------
-- Avisos para los usuarios (inscripción confirmada o rechazada)
-- ---------------------------------------------------------------------
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) <= 200),
  body text check (char_length(body) <= 1000),
  href text check (href is null or href like '/%'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Cada usuario ve sus avisos"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Cada usuario marca sus avisos como leídos"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Admins crean avisos"
  on public.notifications for insert to authenticated
  with check ((select public.is_admin()));

grant select, insert on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------
-- Imágenes (flyers, portadas y fotos de jugadores)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Admins suben imágenes"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy "Admins reemplazan imágenes"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy "Admins borran imágenes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Carga masiva de puntos desde Excel, con historial para deshacer
-- ---------------------------------------------------------------------
create table public.ranking_imports (
  id bigint generated always as identity primary key,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  file_name text,
  mode text not null check (mode in ('reemplazar', 'sumar')),
  label text,
  rows_count integer not null default 0,
  -- Puntos y estadísticas de los jugadores antes de la carga
  previous jsonb not null default '[]'::jsonb,
  created_player_ids bigint[] not null default '{}',
  undone_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ranking_imports enable row level security;

create policy "Admins gestionan las cargas de puntos"
  on public.ranking_imports for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update on public.ranking_imports to authenticated;

/*
 * p_rows: [{ player_id, points, matches_played?, matches_won?, titles?, new_player? }]
 * new_player (cuando player_id es null): { slug, first_name, last_name, gender, category, club?, city? }
 * Todo en una transacción: si una fila falla, no se aplica nada.
 */
create function public.apply_points_import(
  p_file_name text,
  p_mode text,
  p_label text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row jsonb;
  v_previous jsonb;
  v_created bigint[] := '{}';
  v_new_id bigint;
  v_updated integer;
  v_import_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden cargar puntos' using errcode = '42501';
  end if;
  if p_mode not in ('reemplazar', 'sumar') then
    raise exception 'Modo de carga inválido: %', p_mode;
  end if;
  if (
    select count(*) <> count(distinct r ->> 'player_id')
    from jsonb_array_elements(p_rows) r
    where r ->> 'player_id' is not null
  ) then
    raise exception 'Hay jugadores repetidos en la carga';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'ranking_points', p.ranking_points,
    'matches_played', p.matches_played,
    'matches_won', p.matches_won,
    'titles', p.titles
  )), '[]'::jsonb)
  into v_previous
  from public.players p
  where p.id in (
    select (r ->> 'player_id')::bigint
    from jsonb_array_elements(p_rows) r
    where r ->> 'player_id' is not null
  );

  for v_row in select value from jsonb_array_elements(p_rows) loop
    if v_row ->> 'player_id' is null and v_row ? 'new_player' then
      insert into public.players (
        slug, first_name, last_name, gender, category, club, city,
        ranking_points, matches_played, matches_won, titles
      )
      values (
        v_row -> 'new_player' ->> 'slug',
        v_row -> 'new_player' ->> 'first_name',
        v_row -> 'new_player' ->> 'last_name',
        v_row -> 'new_player' ->> 'gender',
        v_row -> 'new_player' ->> 'category',
        nullif(v_row -> 'new_player' ->> 'club', ''),
        nullif(v_row -> 'new_player' ->> 'city', ''),
        coalesce((v_row ->> 'points')::integer, 0),
        coalesce((v_row ->> 'matches_played')::integer, 0),
        coalesce((v_row ->> 'matches_won')::integer, 0),
        coalesce((v_row ->> 'titles')::integer, 0)
      )
      returning id into v_new_id;
      v_created := v_created || v_new_id;
    end if;
  end loop;

  update public.players p
  set
    ranking_points = case when p_mode = 'sumar'
      then p.ranking_points + coalesce(r.points, 0)
      else coalesce(r.points, p.ranking_points) end,
    matches_played = case when p_mode = 'sumar'
      then p.matches_played + coalesce(r.matches_played, 0)
      else coalesce(r.matches_played, p.matches_played) end,
    matches_won = case when p_mode = 'sumar'
      then p.matches_won + coalesce(r.matches_won, 0)
      else coalesce(r.matches_won, p.matches_won) end,
    titles = case when p_mode = 'sumar'
      then p.titles + coalesce(r.titles, 0)
      else coalesce(r.titles, p.titles) end
  from jsonb_to_recordset(p_rows) as r(
    player_id bigint,
    points integer,
    matches_played integer,
    matches_won integer,
    titles integer
  )
  where r.player_id is not null and p.id = r.player_id;

  get diagnostics v_updated = row_count;

  insert into public.ranking_imports (
    file_name, mode, label, rows_count, previous, created_player_ids
  )
  values (
    p_file_name,
    p_mode,
    nullif(p_label, ''),
    v_updated + coalesce(array_length(v_created, 1), 0),
    v_previous,
    v_created
  )
  returning id into v_import_id;

  return jsonb_build_object(
    'import_id', v_import_id,
    'updated', v_updated,
    'created', coalesce(array_length(v_created, 1), 0)
  );
end;
$$;

-- Restaura los valores de la última carga no deshecha y borra los jugadores que creó.
create function public.undo_last_points_import()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_import public.ranking_imports;
  v_restored integer;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden deshacer cargas' using errcode = '42501';
  end if;

  select * into v_import
  from public.ranking_imports
  where undone_at is null
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No hay cargas para deshacer';
  end if;

  update public.players p
  set
    ranking_points = prev.ranking_points,
    matches_played = prev.matches_played,
    matches_won = prev.matches_won,
    titles = prev.titles
  from jsonb_to_recordset(v_import.previous) as prev(
    id bigint,
    ranking_points integer,
    matches_played integer,
    matches_won integer,
    titles integer
  )
  where p.id = prev.id;

  get diagnostics v_restored = row_count;

  delete from public.players where id = any (v_import.created_player_ids);

  update public.ranking_imports set undone_at = now() where id = v_import.id;

  return jsonb_build_object(
    'import_id', v_import.id,
    'restored', v_restored,
    'deleted', coalesce(array_length(v_import.created_player_ids, 1), 0)
  );
end;
$$;

revoke execute on function public.apply_points_import(text, text, text, jsonb) from public, anon;
revoke execute on function public.undo_last_points_import() from public, anon;
grant execute on function public.apply_points_import(text, text, text, jsonb) to authenticated;
grant execute on function public.undo_last_points_import() to authenticated;
