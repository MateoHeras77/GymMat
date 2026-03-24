import type { Database } from "./database"

export type WorkoutSession =
  Database["public"]["Tables"]["workout_sessions"]["Row"]
export type WorkoutSessionInsert =
  Database["public"]["Tables"]["workout_sessions"]["Insert"]

export type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"]
export type WorkoutSetInsert =
  Database["public"]["Tables"]["workout_sets"]["Insert"]

export type PersonalRecord =
  Database["public"]["Tables"]["personal_records"]["Row"]

export type BodyMeasurement =
  Database["public"]["Tables"]["body_measurements"]["Row"]
export type BodyMeasurementInsert =
  Database["public"]["Tables"]["body_measurements"]["Insert"]

export type UserPreferences =
  Database["public"]["Tables"]["user_preferences"]["Row"]
