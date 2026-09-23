-- =====================================================================
-- Fotos dentro de la noticia, además de la portada.
--
-- Van en una columna jsonb y no en una tabla aparte porque se cargan y se
-- guardan con la nota, en el mismo formulario: una noticia nueva todavía no
-- tiene id al que colgarle las fotos. El orden es el del array.
--
-- Cada foto es { "url": "...", "caption": "..." } y la url tiene que ser de
-- nuestro Storage (bucket media), igual que la portada y el álbum del club.
-- =====================================================================

create function public.is_valid_news_photos(p_photos jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_photos) = 'array'
    and jsonb_array_length(p_photos) <= 30
    and not exists (
      select 1
      from jsonb_array_elements(p_photos) as photo
      where jsonb_typeof(photo) <> 'object'
        or photo ->> 'url' is null
        or photo ->> 'url' !~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/media/'
        or char_length(coalesce(photo ->> 'caption', '')) > 140
    );
$$;

alter table public.news
  add column photos jsonb not null default '[]'::jsonb
  check (public.is_valid_news_photos(photos));

comment on column public.news.photos is
  'Fotos de la nota, en orden: [{ "url": "...", "caption": "..." }]. La portada sigue siendo cover_url.';

-- Las noticias ya tienen su política de lectura pública y de escritura solo
-- para admins: la columna nueva entra en las mismas.
