import type { Tables } from "./database.types";

export type Player = Tables<"players">;
export type Tournament = Tables<"tournaments">;
export type NewsArticle = Tables<"news">;
export type Profile = Tables<"profiles">;
export type Registration = Tables<"tournament_registrations">;
/** Lo que cualquier usuario logueado puede ver de otro (nunca email ni teléfono). */
export type PublicProfile = Pick<
  Profile,
  "id" | "username" | "full_name" | "avatar_url" | "category" | "gender"
>;
/** Inscripción con los dos jugadores: quien se anotó y la pareja invitada. */
export type RegistrationWithPeople = Registration & {
  player: PublicProfile | null;
  partner: PublicProfile | null;
};
export type RegistrationWithTournament = RegistrationWithPeople & {
  tournament: Tournament;
};
/** Para el panel: incluye email y teléfono de los dos. */
export type AdminProfile = PublicProfile & Pick<Profile, "email" | "phone">;
export type RegistrationWithProfile = Registration & {
  profile: AdminProfile | null;
  partnerProfile: AdminProfile | null;
};
export type Notification = Tables<"notifications">;
export type RankingImport = Tables<"ranking_imports">;
export type PlayerPointChange = Tables<"player_point_changes">;
export type Club = Tables<"clubs">;
/** Una pareja confirmada, tal como se ve en la página del torneo. */
export type ConfirmedPair = {
  id: number;
  player: { name: string; avatarUrl: string | null; slug: string | null };
  partner: { name: string; avatarUrl: string | null; slug: string | null };
};
/** Un torneo que jugó un jugador del ranking, con quién lo jugó. */
export type PlayedTournament = {
  tournament: Tournament;
  partnerName: string;
  partnerSlug: string | null;
};
