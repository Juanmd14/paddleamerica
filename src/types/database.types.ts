export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      club_owners: {
        Row: {
          club_id: number
          created_at: string
          user_id: string
        }
        Insert: {
          club_id: number
          created_at?: string
          user_id: string
        }
        Update: {
          club_id?: number
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_owners_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_photos: {
        Row: {
          caption: string | null
          club_id: number
          created_at: string
          created_by: string | null
          id: number
          tournament_id: number | null
          url: string
        }
        Insert: {
          caption?: string | null
          club_id: number
          created_at?: string
          created_by?: string | null
          id?: never
          tournament_id?: number | null
          url: string
        }
        Update: {
          caption?: string | null
          club_id?: number
          created_at?: string
          created_by?: string | null
          id?: never
          tournament_id?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_photos_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_photos_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          city: string
          courts: number | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: number
          instagram: string | null
          maps_url: string | null
          name: string
          phone: string | null
          slug: string
        }
        Insert: {
          address?: string | null
          city: string
          courts?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: never
          instagram?: string | null
          maps_url?: string | null
          name: string
          phone?: string | null
          slug: string
        }
        Update: {
          address?: string | null
          city?: string
          courts?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: never
          instagram?: string | null
          maps_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author: string | null
          body: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: number
          is_published: boolean
          published_at: string
          slug: string
          tag: string | null
          title: string
        }
        Insert: {
          author?: string | null
          body: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: never
          is_published?: boolean
          published_at?: string
          slug: string
          tag?: string | null
          title: string
        }
        Update: {
          author?: string | null
          body?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: never
          is_published?: boolean
          published_at?: string
          slug?: string
          tag?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: number
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: never
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: never
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      player_point_changes: {
        Row: {
          created_at: string
          created_by: string | null
          delta: number
          id: number
          player_id: number
          points_after: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delta: number
          id?: never
          player_id: number
          points_after: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delta?: number
          id?: never
          player_id?: number
          points_after?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_point_changes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          bio: string | null
          category: string
          city: string | null
          club: string | null
          created_at: string
          first_name: string
          gender: string
          id: number
          last_name: string
          matches_played: number
          matches_won: number
          photo_url: string | null
          ranking_points: number
          side: string | null
          slug: string
          titles: number
        }
        Insert: {
          active?: boolean
          bio?: string | null
          category: string
          city?: string | null
          club?: string | null
          created_at?: string
          first_name: string
          gender: string
          id?: never
          last_name: string
          matches_played?: number
          matches_won?: number
          photo_url?: string | null
          ranking_points?: number
          side?: string | null
          slug: string
          titles?: number
        }
        Update: {
          active?: boolean
          bio?: string | null
          category?: string
          city?: string | null
          club?: string | null
          created_at?: string
          first_name?: string
          gender?: string
          id?: never
          last_name?: string
          matches_played?: number
          matches_won?: number
          photo_url?: string | null
          ranking_points?: number
          side?: string | null
          slug?: string
          titles?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          category: number | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_admin: boolean
          phone: string | null
          player_id: number | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          category?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_admin?: boolean
          phone?: string | null
          player_id?: number | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          category?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_admin?: boolean
          phone?: string | null
          player_id?: number | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_imports: {
        Row: {
          created_at: string
          created_by: string | null
          created_player_ids: number[]
          file_name: string | null
          id: number
          label: string | null
          mode: string
          previous: Json
          rows_count: number
          undone_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_player_ids?: number[]
          file_name?: string | null
          id?: never
          label?: string | null
          mode: string
          previous?: Json
          rows_count?: number
          undone_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_player_ids?: number[]
          file_name?: string | null
          id?: never
          label?: string | null
          mode?: string
          previous?: Json
          rows_count?: number
          undone_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          hero_image_url: string | null
          id: boolean
          stats: Json
          updated_at: string
        }
        Insert: {
          hero_image_url?: string | null
          id?: boolean
          stats?: Json
          updated_at?: string
        }
        Update: {
          hero_image_url?: string | null
          id?: boolean
          stats?: Json
          updated_at?: string
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          accepted_at: string | null
          category: string | null
          contact_phone: string
          created_at: string
          id: number
          notes: string | null
          partner_category: number | null
          partner_id: string | null
          partner_name: string
          player_category: number | null
          status: string
          tournament_id: number
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          category?: string | null
          contact_phone: string
          created_at?: string
          id?: never
          notes?: string | null
          partner_category?: number | null
          partner_id?: string | null
          partner_name: string
          player_category?: number | null
          status?: string
          tournament_id: number
          user_id?: string
        }
        Update: {
          accepted_at?: string | null
          category?: string | null
          contact_phone?: string
          created_at?: string
          id?: never
          notes?: string | null
          partner_category?: number | null
          partner_id?: string | null
          partner_name?: string
          player_category?: number | null
          status?: string
          tournament_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_waitlist: {
        Row: {
          created_at: string
          notified_at: string | null
          tournament_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          notified_at?: string | null
          tournament_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          notified_at?: string | null
          tournament_id?: number
          user_id?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          address: string | null
          capacity: number | null
          category: string
          category_max: number | null
          category_min: number | null
          category_sum: number | null
          champions: string | null
          city: string
          club_id: number | null
          cover_url: string | null
          created_at: string
          description: string | null
          ends_on: string
          featured: string | null
          gender: string
          id: number
          maps_url: string | null
          name: string
          prize: string | null
          registration_opens_at: string | null
          slug: string
          sponsor_name: string | null
          starts_on: string
          status: string
          venue: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          category: string
          category_max?: number | null
          category_min?: number | null
          category_sum?: number | null
          champions?: string | null
          city: string
          club_id?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_on: string
          featured?: string | null
          gender: string
          id?: never
          maps_url?: string | null
          name: string
          prize?: string | null
          registration_opens_at?: string | null
          slug: string
          sponsor_name?: string | null
          starts_on: string
          status?: string
          venue?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          category?: string
          category_max?: number | null
          category_min?: number | null
          category_sum?: number | null
          champions?: string | null
          city?: string
          club_id?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_on?: string
          featured?: string | null
          gender?: string
          id?: never
          maps_url?: string | null
          name?: string
          prize?: string | null
          registration_opens_at?: string | null
          slug?: string
          sponsor_name?: string | null
          starts_on?: string
          status?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_player_points: {
        Args: { p_delta: number; p_player_id: number; p_reason: string }
        Returns: number
      }
      apply_points_import: {
        Args: {
          p_file_name: string
          p_label: string
          p_mode: string
          p_rows: Json
        }
        Returns: Json
      }
      cancel_registration: {
        Args: { p_registration_id: number }
        Returns: string
      }
      category_from_label: { Args: { p_label: string }; Returns: number }
      category_name: { Args: { p_category: number }; Returns: string }
      club_set_registration_status: {
        Args: { p_registration_id: number; p_status: string }
        Returns: undefined
      }
      club_tournament_registrations: {
        Args: { p_tournament_id: number }
        Returns: {
          accepted_at: string
          contact_phone: string
          created_at: string
          id: number
          partner_category: number
          partner_id: string
          partner_name: string
          player_category: number
          status: string
          user_id: string
        }[]
      }
      delete_user_account: { Args: { p_user_id: string }; Returns: undefined }
      get_player_account_avatar: {
        Args: { p_player_id: number }
        Returns: string
      }
      get_public_profiles: {
        Args: { p_ids: string[] }
        Returns: {
          avatar_url: string
          category: number
          full_name: string
          gender: string
          id: string
          username: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_any_club_owner: { Args: never; Returns: boolean }
      is_club_owner: { Args: { p_club_id: number }; Returns: boolean }
      join_waitlist: { Args: { p_tournament_id: number }; Returns: undefined }
      is_in_tournament: {
        Args: {
          p_except_id?: number
          p_tournament_id: number
          p_user_id: string
        }
        Returns: boolean
      }
      leave_waitlist: { Args: { p_tournament_id: number }; Returns: undefined }
      link_profile_player: {
        Args: { p_player_id?: number; p_user_id: string }
        Returns: undefined
      }
      my_waitlist_position: {
        Args: { p_tournament_id: number }
        Returns: number
      }
      open_scheduled_registrations: { Args: never; Returns: number }
      pair_category_error: {
        Args: {
          p_partner: number
          p_player: number
          p_tournament: Database["public"]["Tables"]["tournaments"]["Row"]
        }
        Returns: string
      }
      pair_gender_error: {
        Args: {
          p_partner: string
          p_player: string
          p_tournament: Database["public"]["Tables"]["tournaments"]["Row"]
        }
        Returns: string
      }
      player_tournaments: {
        Args: { p_player_id: number }
        Returns: {
          partner_name: string
          partner_slug: string
          tournament_id: number
        }[]
      }
      profile_display_name: {
        Args: { p_profile: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: string
      }
      register_pair: {
        Args: {
          p_contact_phone: string
          p_notes?: string
          p_partner_username: string
          p_tournament_id: number
        }
        Returns: number
      }
      release_registration: {
        Args: { p_registration_id: number }
        Returns: undefined
      }
      respond_invitation: {
        Args: { p_accept: boolean; p_registration_id: number }
        Returns: string
      }
      search_profiles: {
        Args: { p_query: string }
        Returns: {
          avatar_url: string
          category: number
          full_name: string
          gender: string
          id: string
          username: string
        }[]
      }
      set_club_owner: {
        Args: { p_club_id: number; p_owner: boolean; p_user_id: string }
        Returns: undefined
      }
      set_my_gender: { Args: { p_gender: string }; Returns: undefined }
      set_profile_admin: {
        Args: { p_is_admin: boolean; p_user_id: string }
        Returns: undefined
      }
      set_profile_category: {
        Args: { p_category?: number; p_user_id: string }
        Returns: undefined
      }
      set_profile_gender: {
        Args: { p_gender?: string; p_user_id: string }
        Returns: undefined
      }
      tournament_confirmed_pairs: {
        Args: { p_tournament_id: number }
        Returns: {
          partner_avatar_url: string
          partner_name: string
          partner_slug: string
          player_avatar_url: string
          player_name: string
          player_slug: string
          registration_id: number
        }[]
      }
      tournament_has_registrations: {
        Args: { p_tournament_id: number }
        Returns: boolean
      }
      tournament_waitlist_count: {
        Args: { p_tournament_id: number }
        Returns: number
      }
      tournament_spots: {
        Args: never
        Returns: {
          taken: number
          tournament_id: number
        }[]
      }
      tournament_taken: { Args: { p_tournament_id: number }; Returns: number }
      undo_last_points_import: { Args: never; Returns: Json }
      unique_username: { Args: { p_base: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
