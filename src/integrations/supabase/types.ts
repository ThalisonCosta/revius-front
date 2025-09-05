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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      novelas: {
        Row: {
          episode_count: number | null
          media_id: string
          network: Database["public"]["Enums"]["novela_network_enum"]
          original_air_end: string | null
          original_air_start: string | null
          time_slot: Database["public"]["Enums"]["time_slot_enum"] | null
        }
        Insert: {
          episode_count?: number | null
          media_id: string
          network: Database["public"]["Enums"]["novela_network_enum"]
          original_air_end?: string | null
          original_air_start?: string | null
          time_slot?: Database["public"]["Enums"]["time_slot_enum"] | null
        }
        Update: {
          episode_count?: number | null
          media_id?: string
          network?: Database["public"]["Enums"]["novela_network_enum"]
          original_air_end?: string | null
          original_air_start?: string | null
          time_slot?: Database["public"]["Enums"]["time_slot_enum"] | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          contains_spoilers: boolean | null
          created_at: string | null
          external_id: string | null
          external_url: string | null
          external_user_avatar: string | null
          external_user_id: string | null
          external_username: string | null
          helpful_votes: number | null
          id: string
          is_verified: boolean | null
          language: string | null
          media_id: string | null
          media_name: string | null
          platform_rating: number | null
          rating: number
          review_text: string | null
          source_platform: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contains_spoilers?: boolean | null
          created_at?: string | null
          external_id?: string | null
          external_url?: string | null
          external_user_avatar?: string | null
          external_user_id?: string | null
          external_username?: string | null
          helpful_votes?: number | null
          id: string
          is_verified?: boolean | null
          language?: string | null
          media_id?: string | null
          media_name?: string | null
          platform_rating?: number | null
          rating: number
          review_text?: string | null
          source_platform?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contains_spoilers?: boolean | null
          created_at?: string | null
          external_id?: string | null
          external_url?: string | null
          external_user_avatar?: string | null
          external_user_id?: string | null
          external_username?: string | null
          helpful_votes?: number | null
          id?: string
          is_verified?: boolean | null
          language?: string | null
          media_id?: string | null
          media_name?: string | null
          platform_rating?: number | null
          rating?: number
          review_text?: string | null
          source_platform?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_list_items: {
        Row: {
          created_at: string | null
          id: string
          list_id: string
          media_id: string
          media_synopsis: string | null
          media_thumbnail: string | null
          media_title: string | null
          media_type: string | null
          media_year: number | null
          position: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id: string
          media_id: string
          media_synopsis?: string | null
          media_thumbnail?: string | null
          media_title?: string | null
          media_type?: string | null
          media_year?: number | null
          position?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string
          media_id?: string
          media_synopsis?: string | null
          media_thumbnail?: string | null
          media_title?: string | null
          media_type?: string | null
          media_year?: number | null
          position?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "user_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_media_status: {
        Row: {
          created_at: string
          finish_date: string | null
          id: string
          media_id: string
          notes: string | null
          progress: number | null
          score: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finish_date?: string | null
          id?: string
          media_id: string
          notes?: string | null
          progress?: number | null
          score?: number | null
          start_date?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finish_date?: string | null
          id?: string
          media_id?: string
          notes?: string | null
          progress?: number | null
          score?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_review_preferences: {
        Row: {
          auto_fetch_external: boolean | null
          cache_duration_hours: number | null
          created_at: string
          enabled_sources: string[] | null
          id: string
          language_filter: string[] | null
          show_external_first: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_fetch_external?: boolean | null
          cache_duration_hours?: number | null
          created_at?: string
          enabled_sources?: string[] | null
          id?: string
          language_filter?: string[] | null
          show_external_first?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_fetch_external?: boolean | null
          cache_duration_hours?: number | null
          created_at?: string
          enabled_sources?: string[] | null
          id?: string
          language_filter?: string[] | null
          show_external_first?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_votes: {
        Row: {
          created_at: string
          id: string
          media_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
          is_verified: boolean | null
          location: string | null
          share_settings: Json
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier_enum"]
            | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_admin?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          share_settings?: Json
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier_enum"]
            | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          share_settings?: Json
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier_enum"]
            | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_rating_enum:
        | "G"
        | "PG"
        | "PG-13"
        | "R"
        | "NC-17"
        | "NR"
        | "L"
        | "10"
        | "12"
        | "14"
        | "16"
        | "18"
      media_type_enum:
        | "novela"
        | "movie"
        | "book"
        | "tv_series"
        | "game"
        | "anime"
        | "dorama"
      novela_network_enum:
        | "Globo"
        | "SBT"
        | "Record"
        | "Band"
        | "RedeTV"
        | "Outros"
      subscription_tier_enum: "free" | "pro" | "enterprise"
      time_slot_enum:
        | "manhã"
        | "tarde"
        | "novela-das-seis"
        | "novela-das-sete"
        | "novela-das-nove"
        | "noite"
        | "madrugada"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_rating_enum: [
        "G",
        "PG",
        "PG-13",
        "R",
        "NC-17",
        "NR",
        "L",
        "10",
        "12",
        "14",
        "16",
        "18",
      ],
      media_type_enum: [
        "novela",
        "movie",
        "book",
        "tv_series",
        "game",
        "anime",
        "dorama",
      ],
      novela_network_enum: [
        "Globo",
        "SBT",
        "Record",
        "Band",
        "RedeTV",
        "Outros",
      ],
      subscription_tier_enum: ["free", "pro", "enterprise"],
      time_slot_enum: [
        "manhã",
        "tarde",
        "novela-das-seis",
        "novela-das-sete",
        "novela-das-nove",
        "noite",
        "madrugada",
      ],
    },
  },
} as const
