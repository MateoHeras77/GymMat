export type Database = {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string
          name: string
          body_part: string
          target: string
          equipment: string
          secondary_muscles: string[]
          instructions: string[]
          description: string | null
          difficulty: "beginner" | "intermediate" | "advanced" | null
          category:
            | "strength"
            | "cardio"
            | "mobility"
            | "balance"
            | "stretching"
            | "plyometrics"
            | "rehabilitation"
            | null
          gif_url_180: string | null
          gif_url_hd: string | null
          synced_at: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          body_part: string
          target: string
          equipment: string
          secondary_muscles?: string[]
          instructions?: string[]
          description?: string | null
          difficulty?: "beginner" | "intermediate" | "advanced" | null
          category?:
            | "strength"
            | "cardio"
            | "mobility"
            | "balance"
            | "stretching"
            | "plyometrics"
            | "rehabilitation"
            | null
          gif_url_180?: string | null
          gif_url_hd?: string | null
          synced_at?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>
        Relationships: []
      }
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          template_type: string | null
          estimated_duration_min: number | null
          is_archived: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          template_type?: string | null
          estimated_duration_min?: number | null
          is_archived?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["routines"]["Insert"]>
        Relationships: []
      }
      routine_exercises: {
        Row: {
          id: string
          routine_id: string
          exercise_id: string
          sort_order: number
          superset_group: number | null
          target_sets: number
          target_reps: string
          target_weight: number | null
          target_rpe: number | null
          rest_seconds: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          exercise_id: string
          sort_order?: number
          superset_group?: number | null
          target_sets?: number
          target_reps?: string
          target_weight?: number | null
          target_rpe?: number | null
          rest_seconds?: number
          notes?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["routine_exercises"]["Insert"]
        >
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          routine_id: string | null
          name: string
          started_at: string
          completed_at: string | null
          duration_seconds: number | null
          notes: string | null
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_id?: string | null
          name: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          rating?: number | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["workout_sessions"]["Insert"]
        >
        Relationships: []
      }
      workout_sets: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          set_number: number
          set_type: "warmup" | "working" | "drop" | "failure"
          reps: number | null
          weight: number | null
          duration_seconds: number | null
          distance: number | null
          rpe: number | null
          is_pr: boolean
          notes: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          set_number: number
          set_type?: "warmup" | "working" | "drop" | "failure"
          reps?: number | null
          weight?: number | null
          duration_seconds?: number | null
          distance?: number | null
          rpe?: number | null
          is_pr?: boolean
          notes?: string | null
          completed_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["workout_sets"]["Insert"]>
        Relationships: []
      }
      personal_records: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          record_type:
            | "max_weight"
            | "max_reps"
            | "max_volume"
            | "max_duration"
          value: number
          workout_set_id: string | null
          achieved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          record_type:
            | "max_weight"
            | "max_reps"
            | "max_volume"
            | "max_duration"
          value: number
          workout_set_id?: string | null
          achieved_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["personal_records"]["Insert"]
        >
        Relationships: []
      }
      body_measurements: {
        Row: {
          id: string
          user_id: string
          measured_at: string
          body_weight: number | null
          body_fat_pct: number | null
          chest: number | null
          waist: number | null
          hips: number | null
          bicep_left: number | null
          bicep_right: number | null
          thigh_left: number | null
          thigh_right: number | null
          calf_left: number | null
          calf_right: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          measured_at?: string
          body_weight?: number | null
          body_fat_pct?: number | null
          chest?: number | null
          waist?: number | null
          hips?: number | null
          bicep_left?: number | null
          bicep_right?: number | null
          thigh_left?: number | null
          thigh_right?: number | null
          calf_left?: number | null
          calf_right?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["body_measurements"]["Insert"]
        >
        Relationships: []
      }
      user_preferences: {
        Row: {
          user_id: string
          weight_unit: "lbs" | "kg"
          show_dual_units: boolean
          measurement_unit: "in" | "cm"
          default_rest_seconds: number
          theme: "light" | "dark" | "system"
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          weight_unit?: "lbs" | "kg"
          show_dual_units?: boolean
          measurement_unit?: "in" | "cm"
          default_rest_seconds?: number
          theme?: "light" | "dark" | "system"
          created_at?: string
          updated_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["user_preferences"]["Insert"]
        >
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
