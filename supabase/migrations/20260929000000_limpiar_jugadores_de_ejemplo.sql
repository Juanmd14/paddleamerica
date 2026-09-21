-- =====================================================================
-- Vaciar el ranking antes de cargar el padrón de verdad.
--
-- La base traía los jugadores de ejemplo de seed.sql y los que se fueron
-- sumando probando. Se van todos menos los dos reales que ya estaban
-- cargados a mano: Agustín Jampi y Brian Duarte.
--
-- Se lleva en cascada el historial de puntos de cada uno
-- (player_point_changes) y deja en null el profiles.player_id de las cuentas
-- que estuvieran vinculadas a alguno: esas cuentas conservan su categoría y
-- su rama, y se vuelven a vincular desde Panel → Usuarios.
-- =====================================================================

delete from public.players
where slug not in ('agustin-jampi', 'brian-duarte');

-- Las cargas viejas quedaron apuntando a jugadores que ya no existen: si no
-- se cierran, el panel sigue ofreciendo "Deshacer" una carga que no puede
-- volver atrás.
update public.ranking_imports
set undone_at = now()
where undone_at is null;
