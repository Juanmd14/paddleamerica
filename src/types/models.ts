import type { Tables } from "./database.types";

export type Player = Tables<"players">;
export type Tournament = Tables<"tournaments">;
export type NewsArticle = Tables<"news">;
export type Profile = Tables<"profiles">;
export type Registration = Tables<"tournament_registrations">;
export type RegistrationWithTournament = Registration & {
  tournament: Tournament;
};
export type RegistrationWithProfile = Registration & {
  profile: Pick<Profile, "full_name" | "email" | "phone"> | null;
};
export type Notification = Tables<"notifications">;
export type RankingImport = Tables<"ranking_imports">;
