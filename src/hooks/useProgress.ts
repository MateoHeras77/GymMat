import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./useAuth"
import type { PersonalRecord, BodyMeasurement } from "@/types/workout"
import type { Exercise } from "@/types/exercise"

export type PRWithExercise = PersonalRecord & { exercise: Exercise }

export function usePersonalRecords() {
  const { user } = useAuth()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["personal-records", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from("personal_records")
        .select("*, exercise:exercises(*)")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false })

      if (error) throw error
      return data as unknown as PRWithExercise[]
    },
    enabled: !!user,
  })

  return { records, isLoading }
}

export function useExerciseHistory(exerciseId: string | undefined) {
  const { user } = useAuth()

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["exercise-history", user?.id, exerciseId],
    queryFn: async () => {
      if (!user || !exerciseId) return []
      const { data, error } = await supabase
        .from("workout_sets")
        .select("*, session:workout_sessions!inner(started_at, user_id)")
        .eq("exercise_id", exerciseId)
        .eq("session.user_id", user.id)
        .order("completed_at", { ascending: true })

      if (error) throw error
      return data as unknown as {
        id: string
        weight: number | null
        reps: number | null
        set_type: string
        completed_at: string
        session: { started_at: string }
      }[]
    },
    enabled: !!user && !!exerciseId,
  })

  return { sets, isLoading }
}

export function useWeeklyVolume() {
  const { user } = useAuth()

  const { data: weeklyData = [], isLoading } = useQuery({
    queryKey: ["weekly-volume", user?.id],
    queryFn: async () => {
      if (!user) return []
      // Get all sets with session dates for the last 12 weeks
      const twelveWeeksAgo = new Date()
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

      const { data, error } = await supabase
        .from("workout_sets")
        .select("weight, reps, session:workout_sessions!inner(started_at, user_id)")
        .eq("session.user_id", user.id)
        .gte("completed_at", twelveWeeksAgo.toISOString())

      if (error) throw error
      return data as unknown as {
        weight: number | null
        reps: number | null
        session: { started_at: string }
      }[]
    },
    enabled: !!user,
  })

  return { weeklyData, isLoading }
}

export function useBodyMeasurements() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: ["body-measurements", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: false })

      if (error) throw error
      return data as unknown as BodyMeasurement[]
    },
    enabled: !!user,
  })

  const addMeasurement = useMutation({
    mutationFn: async (input: Omit<BodyMeasurement, "id" | "user_id" | "created_at">) => {
      if (!user) throw new Error("Not authenticated")
      const { error } = await supabase
        .from("body_measurements")
        .insert({ ...input, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-measurements"] })
    },
  })

  const deleteMeasurement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("body_measurements")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-measurements"] })
    },
  })

  return { measurements, isLoading, addMeasurement, deleteMeasurement }
}

export function useUserExercises() {
  const { user } = useAuth()

  const { data: exercises = [] } = useQuery({
    queryKey: ["user-exercises", user?.id],
    queryFn: async () => {
      if (!user) return []
      // Get distinct exercises the user has done
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_id, exercise:exercises(id, name, body_part, target)")
        .eq("session.user_id", user.id)
        .select("exercise_id, exercise:exercises(id, name, body_part, target), session:workout_sessions!inner(user_id)")

      if (error) throw error

      // Deduplicate
      const seen = new Set<string>()
      const unique: { id: string; name: string; body_part: string; target: string }[] = []
      for (const row of data as unknown as { exercise_id: string; exercise: { id: string; name: string; body_part: string; target: string } }[]) {
        if (!seen.has(row.exercise_id)) {
          seen.add(row.exercise_id)
          unique.push(row.exercise)
        }
      }
      return unique
    },
    enabled: !!user,
  })

  return exercises
}
