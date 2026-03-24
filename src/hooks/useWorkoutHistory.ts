import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./useAuth"
import type { WorkoutSession, WorkoutSet } from "@/types/workout"
import type { Exercise } from "@/types/exercise"

export type SessionWithSets = WorkoutSession & {
  sets: (WorkoutSet & { exercise: Exercise })[]
}

export function useWorkoutHistory() {
  const { user } = useAuth()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["workout-history", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })

      if (error) throw error
      return data as unknown as WorkoutSession[]
    },
    enabled: !!user,
  })

  return { sessions, isLoading }
}

export function useSessionDetail(sessionId: string | undefined) {
  const { data: session, isLoading } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: async () => {
      if (!sessionId) return null

      const [sessionRes, setsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("*")
          .eq("id", sessionId)
          .single(),
        supabase
          .from("workout_sets")
          .select("*, exercise:exercises(*)")
          .eq("session_id", sessionId)
          .order("exercise_id")
          .order("set_number"),
      ])

      if (sessionRes.error) throw sessionRes.error
      if (setsRes.error) throw setsRes.error

      return {
        ...(sessionRes.data as unknown as WorkoutSession),
        sets: setsRes.data as unknown as (WorkoutSet & { exercise: Exercise })[],
      } as SessionWithSets
    },
    enabled: !!sessionId,
  })

  return { session, isLoading }
}

export function useWorkoutDays() {
  const { user } = useAuth()

  const { data: workoutDays = [] } = useQuery({
    queryKey: ["workout-days", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)

      if (error) throw error
      return (data as unknown as { started_at: string }[]).map(
        (s) => s.started_at.split("T")[0]
      )
    },
    enabled: !!user,
  })

  return workoutDays
}
