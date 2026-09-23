-- =====================================================================
-- La foto de la cuenta también vale en el ranking.
--
-- El padrón (players.photo_url) y la cuenta (profiles.avatar_url) son dos
-- fotos distintas, porque players es público y profiles no. Hasta ahora la
-- de la cuenta solo se veía en la página del jugador, con
-- get_player_account_avatar, que pide un jugador por vez: en una lista eso
-- es una consulta por fila. Esta versión trae las de muchos de una.
-- =====================================================================

create function public.player_account_photos(p_player_ids bigint[])
returns table (player_id bigint, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.player_id, p.avatar_url
  from public.profiles p
  where p.player_id = any(p_player_ids)
    and p.avatar_url is not null;
$$;

comment on function public.player_account_photos(bigint[]) is
  'Foto de la cuenta vinculada de cada jugador. Solo la foto: nunca email, teléfono ni nombre.';

revoke execute on function public.player_account_photos(bigint[]) from public;
grant execute on function public.player_account_photos(bigint[]) to anon, authenticated;
