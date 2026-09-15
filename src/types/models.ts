import type { Tables } from "./database.types";

export type Player = Tables<"players">;
export type Tournament = Tables<"tournaments">;
export type NewsArticle = Tables<"news">;
export type Profile = Tables<"profiles">;
