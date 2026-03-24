import type { Database } from "./database"

export type Routine = Database["public"]["Tables"]["routines"]["Row"]
export type RoutineInsert = Database["public"]["Tables"]["routines"]["Insert"]

export type RoutineExercise =
  Database["public"]["Tables"]["routine_exercises"]["Row"]
export type RoutineExerciseInsert =
  Database["public"]["Tables"]["routine_exercises"]["Insert"]
