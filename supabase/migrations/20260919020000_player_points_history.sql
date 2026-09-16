-- =====================================================================
-- Historial de puntos del ranking: cada cambio de ranking_points queda
-- registrado (carga de Excel, corrección, edición). Sirve para mostrar
-- "+23 en el último mes" y cuántos puestos subió cada jugador en 7 días.
-- =====================================================================

create table public.player_point_changes (
  id bigint generated always as identity primary key,
  player_id bigint not null references public.players (id) on delete cascade,
  delta integer not null check (delta <> 0),
  points_after integer not null,
  reason text check (char_length(reason) <= 200),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index player_point_changes_player_idx
  on public.player_point_changes (player_id, created_at desc);
create index player_point_changes_created_idx
  on public.player_point_changes (created_at desc);

alter table public.player_point_changes enable row level security;

create policy "Cambios de puntos visibles para todos"
  on public.player_point_changes for select to anon, authenticated
  using (true);

grant select on public.player_point_changes to anon, authenticated;

-- El motivo llega por app.points_reason (set_config local a la transacción).
-- Un jugador creado sin motivo (desde el formulario) no cuenta como "ganó puntos".
create function public.log_player_points_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := nullif(current_setting('app.points_reason', true), '');
  v_delta integer;
begin
  if tg_op = 'INSERT' then
    if v_reason is null or new.ranking_points = 0 then
      return new;
    end if;
    v_delta := new.ranking_points;
  else
    v_delta := new.ranking_points - old.ranking_points;
    if v_delta = 0 then
      return new;
    end if;
  end if;

  insert into public.player_point_changes (player_id, delta, points_after, reason)
  values (new.id, v_delta, new.ranking_points, coalesce(v_reason, 'Edición del jugador'));
  return new;
end;
$$;

create trigger players_log_points_change
  after insert or update of ranking_points on public.players
  for each row execute function public.log_player_points_change();

-- ---------------------------------------------------------------------
-- Corrección manual: suma o resta puntos con un motivo.
-- ---------------------------------------------------------------------
create function public.adjust_player_points(
  p_player_id bigint,
  p_delta integer,
  p_reason text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden corregir puntos' using errcode = '42501';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'sin_cambio' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 3 and 150 then
    raise exception 'motivo_invalido' using errcode = 'P0001';
  end if;

  perform set_config('app.points_reason', 'Corrección: ' || trim(p_reason), true);

  update public.players
  set ranking_points = ranking_points + p_delta
  where id = p_player_id
  returning ranking_points into v_total;

  if not found then
    raise exception 'jugador_no_existe' using errcode = 'P0001';
  end if;
  if v_total < 0 then
    raise exception 'puntos_negativos' using errcode = 'P0001';
  end if;
  return v_total;
end;
$$;

revoke execute on function public.adjust_player_points(bigint, integer, text) from public, anon;
grant execute on function public.adjust_player_points(bigint, integer, text) to authenticated;

-- ---------------------------------------------------------------------
-- Cargas de Excel: igual que antes, pero dejan el motivo en el historial.
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
