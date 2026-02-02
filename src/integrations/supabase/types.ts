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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          admin_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          property_id: string | null
          session_id: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          property_id?: string | null
          session_id?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          property_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "session_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "public_session_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "showing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_photos: {
        Row: {
          caption: string | null
          created_at: string
          file_url: string
          id: string
          session_property_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_url: string
          id?: string
          session_property_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_url?: string
          id?: string
          session_property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_photos_session_property_id_fkey"
            columns: ["session_property_id"]
            isOneToOne: false
            referencedRelation: "session_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          brokerage_address: string | null
          brokerage_email: string | null
          brokerage_logo_url: string | null
          brokerage_name: string | null
          brokerage_phone: string | null
          company: string | null
          created_at: string
          email: string
          facebook_url: string | null
          full_name: string | null
          id: string
          instagram_url: string | null
          license_number: string | null
          linkedin_url: string | null
          phone: string | null
          slogan: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          brokerage_address?: string | null
          brokerage_email?: string | null
          brokerage_logo_url?: string | null
          brokerage_name?: string | null
          brokerage_phone?: string | null
          company?: string | null
          created_at?: string
          email: string
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          license_number?: string | null
          linkedin_url?: string | null
          phone?: string | null
          slogan?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          brokerage_address?: string | null
          brokerage_email?: string | null
          brokerage_logo_url?: string | null
          brokerage_name?: string | null
          brokerage_phone?: string | null
          company?: string | null
          created_at?: string
          email?: string
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          license_number?: string | null
          linkedin_url?: string | null
          phone?: string | null
          slogan?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          created_at: string
          doc_type: string | null
          file_url: string
          id: string
          name: string
          session_property_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          file_url: string
          id?: string
          name: string
          session_property_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          file_url?: string
          id?: string
          name?: string
          session_property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_session_property_id_fkey"
            columns: ["session_property_id"]
            isOneToOne: false
            referencedRelation: "session_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          rating: number | null
          session_property_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number | null
          session_property_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number | null
          session_property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_ratings_session_property_id_fkey"
            columns: ["session_property_id"]
            isOneToOne: false
            referencedRelation: "session_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      session_properties: {
        Row: {
          address: string
          agent_notes: string | null
          baths: number | null
          beds: number | null
          city: string | null
          cooling: string | null
          created_at: string
          description: string | null
          features: string[] | null
          garage: string | null
          heating: string | null
          hoa_fee: number | null
          id: string
          lot_size: string | null
          order_index: number
          photo_url: string | null
          price: number | null
          property_type: string | null
          session_id: string
          sqft: number | null
          state: string | null
          summary: string | null
          updated_at: string
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          address: string
          agent_notes?: string | null
          baths?: number | null
          beds?: number | null
          city?: string | null
          cooling?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          garage?: string | null
          heating?: string | null
          hoa_fee?: number | null
          id?: string
          lot_size?: string | null
          order_index?: number
          photo_url?: string | null
          price?: number | null
          property_type?: string | null
          session_id: string
          sqft?: number | null
          state?: string | null
          summary?: string | null
          updated_at?: string
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          agent_notes?: string | null
          baths?: number | null
          beds?: number | null
          city?: string | null
          cooling?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          garage?: string | null
          heating?: string | null
          hoa_fee?: number | null
          id?: string
          lot_size?: string | null
          order_index?: number
          photo_url?: string | null
          price?: number | null
          property_type?: string | null
          session_id?: string
          sqft?: number | null
          state?: string | null
          summary?: string | null
          updated_at?: string
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_properties_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "public_session_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_properties_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "showing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      showing_sessions: {
        Row: {
          admin_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          session_date: string | null
          share_token: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string | null
          share_token?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string | null
          share_token?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_session_view: {
        Row: {
          admin_id: string | null
          client_name: string | null
          created_at: string | null
          id: string | null
          notes: string | null
          session_date: string | null
          share_token: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          session_date?: string | null
          share_token?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          session_date?: string | null
          share_token?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_id_from_session: {
        Args: { p_session_id: string }
        Returns: string
      }
      get_public_session: {
        Args: { p_share_token: string }
        Returns: {
          admin_id: string
          client_name: string
          created_at: string
          id: string
          notes: string
          session_date: string
          share_token: string
          title: string
          updated_at: string
        }[]
      }
      get_session_id_from_property: {
        Args: { property_id: string }
        Returns: string
      }
      is_session_admin: { Args: { session_id: string }; Returns: boolean }
      is_valid_share_token: { Args: { token: string }; Returns: boolean }
      submit_property_rating: {
        Args: {
          p_feedback: string
          p_rating: number
          p_session_property_id: string
          p_share_token: string
        }
        Returns: string
      }
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
    Enums: {},
  },
} as const
