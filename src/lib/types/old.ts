export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      device_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: Database["public"]["Enums"]["device_category"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["device_category"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["device_category"]
        }
        Relationships: []
      }
      device_models: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          specifications: Json | null
          type_id: string
          updated_at: string | null
          image_filename: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specifications?: Json | null
          type_id: string
          updated_at?: string | null
          image_filename: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specifications?: Json | null
          type_id?: string
          updated_at?: string | null
          image_filename: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "device_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_models_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["id"]
          },
        ]
      }
      device_nodes: {
        Row: {
          calibration_date: string | null
          created_at: string | null
          device_id: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          node_type: string
          updated_at: string | null
        }
        Insert: {
          calibration_date?: string | null
          created_at?: string | null
          device_id: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          node_type: string
          updated_at?: string | null
        }
        Update: {
          calibration_date?: string | null
          created_at?: string | null
          device_id?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          node_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_nodes_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_parts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          life_time_days: number | null
          name: string
          specifications: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          life_time_days?: number | null
          name: string
          specifications?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          life_time_days?: number | null
          name?: string
          specifications?: Json | null
        }
        Relationships: []
      }
      device_structure: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          is_active: boolean | null
          pod_count: number
          shelf_id: number
          tray_count: number
          tray_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          is_active?: boolean | null
          pod_count: number
          shelf_id: number
          tray_count: number
          tray_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          is_active?: boolean | null
          pod_count?: number
          shelf_id?: number
          tray_count?: number
          tray_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_structure_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: Database["public"]["Enums"]["device_subtype"]
          supports_micro_plants: boolean | null
          supports_root_plants: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["device_subtype"]
          supports_micro_plants?: boolean | null
          supports_root_plants?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["device_subtype"]
          supports_micro_plants?: boolean | null
          supports_root_plants?: boolean | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string | null
          firmware_version: string | null
          id: string
          is_online: boolean | null
          last_connection_at: string | null
          metadata: Json | null
          model_id: string
          name: string
          serial_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          firmware_version?: string | null
          id?: string
          is_online?: boolean | null
          last_connection_at?: string | null
          metadata?: Json | null
          model_id: string
          name: string
          serial_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          firmware_version?: string | null
          id?: string
          is_online?: boolean | null
          last_connection_at?: string | null
          metadata?: Json | null
          model_id?: string
          name?: string
          serial_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          device_id: string
          id: string
          maintenance_type: string
          performed_actions: Json | null
          scheduled_date: string | null
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          device_id: string
          id?: string
          maintenance_type: string
          performed_actions?: Json | null
          scheduled_date?: string | null
          user_id: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          device_id?: string
          id?: string
          maintenance_type?: string
          performed_actions?: Json | null
          scheduled_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          node_id: string
          quality: number | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          node_id: string
          quality?: number | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          node_id?: string
          quality?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "device_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          priority: number | null
          read_at: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          priority?: number | null
          read_at?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: number | null
          read_at?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_growth_records: {
        Row: {
          actual_harvest_date: string | null
          catalog_id: string
          created_at: string | null
          estimated_harvest_date: string
          growth_status: Database["public"]["Enums"]["growth_status"] | null
          health_status: Database["public"]["Enums"]["health_status"] | null
          id: string
          metadata: Json | null
          notes: string | null
          slot_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          catalog_id: string
          created_at?: string | null
          estimated_harvest_date: string
          growth_status?: Database["public"]["Enums"]["growth_status"] | null
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          slot_id: string
          start_date?: string
          updated_at?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          catalog_id?: string
          created_at?: string | null
          estimated_harvest_date?: string
          growth_status?: Database["public"]["Enums"]["growth_status"] | null
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          slot_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_growth_records_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "plants_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_growth_records_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "plant_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_slots: {
        Row: {
          created_at: string | null
          current_plant_id: string | null
          id: string
          pod_position: number
          shelf_position: number
          status: string | null
          structure_id: string
          tray_position: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_plant_id?: string | null
          id?: string
          pod_position: number
          shelf_position: number
          status?: string | null
          structure_id: string
          tray_position: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_plant_id?: string | null
          id?: string
          pod_position?: number
          shelf_position?: number
          status?: string | null
          structure_id?: string
          tray_position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_slots_current_plant_id_fkey"
            columns: ["current_plant_id"]
            isOneToOne: false
            referencedRelation: "plants_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_slots_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "device_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      plants_catalog: {
        Row: {
          imageUrl: any
          care_instructions: string | null
          created_at: string | null
          ec_max: number
          ec_min: number
          growing_parameters: Json | null
          growth_time: number
          humidity_max: number | null
          humidity_min: number | null
          id: string
          image_filename: string | null
          light_hours: number
          name: string
          ph_max: number
          ph_min: number
          plant_type: Database["public"]["Enums"]["plant_type"]
          root_subcategory: Database['public']['Enums']['root_plant_subcategory'] | null
          scientific_name: string | null
          temperature_max: number
          temperature_min: number
          updated_at: string | null
        }
        Insert: {
          care_instructions?: string | null
          created_at?: string | null
          ec_max: number
          ec_min: number
          growing_parameters?: Json | null
          growth_time: number
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          image_filename?: string | null
          light_hours: number
          name: string
          ph_max: number
          ph_min: number
          plant_type: Database["public"]["Enums"]["plant_type"]
          root_subcategory: Database['public']['Enums']['root_plant_subcategory'] | null
          scientific_name?: string | null
          temperature_max: number
          temperature_min: number
          updated_at?: string | null
        }
        Update: {
          care_instructions?: string | null
          created_at?: string | null
          ec_max?: number
          ec_min?: number
          growing_parameters?: Json | null
          growth_time?: number
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          image_filename?: string | null
          light_hours?: number
          name?: string
          ph_max?: number
          ph_min?: number
          plant_type?: Database["public"]["Enums"]["plant_type"]
          root_subcategory: Database['public']['Enums']['root_plant_subcategory'] | null
          scientific_name?: string | null
          temperature_max?: number
          temperature_min?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_device_roles: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          user_device_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["user_role"]
          user_device_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          user_device_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_device_roles_user_device_id_fkey"
            columns: ["user_device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          is_primary_owner: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          is_primary_owner?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          is_primary_owner?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_super_admin: boolean | null
          last_login_at: string | null
          last_name: string | null
          notification_preferences: Json | null
          phone: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_all_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          username: string
          email: string
        }[]
      }
      get_user_profile: {
        Args: {
          user_id: number
        }
        Returns: {
          id: number
          username: string
          email: string
        }[]
      }
      update_user_profile: {
        Args: {
          user_id: number
          new_username: string
          new_email: string
        }
        Returns: undefined
      }
    }
    Enums: {
      device_category: "home" | "industrial"
      device_subtype: "desktop" | "midi" | "pro" | "custom"
      growth_status: "seeding" | "growing" | "ready" | "harvested"
      health_status: "healthy" | "attention" | "critical"
      plant_type: "root" | "micro"
      root_plant_subcategory: 'leafy_greens' | 'edible_flowers' | 'aromatic'
      user_role: "owner" | "manager" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never