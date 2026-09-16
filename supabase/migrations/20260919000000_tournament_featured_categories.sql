-- =====================================================================
-- Torneos: destacado en el inicio (principal o sponsoreado) y categorías
-- con reglas (rango "6ta a 8va" o suma "Suma 13") para validar quién se anota.
-- =====================================================================

alter table public.tournaments
  add column featured text check (featured in ('principal', 'sponsor')),
  add column sponsor_name text check (char_length(sponsor_name) <= 80),
  -- Categorías numeradas: 1 = 1ra (la más alta) … 8 = 8va.
  add column category_min smallint check (category_min between 1 and 8),
  add column category_max smallint check (category_max between 1 and 8),
  -- Suma mínima de las categorías de la pareja (Suma 13: 6ta + 7ma).
  add column category_sum smallint check (category_sum between 2 and 16),
  add constraint tournaments_category_rules_check check (
    (category_min is null) = (category_max is null)
    and (category_min is null or category_min <= category_max)
    and (category_min is null or category_sum is null)
  );

comment on column public.tournaments.featured is
  'principal o sponsor: se muestra destacado en el inicio. Null = normal.';
comment on column public.tournaments.category_min is
  'Categoría más alta que puede jugar (1 = 1ra). Null = sin rango.';
comment on column public.tournaments.category_max is
  'Categoría más baja que puede jugar (8 = 8va). Null = sin rango.';
comment on column public.tournaments.category_sum is
  'Suma mínima de categorías de la pareja. Null = no es un torneo de suma.';

-- Reglas a partir del texto que ya tenían los torneos.
update public.tournaments
set category_sum = (regexp_match(lower(category), '^suma\s*(\d{1,2})$'))[1]::smallint
where lower(category) ~ '^suma\s*\d{1,2}$'
  and (regexp_match(lower(category), '^suma\s*(\d{1,2})$'))[1]::integer between 2 and 16;

update public.tournaments
set
  category_min = least(m[1]::smallint, m[2]::smallint),
  category_max = greatest(m[1]::smallint, m[2]::smallint)
from (
  select id, regexp_match(
    lower(category),
    '^(?:categor[ií]as?\s+)?([1-8])(?:ra|da|ta|ma|va)\s+(?:y|a|al)\s+([1-8])(?:ra|da|ta|ma|va)$'
  ) as m
  from public.tournaments
) parsed
where parsed.id = tournaments.id and parsed.m is not null;

update public.tournaments
set
  category_min = m[1]::smallint,
  category_max = m[1]::smallint
from (
  select id, regexp_match(
    lower(category),
    '^(?:categor[ií]a\s+)?([1-8])(?:ra|da|ta|ma|va)$'
  ) as m
  from public.tournaments
) parsed
where parsed.id = tournaments.id and parsed.m is not null;
