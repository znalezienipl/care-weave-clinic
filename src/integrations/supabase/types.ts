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
      appointments: {
        Row: {
          completed_at: string | null
          created_at: string
          doctor_id: string
          duration_min: number
          id: string
          location_id: string
          notes: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          scheduled_at: string
          service_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          doctor_id: string
          duration_min: number
          id?: string
          location_id: string
          notes?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          scheduled_at: string
          service_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          doctor_id?: string
          duration_min?: number
          id?: string
          location_id?: string
          notes?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          scheduled_at?: string
          service_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          location_id: string
          slot_minutes: number
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          location_id: string
          slot_minutes?: number
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          location_id?: string
          slot_minutes?: number
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          about: string | null
          email: string | null
          id: number
          phone: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_locations: {
        Row: {
          doctor_id: string
          location_id: string
        }
        Insert: {
          doctor_id: string
          location_id: string
        }
        Update: {
          doctor_id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_locations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean
          availability_status: Database["public"]["Enums"]["availability_status"]
          bio: string | null
          certificates: string | null
          created_at: string
          education: string | null
          expertise: string[]
          full_name: string
          id: string
          photo_url: string | null
          sort_order: number
          specializations: string[]
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          availability_status?: Database["public"]["Enums"]["availability_status"]
          bio?: string | null
          certificates?: string | null
          created_at?: string
          education?: string | null
          expertise?: string[]
          full_name: string
          id?: string
          photo_url?: string | null
          sort_order?: number
          specializations?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          availability_status?: Database["public"]["Enums"]["availability_status"]
          bio?: string | null
          certificates?: string | null
          created_at?: string
          education?: string | null
          expertise?: string[]
          full_name?: string
          id?: string
          photo_url?: string | null
          sort_order?: number
          specializations?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          city: string
          created_at: string
          hours: Json | null
          id: string
          name: string
          phone: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          hours?: Json | null
          id?: string
          name: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          hours?: Json | null
          id?: string
          name?: string
          phone?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          appointment_id: string | null
          channel: string
          created_at: string
          error: string | null
          id: string
          message: string
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          to_phone: string
          type: Database["public"]["Enums"]["notification_type"]
          waitlist_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          message: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          to_phone: string
          type: Database["public"]["Enums"]["notification_type"]
          waitlist_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          message?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          to_phone?: string
          type?: Database["public"]["Enums"]["notification_type"]
          waitlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          duration_min: number
          id: string
          name: string
          price_pln: number | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          name: string
          price_pln?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          name?: string
          price_pln?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          published: boolean
          rating: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          published?: boolean
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          location_id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          preferred_from: string | null
          preferred_to: string | null
          service_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          preferred_from?: string | null
          preferred_to?: string | null
          service_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          preferred_from?: string | null
          preferred_to?: string | null
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor"
      appointment_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      availability_status: "accepting" | "limited" | "unavailable"
      notification_status: "pending" | "sent" | "failed"
      notification_type:
        | "confirmation"
        | "reminder_48h"
        | "reminder_24h"
        | "reminder_2h"
        | "delay"
        | "cancellation"
        | "waitlist_match"
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
      app_role: ["admin", "doctor"],
      appointment_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      availability_status: ["accepting", "limited", "unavailable"],
      notification_status: ["pending", "sent", "failed"],
      notification_type: [
        "confirmation",
        "reminder_48h",
        "reminder_24h",
        "reminder_2h",
        "delay",
        "cancellation",
        "waitlist_match",
      ],
    },
  },
} as const
