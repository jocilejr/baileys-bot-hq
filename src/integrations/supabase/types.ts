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
      automation_flows: {
        Row: {
          active: boolean | null
          blocks: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instance_ids: string[] | null
          name: string
          trigger_type: Database["public"]["Enums"]["trigger_type"]
          trigger_value: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          blocks?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instance_ids?: string[] | null
          name: string
          trigger_type?: Database["public"]["Enums"]["trigger_type"]
          trigger_value?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          blocks?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instance_ids?: string[] | null
          name?: string
          trigger_type?: Database["public"]["Enums"]["trigger_type"]
          trigger_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      campaign_messages: {
        Row: {
          campaign_id: string
          contact_id: string
          error: string | null
          id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          campaign_id: string
          contact_id: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          delay_ms: number | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          instance_id: string | null
          name: string
          read_count: number | null
          recipient_count: number | null
          recipient_tags: string[] | null
          scheduled_at: string | null
          sent_count: number | null
          status: Database["public"]["Enums"]["campaign_status"]
          template: string | null
          template_variables: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delay_ms?: number | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          name: string
          read_count?: number | null
          recipient_count?: number | null
          recipient_tags?: string[] | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template?: string | null
          template_variables?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delay_ms?: number | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          name?: string
          read_count?: number | null
          recipient_count?: number | null
          recipient_tags?: string[] | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template?: string | null
          template_variables?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          custom_fields: Json | null
          email: string | null
          id: string
          instance_id: string | null
          name: string
          notes: string | null
          phone: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          instance_id?: string | null
          name: string
          notes?: string | null
          phone: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          instance_id?: string | null
          name?: string
          notes?: string | null
          phone?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          contact_id: string
          created_at: string
          department: string | null
          id: string
          instance_id: string
          last_message_at: string | null
          last_message_preview: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id: string
          created_at?: string
          department?: string | null
          id?: string
          instance_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string
          created_at?: string
          department?: string | null
          id?: string
          instance_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          api_url: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone: string | null
          qr_code: string | null
          session_data: Json | null
          status: Database["public"]["Enums"]["instance_status"]
          updated_at: string
        }
        Insert: {
          api_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          phone?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
        }
        Update: {
          api_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          phone?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          sender_name: string | null
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          shortcut: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          shortcut?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          shortcut?: string | null
          title?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
      app_role: "admin" | "supervisor" | "atendente"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "paused"
        | "completed"
        | "cancelled"
      conversation_status: "open" | "closed" | "pending" | "bot"
      instance_status:
        | "connected"
        | "disconnected"
        | "connecting"
        | "qr_pending"
      message_direction: "inbound" | "outbound"
      message_status: "pending" | "sent" | "delivered" | "read" | "failed"
      trigger_type: "keyword" | "first_message" | "schedule" | "webhook"
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
      app_role: ["admin", "supervisor", "atendente"],
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "paused",
        "completed",
        "cancelled",
      ],
      conversation_status: ["open", "closed", "pending", "bot"],
      instance_status: [
        "connected",
        "disconnected",
        "connecting",
        "qr_pending",
      ],
      message_direction: ["inbound", "outbound"],
      message_status: ["pending", "sent", "delivered", "read", "failed"],
      trigger_type: ["keyword", "first_message", "schedule", "webhook"],
    },
  },
} as const
