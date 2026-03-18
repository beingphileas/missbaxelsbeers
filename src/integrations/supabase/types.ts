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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      beers: {
        Row: {
          abv: number | null
          added_at: string
          analysis_json: Json | null
          aroma_profile: string[] | null
          beer_status: string | null
          brewery_id: string
          created_at: string
          description: string | null
          factcheck_json: Json | null
          featured: boolean
          flavor_profile: string[] | null
          food_pairing: string | null
          id: string
          image_url: string | null
          is_hidden_gem: boolean | null
          name: string
          pairing_cheese: string[] | null
          pairing_classic: string[] | null
          pairing_food: string[] | null
          primary_flavors: string[] | null
          production_method: string | null
          quality_score: number | null
          radar_body: number | null
          radar_fruit: number | null
          radar_hops: number | null
          radar_malt: number | null
          radar_spice: number | null
          secondary_flavors: string[] | null
          serve_style: string | null
          source_url: string | null
          style: string
          summary: string | null
          taste_notes: string | null
          updated_at: string
        }
        Insert: {
          abv?: number | null
          added_at?: string
          analysis_json?: Json | null
          aroma_profile?: string[] | null
          beer_status?: string | null
          brewery_id: string
          created_at?: string
          description?: string | null
          factcheck_json?: Json | null
          featured?: boolean
          flavor_profile?: string[] | null
          food_pairing?: string | null
          id?: string
          image_url?: string | null
          is_hidden_gem?: boolean | null
          name: string
          pairing_cheese?: string[] | null
          pairing_classic?: string[] | null
          pairing_food?: string[] | null
          primary_flavors?: string[] | null
          production_method?: string | null
          quality_score?: number | null
          radar_body?: number | null
          radar_fruit?: number | null
          radar_hops?: number | null
          radar_malt?: number | null
          radar_spice?: number | null
          secondary_flavors?: string[] | null
          serve_style?: string | null
          source_url?: string | null
          style: string
          summary?: string | null
          taste_notes?: string | null
          updated_at?: string
        }
        Update: {
          abv?: number | null
          added_at?: string
          analysis_json?: Json | null
          aroma_profile?: string[] | null
          beer_status?: string | null
          brewery_id?: string
          created_at?: string
          description?: string | null
          factcheck_json?: Json | null
          featured?: boolean
          flavor_profile?: string[] | null
          food_pairing?: string | null
          id?: string
          image_url?: string | null
          is_hidden_gem?: boolean | null
          name?: string
          pairing_cheese?: string[] | null
          pairing_classic?: string[] | null
          pairing_food?: string[] | null
          primary_flavors?: string[] | null
          production_method?: string | null
          quality_score?: number | null
          radar_body?: number | null
          radar_fruit?: number | null
          radar_hops?: number | null
          radar_malt?: number | null
          radar_spice?: number | null
          secondary_flavors?: string[] | null
          serve_style?: string | null
          source_url?: string | null
          style?: string
          summary?: string | null
          taste_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beers_brewery_id_fkey"
            columns: ["brewery_id"]
            isOneToOne: false
            referencedRelation: "breweries"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_beers: {
        Row: {
          beer_id: string
          blog_post_id: string
          created_at: string
          id: string
        }
        Insert: {
          beer_id: string
          blog_post_id: string
          created_at?: string
          id?: string
        }
        Update: {
          beer_id?: string
          blog_post_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_beers_beer_id_fkey"
            columns: ["beer_id"]
            isOneToOne: false
            referencedRelation: "beers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_beers_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_breweries: {
        Row: {
          blog_post_id: string
          brewery_id: string
          created_at: string
          id: string
        }
        Insert: {
          blog_post_id: string
          brewery_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blog_post_id?: string
          brewery_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_breweries_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_breweries_brewery_id_fkey"
            columns: ["brewery_id"]
            isOneToOne: false
            referencedRelation: "breweries"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_venues: {
        Row: {
          blog_post_id: string
          created_at: string
          id: string
          venue_id: string
        }
        Insert: {
          blog_post_id: string
          created_at?: string
          id?: string
          venue_id: string
        }
        Update: {
          blog_post_id?: string
          created_at?: string
          id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_venues_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          beer_id: string | null
          brewery_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          beer_id?: string | null
          brewery_id?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          beer_id?: string | null
          brewery_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_beer_id_fkey"
            columns: ["beer_id"]
            isOneToOne: false
            referencedRelation: "beers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_brewery_id_fkey"
            columns: ["brewery_id"]
            isOneToOne: false
            referencedRelation: "breweries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      breweries: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          established_year: number | null
          featured: boolean
          google_rating: number | null
          google_review_count: number | null
          google_url: string | null
          id: string
          last_scraped_at: string | null
          lat: number
          lng: number
          name: string
          phone: string | null
          province: string
          story: string | null
          type: string
          untappd_rating: number | null
          untappd_review_count: number | null
          untappd_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          established_year?: number | null
          featured?: boolean
          google_rating?: number | null
          google_review_count?: number | null
          google_url?: string | null
          id?: string
          last_scraped_at?: string | null
          lat: number
          lng: number
          name: string
          phone?: string | null
          province: string
          story?: string | null
          type: string
          untappd_rating?: number | null
          untappd_review_count?: number | null
          untappd_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          established_year?: number | null
          featured?: boolean
          google_rating?: number | null
          google_review_count?: number | null
          google_url?: string | null
          id?: string
          last_scraped_at?: string | null
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          province?: string
          story?: string | null
          type?: string
          untappd_rating?: number | null
          untappd_review_count?: number | null
          untappd_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      brewery_users: {
        Row: {
          brewery_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          brewery_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          brewery_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brewery_users_brewery_id_fkey"
            columns: ["brewery_id"]
            isOneToOne: false
            referencedRelation: "breweries"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_changes: {
        Row: {
          brewery_id: string
          change_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          payload: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          brewery_id: string
          change_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          payload?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          brewery_id?: string
          change_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          payload?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_changes_brewery_id_fkey"
            columns: ["brewery_id"]
            isOneToOne: false
            referencedRelation: "breweries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          google_rating: number | null
          google_review_count: number | null
          google_url: string | null
          id: string
          is_verified: boolean
          lat: number
          lng: number
          name: string
          phone: string | null
          province: string
          tripadvisor_rating: number | null
          tripadvisor_review_count: number | null
          tripadvisor_url: string | null
          untappd_rating: number | null
          untappd_review_count: number | null
          untappd_url: string | null
          updated_at: string
          venue_type: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          google_url?: string | null
          id?: string
          is_verified?: boolean
          lat: number
          lng: number
          name: string
          phone?: string | null
          province: string
          tripadvisor_rating?: number | null
          tripadvisor_review_count?: number | null
          tripadvisor_url?: string | null
          untappd_rating?: number | null
          untappd_review_count?: number | null
          untappd_url?: string | null
          updated_at?: string
          venue_type?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          google_url?: string | null
          id?: string
          is_verified?: boolean
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          province?: string
          tripadvisor_rating?: number | null
          tripadvisor_review_count?: number | null
          tripadvisor_url?: string | null
          untappd_rating?: number | null
          untappd_review_count?: number | null
          untappd_url?: string | null
          updated_at?: string
          venue_type?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fuzzy_match_brewery: {
        Args: { search_name: string }
        Returns: {
          id: string
          name: string
          similarity: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_brewery: {
        Args: { _brewery_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
