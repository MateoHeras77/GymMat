import { supabase } from "@/lib/supabase"
import type { WorkoutResult } from "@/stores/activeWorkoutStore"
import type { WorkoutSession } from "@/types/workout"

export async function saveWorkout(
  userId: string,
  result: WorkoutResult,
  rating: number | null
) {
  // 1. Create session
  const { data: sessionData, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      routine_id: result.routineId,
      name: result.routineName,
      started_at: result.startedAt,
      completed_at: result.completedAt,
      duration_seconds: result.durationSeconds,
      rating,
    })
    .select()
    .single()

  if (sessionError) throw sessionError
  const session = sessionData as unknown as WorkoutSession

  // 2. Insert all completed sets
  const completedSets = result.exercises.flatMap((ex) =>
    ex.sets
      .filter((s) => s.completed)
      .map((s) => ({
        session_id: session.id,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        set_type: s.setType,
        reps: s.reps,
        weight: s.weight,
        is_pr: s.isPR,
        completed_at: result.completedAt,
      }))
  )

  if (completedSets.length > 0) {
    const { error: setsError } = await supabase
      .from("workout_sets")
      .insert(completedSets)

    if (setsError) throw setsError
  }

  // 3. Check and update personal records
  await checkAndUpdatePRs(userId, result)

  return session
}

async function checkAndUpdatePRs(userId: string, result: WorkoutResult) {
  for (const exercise of result.exercises) {
    const completedSets = exercise.sets.filter((s) => s.completed)
    if (completedSets.length === 0) continue

    // Max weight for this exercise in this workout
    const maxWeight = Math.max(
      ...completedSets
        .filter((s) => s.weight != null && s.weight > 0)
        .map((s) => s.weight!)
    )

    // Max reps for this exercise in this workout
    const maxReps = Math.max(
      ...completedSets
        .filter((s) => s.reps != null && s.reps > 0)
        .map((s) => s.reps!)
    )

    // Max volume (single set) = reps * weight
    const maxVolume = Math.max(
      ...completedSets
        .filter((s) => s.reps != null && s.weight != null)
        .map((s) => (s.reps ?? 0) * (s.weight ?? 0))
    )

    const prsToCheck = [
      { type: "max_weight" as const, value: maxWeight },
      { type: "max_reps" as const, value: maxReps },
      { type: "max_volume" as const, value: maxVolume },
    ].filter((pr) => pr.value > 0 && isFinite(pr.value))

    for (const pr of prsToCheck) {
      // Check current record
      const { data: existingData } = await supabase
        .from("personal_records")
        .select("*")
        .eq("user_id", userId)
        .eq("exercise_id", exercise.exerciseId)
        .eq("record_type", pr.type)
        .single()

      const existing = existingData as { value: number } | null

      if (!existing || pr.value > existing.value) {
        // New PR!
        await supabase.from("personal_records").upsert(
          {
            user_id: userId,
            exercise_id: exercise.exerciseId,
            record_type: pr.type,
            value: pr.value,
            achieved_at: new Date().toISOString(),
          },
          { onConflict: "user_id,exercise_id,record_type" }
        )
      }
    }
  }
}
