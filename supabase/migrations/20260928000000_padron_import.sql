-- =====================================================================
-- Carga del padrón: la misma planilla de Excel, pero para dar de alta a los
-- jugadores y corregirles la categoría, el club o la ciudad. Los puntos pasan
-- a ser opcionales, porque al armar el ranking todavía no hay ninguno.
--
-- Hasta acá la carga solo tocaba puntos y estadísticas: la categoría de un
-- jugador que ya existía había que cambiarla de a uno en el panel.
-- =====================================================================

alter table public.ranking_imports
  drop constraint ranking_imports_mode_check;

alter table public.ranking_imports
  add constraint ranking_imports_mode_check
  check (mode in ('reemplazar', 'sumar', 'padron'));

comment on column public.ranking_imports.previous is
  'Cómo estaba cada jugador antes de la carga, para poder deshacerla. En las de padrón también guarda categoría, rama, club y ciudad.';

-- ---------------------------------------------------------------------
-- Carga desde Excel. Copia de 20260919020000 con el modo 'padron'.
--
-- p_rows: [{ player_id, points, matches_played?, matches_won?, titles?,
--            new_player?, profile? }]
-- new_player (cuando player_id es null): { slug, first_name, last_name,
--            gender, category, club?, city? }
-- profile    (solo en 'padron'): { category, gender, club, city } — lo que el
--            archivo le corrige a un jugador que ya existe.
-- ---------------------------------------------------------------------
create or replace function public.apply_points_import(
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
  if p_mode not in ('reemplazar', 'sumar', 'padron') then
    raise exception 'Modo de carga inválido: %', p_mode;
  end if;
  if (
    select count(*) <> count(distinct r ->> 'player_id')
    from jsonb_array_elements(p_rows) r
    where r ->> 'player_id' is not null
  ) then
    raise exception 'Hay jugadores repetidos en la carga';
  end if;

  perform set_config(
    'app.points_reason',
    left('Carga: ' || coalesce(nullif(trim(p_label), ''), nullif(trim(p_file_name), ''), 'Excel'), 200),
    true
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'ranking_points', p.ranking_points,
    'matches_played', p.matches_played,
    'matches_won', p.matches_won,
    'titles', p.titles,
    'category', p.category,
    'gender', p.gender,
    'club', p.club,
    'city', p.city
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
      else coalesce(r.titles, p.titles) end,
    -- Solo el padrón corrige la ficha; las otras cargas son puntos y nada más.
    category = case
      when p_mode = 'padron' and coalesce(r.profile ->> 'category', '') <> ''
      then r.profile ->> 'category' else p.category end,
    gender = case
      when p_mode = 'padron' and (r.profile ->> 'gender') in ('masculino', 'femenino')
      then r.profile ->> 'gender' else p.gender end,
    -- Una celda vacía no borra lo que ya está: el padrón agrega y corrige,
    -- para vaciar un club se edita la ficha del jugador.
    club = case
      when p_mode = 'padron' and coalesce(r.profile ->> 'club', '') <> ''
      then r.profile ->> 'club' else p.club end,
    city = case
      when p_mode = 'padron' and coalesce(r.profile ->> 'city', '') <> ''
      then r.profile ->> 'city' else p.city end
  from jsonb_to_recordset(p_rows) as r(
    player_id bigint,
    points integer,
    matches_played integer,
    matches_won integer,
    titles integer,
    profile jsonb
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

-- ---------------------------------------------------------------------
-- Deshacer. Copia de 20260919020000 que también devuelve la categoría, la
-- rama, el club y la ciudad a como estaban. Solo en las cargas de padrón:
-- las viejas no guardaron esos datos.
-- ---------------------------------------------------------------------
create or replace function public.undo_last_points_import()
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

  perform set_config(
    'app.points_reason',
    left('Se deshizo la carga: ' || coalesce(v_import.label, v_import.file_name, 'Excel'), 200),
    true
  );

  update public.players p
  set
    ranking_points = prev.ranking_points,
    matches_played = prev.matches_played,
    matches_won = prev.matches_won,
    titles = prev.titles,
    category = case when v_import.mode = 'padron' and prev.category is not null
      then prev.category else p.category end,
    gender = case when v_import.mode = 'padron' and prev.gender is not null
      then prev.gender else p.gender end,
    club = case when v_import.mode = 'padron' then prev.club else p.club end,
    city = case when v_import.mode = 'padron' then prev.city else p.city end
  from jsonb_to_recordset(v_import.previous) as prev(
    id bigint,
    ranking_points integer,
    matches_played integer,
    matches_won integer,
    titles integer,
    category text,
    gender text,
    club text,
    city text
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

-- ---------------------------------------------------------------------
-- El ranking se lee siempre por rama + categoría + activos, y se ordena por
-- puntos. El índice de 20260915000000 solo cubría rama y puntos.
-- ---------------------------------------------------------------------
create index players_ranking_category_idx
  on public.players (gender, category, active, ranking_points desc);
