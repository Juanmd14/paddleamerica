-- =====================================================================
-- Lista de espera para torneos con el cupo lleno.
--
-- Cada persona se anota sola (sin pareja), y solo si su rama y su categoría
-- le permiten jugar el torneo. Cuando se libera un lugar
-- (cancelación, rechazo o "Liberar"), un trigger le avisa al primero de la
-- lista que todavía no fue avisado; si se liberan dos lugares, a los dos
-- primeros. El lugar no queda reservado: gana el primero que se anota.
-- Al anotarse al torneo, la persona sale sola de la lista.
-- =====================================================================

create table public.tournament_waitlist (
  tournament_id bigint not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Cuándo se le avisó que se liberó un lugar (null: todavía no).
  notified_at timestamptz,
  primary key (tournament_id, user_id)
);

create index tournament_waitlist_order_idx
  on public.tournament_waitlist (tournament_id, created_at);

alter table public.tournament_waitlist enable row level security;

create policy "Cada usuario ve sus lugares en listas de espera"
  on public.tournament_waitlist for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Sin insert/update/delete directos: se entra y se sale con las funciones.
grant select on public.tournament_waitlist to authenticated;

-- ---------------------------------------------------------------------
-- Entrar y salir
-- ---------------------------------------------------------------------
create function public.join_waitlist(p_tournament_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_tournament public.tournaments;
  v_category smallint;
  v_gender text;
  v_error text;
begin
  if v_uid is null then
    raise exception 'sin_sesion';
  end if;

  select * into v_tournament
  from public.tournaments
  where id = p_tournament_id;
  if not found or v_tournament.status <> 'inscripciones' then
    raise exception 'inscripciones_cerradas';
  end if;
  if v_tournament.capacity is null
     or public.tournament_taken(p_tournament_id) < v_tournament.capacity then
    raise exception 'hay_lugar';
  end if;
  if public.is_in_tournament(p_tournament_id, v_uid) then
    raise exception 'ya_anotado';
  end if;

  -- Solo puede esperar un lugar quien podría jugarlo: mismas reglas de rama y
  -- categoría que al anotarse, pero de la persona sola (la pareja se ve después).
  select p.category, p.gender into v_category, v_gender
  from public.profiles p
  where p.id = v_uid;

  v_error := public.pair_gender_error(v_tournament, v_gender, v_gender);
  if v_error in ('falta_rama', 'rama_no_corresponde') then
    raise exception '%', v_error;
  end if;

  if v_tournament.category_min is not null or v_tournament.category_sum is not null then
    if v_category is null then
      raise exception 'falta_categoria';
    end if;
    if v_tournament.category_min is not null
       and v_tournament.category_max is not null
       and (v_category < v_tournament.category_min
            or v_category > v_tournament.category_max) then
      raise exception 'categoria_fuera_de_rango';
    end if;
  end if;

  insert into public.tournament_waitlist (tournament_id, user_id)
  values (p_tournament_id, v_uid)
  on conflict do nothing;
end;
$$;

create function public.leave_waitlist(p_tournament_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.tournament_waitlist
  where tournament_id = p_tournament_id
    and user_id = (select auth.uid());
$$;

-- Puesto del usuario en la lista (1 = primero), o null si no está.
create function public.my_waitlist_position(p_tournament_id bigint)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select count(*)::integer
    from public.tournament_waitlist w
    where w.tournament_id = me.tournament_id
      and (w.created_at, w.user_id) <= (me.created_at, me.user_id)
  )
  from public.tournament_waitlist me
  where me.tournament_id = p_tournament_id
    and me.user_id = (select auth.uid());
$$;

-- Cuántos esperan. Solo para el admin y el dueño del club del torneo.
create function public.tournament_waitlist_count(p_tournament_id bigint)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.tournament_waitlist w
  join public.tournaments t on t.id = w.tournament_id
  where w.tournament_id = p_tournament_id
    and (
      public.is_admin()
      or (t.club_id is not null and public.is_club_owner(t.club_id))
    );
$$;

revoke execute on function public.join_waitlist(bigint) from public, anon;
revoke execute on function public.leave_waitlist(bigint) from public, anon;
revoke execute on function public.my_waitlist_position(bigint) from public, anon;
revoke execute on function public.tournament_waitlist_count(bigint) from public, anon;
grant execute on function public.join_waitlist(bigint) to authenticated;
grant execute on function public.leave_waitlist(bigint) to authenticated;
grant execute on function public.my_waitlist_position(bigint) to authenticated;
grant execute on function public.tournament_waitlist_count(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Aviso cuando se libera un lugar
-- ---------------------------------------------------------------------
create function public.notify_waitlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tournament public.tournaments;
  v_free integer;
begin
  -- Solo importa si la inscripción ocupaba lugar y dejó de ocuparlo.
  if old.status not in ('pendiente', 'confirmada') then
    return null;
  end if;
  if tg_op = 'UPDATE' and new.status in ('pendiente', 'confirmada') then
    return null;
  end if;

  select * into v_tournament
  from public.tournaments
  where id = old.tournament_id;
  if not found
     or v_tournament.status <> 'inscripciones'
     or v_tournament.capacity is null then
    return null;
  end if;

  -- Lugares libres menos los que ya se avisaron y todavía siguen en la lista.
  v_free := v_tournament.capacity
    - public.tournament_taken(v_tournament.id)
    - (
      select count(*)::integer
      from public.tournament_waitlist w
      where w.tournament_id = v_tournament.id
        and w.notified_at is not null
    );
  if v_free <= 0 then
    return null;
  end if;

  with next_in_line as (
    select w.user_id
    from public.tournament_waitlist w
    where w.tournament_id = v_tournament.id
      and w.notified_at is null
    order by w.created_at, w.user_id
    limit v_free
    for update
  ),
  marked as (
    update public.tournament_waitlist w
    set notified_at = now()
    from next_in_line n
    where w.tournament_id = v_tournament.id
      and w.user_id = n.user_id
    returning w.user_id
  )
  insert into public.notifications (user_id, title, body, href)
  select
    m.user_id,
    'Se liberó un lugar en el ' || v_tournament.name,
    'Estabas en la lista de espera. Anotate con tu pareja antes de que lo ocupe otro.',
    '/torneos/' || v_tournament.slug || '#inscripcion'
  from marked m;

  return null;
end;
$$;

-- Al anotarse (como jugador o como pareja), sale de la lista de espera.
create function public.leave_waitlist_on_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.tournament_waitlist
  where tournament_id = new.tournament_id
    and user_id in (new.user_id, new.partner_id);
  return null;
end;
$$;

revoke execute on function public.notify_waitlist() from public, anon, authenticated;
revoke execute on function public.leave_waitlist_on_registration() from public, anon, authenticated;

create trigger tournament_registrations_notify_waitlist
  after update of status or delete on public.tournament_registrations
  for each row execute function public.notify_waitlist();

create trigger tournament_registrations_leave_waitlist
  after insert on public.tournament_registrations
  for each row execute function public.leave_waitlist_on_registration();
