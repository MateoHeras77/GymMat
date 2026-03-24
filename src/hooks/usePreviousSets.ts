import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./useAuth"

export interface PreviousSet {
  set_number: number
  weight: number | null
  reps: number | null
}

/**
 * Fetches the sets from the most recent completed session for a given exercise.
 */
export function usePreviousSets(exerciseId: string | undefined) {
  const { user } = useAuth()

  const { data: previousSets = [] } = useQuery({
    queryKey: ["previous-sets", user?.id, exerciseId],
    queryFn: async () => {
      if (!user || !exerciseId) return []

      // Find the most recent session that had this exercise
      const { data, error } = await supabase
        .from("workout_sets")
        .select("set_number, weight, reps, session:workout_sessions!inner(started_at, user_id)")
        .eq("exercise_id", exerciseId)
        .eq("session.user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(20)

      if (error) throw error

      const rows = data as unknown as {
        set_number: number
        weight: number | null
        reps: number | null
        session: { started_at: string }
      }[]

      if (rows.length === 0) return []

      // All rows from the most recent session
      const latestDate = rows[0].session.started_at
      return rows
        .filter((r) => r.session.started_at === latestDate)
        .sort((a, b) => a.set_number - b.set_number)
        .map((r) => ({
          set_number: r.set_number,
          weight: r.weight != null ? Number(r.weight) : null,
          reps: r.reps != null ? Number(r.reps) : null,
        }))
    },
    enabled: !!user && !!exerciseId,
    staleTime: 5 * 60 * 1000,
  })

  return previousSets
}
