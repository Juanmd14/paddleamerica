-- =====================================================================
-- Perfiles: usuario (@juangarcia) para invitar a la pareja, categoría del
-- jugador y foto de perfil subida por el propio usuario.
-- =====================================================================

alter table public.profiles
  add column username text,
  add column category smallint check (category between 1 and 8);

comment on column public.profiles.username is
  'Usuario público sin @ (minúsculas, números, punto y guion bajo).';
comment on column public.profiles.category is
  'Categoría declarada por el jugador: 1 = 1ra … 8 = 8va.';

-- "Juan García" → "juangarcia"; si ya existe, "juangarcia2", "juangarcia3"…
create function public.unique_username(p_base text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_base text;
  v_candidate text;
  v_suffix integer := 1;
begin
  v_base := left(regexp_replace(
    translate(
      lower(coalesce(p_base, '')),
      'áàäâãéèëêíìïîóòöôõúùüûñç',
      'aaaaaeeeeiiiiooooouuuunc'
    ),
    '[^a-z0-9]', '', 'g'
  ), 16);
  if char_length(v_base) < 3 then
    v_base := 'jugador';
  end if;

  v_candidate := v_base;
  while exists (select 1 from public.profiles p where p.username = v_candidate) loop
    v_suffix := v_suffix + 1;
    v_candidate := v_base || v_suffix;
  end loop;
  return v_candidate;
end;
$$;

revoke execute on function public.unique_username(text) from public, anon, authenticated;

do $$
declare
  v_profile record;
begin
  for v_profile in
    select id, full_name, email from public.profiles where username is null order by created_at
  loop
    update public.profiles
    set username = public.unique_username(
      coalesce(nullif(v_profile.full_name, ''), split_part(v_profile.email, '@', 1))
    )
    where id = v_profile.id;
  end loop;
end;
$$;

alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_format
    check (username ~ '^[a-z0-9][a-z0-9_.]{2,19}$'),
  add constraint profiles_username_key unique (username);

-- Al registrarse, el usuario sale del nombre (o del email).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  );
begin
  for v_attempt in 1..5 loop
    begin
      insert into public.profiles (id, full_name, avatar_url, email, username)
      values (
        new.id,
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'avatar_url',
        new.email,
        public.unique_username(v_base)
      );
      return new;
    exception when unique_violation then
      -- Dos registros simultáneos con el mismo nombre: probamos otro sufijo.
      v_base := v_base || floor(random() * 90 + 10)::text;
    end;
  end loop;
  raise exception 'No se pudo crear el usuario';
end;
$$;

grant update (username, category) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Datos públicos de otros jugadores (para invitar a la pareja).
-- Nunca devuelven email ni teléfono.
-- ---------------------------------------------------------------------
create function public.search_profiles(p_query text)
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  category smallint
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select translate(
      lower(ltrim(trim(coalesce(p_query, '')), '@')),
      'áàäâãéèëêíìïîóòöôõúùüûñç',
      'aaaaaeeeeiiiiooooouuuunc'
    ) as term
  )
  select p.id, p.username, p.full_name, p.avatar_url, p.category
  from public.profiles p, q
  where (select auth.uid()) is not null
    and p.id <> (select auth.uid())
    and char_length(q.term) >= 2
    and (
      starts_with(p.username, q.term)
      or strpos(
        translate(lower(coalesce(p.full_name, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
        q.term
      ) > 0
    )
  order by starts_with(p.username, q.term) desc, p.username
  limit 8;
$$;

create function public.get_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  category smallint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.full_name, p.avatar_url, p.category
  from public.profiles p
  where (select auth.uid()) is not null
    and p.id = any (p_ids);
$$;

revoke execute on function public.search_profiles(text) from public, anon;
revoke execute on function public.get_public_profiles(uuid[]) from public, anon;
grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;

-- ---------------------------------------------------------------------
-- Foto de perfil: cada usuario sube, ve y borra solo su carpeta
-- media/perfiles/<su id>/
-- ---------------------------------------------------------------------
create policy "Usuarios suben su foto de perfil"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'perfiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "Usuarios ven sus fotos de perfil"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'perfiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "Usuarios borran sus fotos de perfil"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'perfiles'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
