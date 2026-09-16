-- Datos de ejemplo (los mismos que src/lib/demo-data.ts)

insert into public.players
  (slug, first_name, last_name, city, club, category, gender, side, ranking_points, matches_played, matches_won, titles, bio)
values
  ('martin-gomez', 'Martín', 'Gómez', 'América', 'Complejo El Remate', '6ta', 'masculino', 'drive', 2480, 38, 29, 4, 'Número uno del ranking regional. Drive agresivo, juega en pareja con Nicolás Ibarra desde 2024.'),
  ('lucas-ferreyra', 'Lucas', 'Ferreyra', 'Trenque Lauquen', 'Pádel Norte', '6ta', 'masculino', 'reves', 2315, 35, 25, 3, 'Especialista en la bandeja y la víbora. Campeón del Clásico del Oeste 2026.'),
  ('tomas-aguirre', 'Tomás', 'Aguirre', 'Pehuajó', 'Bandeja Club', '7ma', 'masculino', 'drive', 2140, 33, 22, 2, 'La revelación de la temporada: subió de 8va a 7ma en un año.'),
  ('nicolas-ibarra', 'Nicolás', 'Ibarra', 'América', 'Complejo El Remate', '7ma', 'masculino', 'reves', 1985, 30, 19, 1, 'Revés sólido y mucha lectura de juego. Compañero de Martín Gómez.'),
  ('franco-medina', 'Franco', 'Medina', 'General Villegas', 'La Blindex', '8va', 'masculino', 'drive', 1720, 28, 16, 1, 'Fijo en todos los torneos del circuito desde hace tres temporadas.'),
  ('joaquin-sosa', 'Joaquín', 'Sosa', 'Salliqueló', 'Pádel Oeste', '8va', 'masculino', 'reves', 1590, 26, 14, 0, 'Debutó en el circuito en 2025 y ya pelea los primeros puestos de 8va.'),
  ('camila-rodriguez', 'Camila', 'Rodríguez', 'América', 'Bandeja Club', '6ta', 'femenino', 'reves', 2390, 36, 28, 5, 'Líder del ranking femenino con cinco títulos regionales.'),
  ('sofia-benitez', 'Sofía', 'Benítez', 'Trenque Lauquen', 'Pádel Norte', '6ta', 'femenino', 'drive', 2270, 34, 24, 3, 'Drive potente y gran definición por arriba. Finalista de la Copa Aniversario.'),
  ('valentina-castro', 'Valentina', 'Castro', 'Pehuajó', 'La Blindex', '7ma', 'femenino', 'reves', 2050, 31, 21, 2, 'Campeona de la Copa Aniversario 2026 junto a Florencia Molina.'),
  ('florencia-molina', 'Florencia', 'Molina', 'Carlos Tejedor', 'Pádel Oeste', '7ma', 'femenino', 'drive', 1890, 29, 18, 1, 'Campeona de la Copa Aniversario 2026 y referente del pádel en Carlos Tejedor.'),
  ('julieta-paz', 'Julieta', 'Paz', 'América', 'Complejo El Remate', '8va', 'femenino', 'reves', 1705, 27, 15, 1, 'Juega en América desde chica y es una de las promesas del circuito.'),
  ('agustina-rios', 'Agustina', 'Ríos', 'General Villegas', 'Bandeja Club', '8va', 'femenino', 'drive', 1560, 25, 13, 0, 'Constancia pura: no se perdió ningún torneo de la temporada.'),
  ('ezequiel-navarro', 'Ezequiel', 'Navarro', 'América', 'Complejo El Remate', '8va', 'masculino', 'drive', 1480, 24, 12, 0, 'Arrancó a jugar en 2026 y no se pierde una fecha del circuito.'),
  ('gaston-peralta', 'Gastón', 'Peralta', 'Trenque Lauquen', 'Pádel Norte', '8va', 'masculino', 'reves', 1345, 22, 11, 0, 'Revés paciente. Juega siempre con Ezequiel Navarro.'),
  ('rodrigo-cabrera', 'Rodrigo', 'Cabrera', 'Pehuajó', 'Bandeja Club', '8va', 'masculino', 'drive', 1210, 20, 9, 0, 'Viene del tenis y se está acostumbrando a jugar con las paredes.'),
  ('leandro-britos', 'Leandro', 'Britos', 'General Villegas', 'La Blindex', '8va', 'masculino', 'reves', 1075, 18, 7, 0, 'El más regular de los que arrancaron este año en La Blindex.'),
  ('matias-olivera', 'Matías', 'Olivera', 'Salliqueló', 'Pádel Oeste', '8va', 'masculino', 'drive', 940, 16, 6, 0, 'Debutó en el Abierto de Primavera y sumó sus primeros puntos.'),
  ('santiago-ferrari', 'Santiago', 'Ferrari', 'América', 'Complejo El Remate', '8va', 'masculino', 'reves', 820, 14, 4, 0, 'Juega los martes a la noche y se anotó a su primer torneo.'),
  ('micaela-duarte', 'Micaela', 'Duarte', 'América', 'Complejo El Remate', '8va', 'femenino', 'drive', 1395, 23, 11, 0, 'Empezó en la escuelita del club y ya juega todos los torneos.'),
  ('lucia-ferreyra', 'Lucía', 'Ferreyra', 'Trenque Lauquen', 'Pádel Norte', '8va', 'femenino', 'reves', 1150, 19, 8, 0, 'Hermana de Lucas Ferreyra. Arrancó en 2026 y sube rápido.'),
  ('diego-sanchez', 'Diego', 'Sánchez', 'General Villegas', 'La Blindex', '5ta', 'masculino', 'drive', 2210, 34, 24, 2, 'El de más experiencia del circuito: juega desde que abrió La Blindex.'),
  ('pablo-iriarte', 'Pablo', 'Iriarte', 'Pehuajó', 'Bandeja Club', '5ta', 'masculino', 'reves', 2035, 31, 21, 1, 'Bandeja prolija y mucho oficio. Compañero de Diego Sánchez.');

-- Fotos de los cuatro del podio. Son los recortes de la maqueta original que
-- genera scripts/cortar-cancha.mjs en public/fotos. Cuando estén las fotos
-- reales, se suben a Supabase Storage y se reemplazan estas URLs.
update public.players set photo_url = '/fotos/' || slug || '.jpg'
where slug in ('martin-gomez', 'lucas-ferreyra', 'tomas-aguirre', 'nicolas-ibarra');

insert into public.tournaments
  (slug, name, description, city, venue, starts_on, ends_on, category, gender, status, prize, champions)
values
  ('abierto-de-primavera-2026', 'Abierto de Primavera',
   E'El torneo que abre la temporada de primavera en América. Tres días de pádel en las canchas del Complejo El Remate, con cuadros de 1ra y 2da masculino y puntos para el ranking regional.\n\nLas parejas se arman libremente. Cupo limitado a 24 parejas por categoría.',
   'América', 'Complejo El Remate', '2026-10-09', '2026-10-11', '6ta y 7ma', 'masculino', 'inscripciones', '$1.500.000 en premios', null),
  ('copa-ciudad-de-trenque-lauquen-2026', 'Copa Ciudad de Trenque Lauquen',
   E'Torneo femenino de 3ra a 5ta categoría con fase de grupos y playoffs. Ideal para jugadoras que quieren sumar sus primeros puntos en el ranking.\n\nIncluye cena de camaradería el sábado a la noche.',
   'Trenque Lauquen', 'Pádel Norte', '2026-10-23', '2026-10-25', '6ta a 8va', 'femenino', 'inscripciones', 'Trofeos y $800.000 en premios', null),
  ('torneo-mixto-nocturno-2026', 'Torneo Mixto Nocturno',
   E'Partidos de 20 a 2 h en la nueva cancha panorámica de Bandeja Club. Parejas mixtas, categoría suma 13.\n\nLas inscripciones abren el 20 de octubre.',
   'Pehuajó', 'Bandeja Club', '2026-11-13', '2026-11-14', 'Suma 13', 'mixto', 'proximo', null, null),
  ('master-de-fin-de-ano-2026', 'Master de Fin de Año',
   E'Los 8 mejores jugadores del ranking masculino se enfrentan en el cierre de la temporada. Formato round robin y final el domingo.\n\nEntrada libre y gratuita para el público.',
   'América', 'Complejo El Remate', '2026-12-11', '2026-12-13', 'Top 8 del ranking', 'masculino', 'proximo', '$3.000.000 en premios', null),
  ('clasico-del-oeste-2026', 'Clásico del Oeste',
   'El clásico de mitad de año, con parejas de toda la región en Carlos Tejedor.',
   'Carlos Tejedor', 'Polideportivo Municipal', '2026-06-12', '2026-06-14', '6ta', 'masculino', 'finalizado', null, 'Ferreyra / Aguirre'),
  ('invierno-padel-tour-2026', 'Invierno Pádel Tour',
   'Fecha única del tour de invierno, con 20 parejas de 1ra categoría de toda la zona.',
   'General Villegas', 'La Blindex', '2026-07-17', '2026-07-19', '6ta', 'masculino', 'finalizado', null, 'Gómez / Ibarra'),
  ('copa-aniversario-padel-oeste-2026', 'Copa Aniversario Pádel Oeste',
   'Torneo femenino por el aniversario de Pádel Oeste, con cuadros de 2da y 3ra.',
   'Salliqueló', 'Pádel Oeste', '2026-08-14', '2026-08-16', '7ma y 8va', 'femenino', 'finalizado', null, 'Castro / Molina');

-- Ubicación, cupos y apertura de inscripciones
update public.tournaments t
set address = v.address, capacity = v.capacity, registration_opens_on = v.opens
from (values
  ('abierto-de-primavera-2026', 'América, Rivadavia, Buenos Aires', 24, null::date),
  ('copa-ciudad-de-trenque-lauquen-2026', 'Trenque Lauquen, Buenos Aires', 16, null::date),
  ('torneo-mixto-nocturno-2026', 'Pehuajó, Buenos Aires', 20, date '2026-10-20'),
  ('master-de-fin-de-ano-2026', 'América, Rivadavia, Buenos Aires', null, null::date),
  ('clasico-del-oeste-2026', 'Carlos Tejedor, Buenos Aires', null, null::date),
  ('invierno-padel-tour-2026', 'General Villegas, Buenos Aires', null, null::date),
  ('copa-aniversario-padel-oeste-2026', 'Salliqueló, Buenos Aires', null, null::date)
) as v(slug, address, capacity, opens)
where t.slug = v.slug;

-- Destacados en el inicio y reglas de categoría (1 = 1ra … 8 = 8va)
update public.tournaments t
set
  featured = v.featured,
  sponsor_name = v.sponsor,
  category_min = v.min,
  category_max = v.max,
  category_sum = v.sum
from (values
  ('abierto-de-primavera-2026', 'principal'::text, null::text, 6::smallint, 7::smallint, null::smallint),
  ('copa-ciudad-de-trenque-lauquen-2026', null, null, 6, 8, null),
  ('torneo-mixto-nocturno-2026', 'sponsor', 'Bandeja Club', null, null, 13),
  ('master-de-fin-de-ano-2026', null, null, null, null, null),
  ('clasico-del-oeste-2026', null, null, 6, 6, null),
  ('invierno-padel-tour-2026', null, null, 6, 6, null),
  ('copa-aniversario-padel-oeste-2026', null, null, 7, 8, null)
) as v(slug, featured, sponsor, min, max, sum)
where t.slug = v.slug;

insert into public.news
  (slug, title, excerpt, body, tag, author, published_at)
values
  ('inscripciones-abierto-de-primavera',
   'Abrieron las inscripciones para el Abierto de Primavera',
   'Del 9 al 11 de octubre en el Complejo El Remate de América, con cuadros de 1ra y 2da masculino y $1.500.000 en premios.',
   E'Ya están abiertas las inscripciones para el Abierto de Primavera, el torneo que da inicio a la segunda mitad de la temporada del circuito regional. Se jugará del 9 al 11 de octubre en las canchas del Complejo El Remate, en América.\n\nHabrá cuadros de 1ra y 2da categoría masculina, con un cupo de 24 parejas por categoría. El torneo reparte $1.500.000 en premios y suma puntos para el ranking regional.\n\nPara anotarte, creá tu cuenta en el sitio y completá la inscripción desde la página del torneo.',
   'Torneos', 'Redacción PaddleAmerica', '2026-09-10 15:00:00+00'),
  ('bandeja-club-estrena-cancha-panoramica',
   'Bandeja Club estrena cancha panorámica en Pehuajó',
   'Es la primera cancha 100% de vidrio de la zona y va a ser sede del Torneo Mixto Nocturno.',
   E'Bandeja Club inauguró su nueva cancha panorámica, la primera de la región con paredes completamente de vidrio y sin columnas en los laterales.\n\nLa cancha cuenta con iluminación LED y gradas para 120 personas, y será la sede del Torneo Mixto Nocturno de noviembre.',
   'Clubes', 'Redacción PaddleAmerica', '2026-09-05 13:00:00+00'),
  ('ranking-despues-de-agosto',
   'Así quedó el ranking regional después de agosto',
   'Martín Gómez y Camila Rodríguez siguen al frente. Tomás Aguirre, la gran sorpresa del mes.',
   E'Con los puntos de la Copa Aniversario ya sumados, se actualizó el ranking regional. Martín Gómez sigue siendo el número uno en masculino y Camila Rodríguez lidera el femenino por segundo mes consecutivo.\n\nEl gran salto lo dio Tomás Aguirre, que tras ganar el Clásico del Oeste junto a Lucas Ferreyra ya es tercero en el ranking masculino.\n\nEl próximo movimiento llegará después del Abierto de Primavera, en octubre.',
   'Ranking', 'Redacción PaddleAmerica', '2026-09-01 12:00:00+00'),
  ('castro-molina-campeonas-copa-aniversario',
   'Castro y Molina, campeonas de la Copa Aniversario',
   'Vencieron en la final a Rodríguez y Benítez en un partido que se definió en el tercer set.',
   E'Valentina Castro y Florencia Molina se quedaron con la Copa Aniversario de Pádel Oeste tras vencer en la final a Camila Rodríguez y Sofía Benítez por 6-4, 3-6 y 7-5.\n\nFue el primer título de la temporada para la pareja, que venía de perder dos semifinales seguidas. Con este resultado, ambas suben posiciones en el ranking femenino.',
   'Torneos', 'Redacción PaddleAmerica', '2026-08-17 10:00:00+00'),
  ('gomez-ibarra-campeones-invierno-padel-tour',
   'Gómez e Ibarra ganaron el Invierno Pádel Tour',
   'La pareja de América no perdió ningún set en todo el torneo disputado en General Villegas.',
   E'Martín Gómez y Nicolás Ibarra fueron los campeones del Invierno Pádel Tour, que reunió a 20 parejas de 1ra categoría en las canchas de La Blindex, en General Villegas.\n\nEn la final superaron a Lucas Ferreyra y Tomás Aguirre por 6-3 y 6-2, cerrando un torneo en el que no cedieron ningún set.',
   'Torneos', 'Redacción PaddleAmerica', '2026-07-20 10:00:00+00');
