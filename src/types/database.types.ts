// Tipos de la base de datos. Escritos a mano a partir de supabase/migrations.
// Cuando tengas el proyecto linkeado, regeneralos con: npm run db:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      news: {
        Row: {
          author: string | null;
          body: string;
          cover_url: string | null;
          created_at: string;
          excerpt: string | null;
          id: number;
          is_published: boolean;
          published_at: string;
          slug: string;
          tag: string | null;
          title: string;
        };
        Insert: {
          author?: string | null;
          body: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: never;
          is_published?: boolean;
          published_at?: string;
          slug: string;
          tag?: string | null;
          title: string;
        };
        Update: {
          author?: string | null;
          body?: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: never;
          is_published?: boolean;
          published_at?: string;
          slug?: string;
          tag?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          bio: string | null;
          category: string;
          city: string | null;
          club: string | null;
          created_at: string;
          first_name: string;
          gender: string;
          id: number;
          last_name: string;
          matches_played: number;
          matches_won: number;
          photo_url: string | null;
          ranking_points: number;
          side: string | null;
          slug: string;
          titles: number;
        };
        Insert: {
          bio?: string | null;
          category: string;
          city?: string | null;
          club?: string | null;
          created_at?: string;
          first_name: string;
          gender: string;
          id?: never;
          last_name: string;
          matches_played?: number;
          matches_won?: number;
          photo_url?: string | null;
          ranking_points?: number;
          side?: string | null;
          slug: string;
          titles?: number;
        };
        Update: {
          bio?: string | null;
          category?: string;
          city?: string | null;
          club?: string | null;
          created_at?: string;
          first_name?: string;
          gender?: string;
          id?: never;
          last_name?: string;
          matches_played?: number;
          matches_won?: number;
          photo_url?: string | null;
          ranking_points?: number;
          side?: string | null;
          slug?: string;
          titles?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          category: string;
          champions: string | null;
          city: string;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          ends_on: string;
          gender: string;
          id: number;
          name: string;
          prize: string | null;
          slug: string;
          starts_on: string;
          status: string;
          venue: string | null;
        };
        Insert: {
          category: string;
          champions?: string | null;
          city: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_on: string;
          gender: string;
          id?: never;
          name: string;
          prize?: string | null;
          slug: string;
          starts_on: string;
          status?: string;
          venue?: string | null;
        };
        Update: {
          category?: string;
          champions?: string | null;
          city?: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_on?: string;
          gender?: string;
          id?: never;
          name?: string;
          prize?: string | null;
          slug?: string;
          starts_on?: string;
          status?: string;
          venue?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
