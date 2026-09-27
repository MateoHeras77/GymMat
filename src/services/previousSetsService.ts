import { supabase } from "@/lib/supabase"
import type { LastSet } from "@/lib/weightUnits"

/**
 * For each exercise, the sets logged in the most recent session that included
 * it. One query for the whole routine (not one per exercise).
 */
export async function fetchLastSessionSets(
  userId: string,
  exerciseIds: string[]
): Promise<Map<string, LastSet[]>> {
  const byExercise = new Map<string, LastSet[]>()
  if (exerciseIds.length === 0) return byExercise

  const { data, error } = await supabase
    .from("workout_sets")
    .select(
      "session_id, exercise_id, set_number, set_type, weight, reps, completed_at, session:workout_sessions!inner(user_id)"
    )
    .in("exercise_id", exerciseIds)
    .eq("session.user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(500)

  if (error) throw error

  const latestSession = new Map<string, string>()
  for (const row of data as unknown as {
    session_id: string
    exercise_id: string
    set_number: number
    set_type: string
    weight: number | string | null
    reps: number | null
  }[]) {
    // Rows are newest first: the first session seen per exercise is the latest.
    if (!latestSession.has(row.exercise_id)) latestSession.set(row.exercise_id, row.session_id)
    if (latestSession.get(row.exercise_id) !== row.session_id) continue

    const sets = byExercise.get(row.exercise_id) ?? []
    sets.push({
      setNumber: row.set_number,
      setType: row.set_type,
      weight: row.weight != null ? Number(row.weight) : null,
      reps: row.reps,
    })
    byExercise.set(row.exercise_id, sets)
  }

  for (const sets of byExercise.values()) sets.sort((a, b) => a.setNumber - b.setNumber)
  return byExercise
}

/** Like fetchLastSessionSets, but gives up after `ms` (starting a workout must never hang). */
export async function fetchLastSessionSetsQuick(
  userId: string,
  exerciseIds: string[],
  ms = 4000
): Promise<Map<string, LastSet[]>> {
  const timeout = new Promise<Map<string, LastSet[]>>((resolve) =>
    setTimeout(() => resolve(new Map()), ms)
  )
  return Promise.race([
    fetchLastSessionSets(userId, exerciseIds).catch(() => new Map<string, LastSet[]>()),
    timeout,
  ])
}
