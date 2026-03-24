import { supabase } from "@/lib/supabase"
import type { WorkoutResult } from "@/stores/activeWorkoutStore"
import type { WorkoutSession } from "@/types/workout"

// --- Offline-safe workout persistence ---

const PENDING_WORKOUTS_KEY = "gymmat-pending-workouts"

interface PendingWorkout {
  id: string
  userId: string
  result: WorkoutResult
  rating: number | null
  queuedAt: string
}

function getPendingWorkouts(): PendingWorkout[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_WORKOUTS_KEY) || "[]")
  } catch {
    return []
  }
}

function savePendingWorkouts(workouts: PendingWorkout[]) {
  localStorage.setItem(PENDING_WORKOUTS_KEY, JSON.stringify(workouts))
}

export async function saveWorkoutWithOfflineSupport(
  userId: string,
  result: WorkoutResult,
  rating: number | null
): Promise<WorkoutSession | "queued"> {
  try {
    return await saveWorkout(userId, result, rating)
  } catch (error) {
    if (!navigator.onLine) {
      const pending = getPendingWorkouts()
      pending.push({
        id: crypto.randomUUID(),
        userId,
        result,
        rating,
        queuedAt: new Date().toISOString(),
      })
      savePendingWorkouts(pending)
      return "queued"
    }
    throw error
  }
}

export async function processPendingWorkouts() {
  const pending = getPendingWorkouts()
  if (pending.length === 0) return

  const remaining: PendingWorkout[] = []
  for (const w of pending) {
    try {
      await saveWorkout(w.userId, w.result, w.rating)
      console.log(`Synced pending workout from ${w.queuedAt}`)
    } catch {
      remaining.push(w)
    }
  }
  savePendingWorkouts(remaining)
}

// --- Core save logic ---

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
  // Collect all exercise IDs from this workout
  const exerciseIds = result.exercises
    .filter((ex) => ex.sets.some((s) => s.completed))
    .map((ex) => ex.exerciseId)

  if (exerciseIds.length === 0) return

  // Batch fetch ALL existing PRs for these exercises in one query
  const { data: existingPRs } = await supabase
    .from("personal_records")
    .select("exercise_id, record_type, value")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds)

  const prMap = new Map<string, number>()
  for (const pr of (existingPRs ?? []) as { exercise_id: string; record_type: string; value: number }[]) {
    prMap.set(`${pr.exercise_id}:${pr.record_type}`, pr.value)
  }

  // Compare and collect upserts
  const upserts: {
    user_id: string
    exercise_id: string
    record_type: "max_weight" | "max_reps" | "max_volume"
    value: number
    achieved_at: string
  }[] = []

  const now = new Date().toISOString()

  for (const exercise of result.exercises) {
    const completedSets = exercise.sets.filter((s) => s.completed)
    if (completedSets.length === 0) continue

    const maxWeight = Math.max(
      ...completedSets
        .filter((s) => s.weight != null && s.weight > 0)
        .map((s) => s.weight!),
      -Infinity
    )
    const maxReps = Math.max(
      ...completedSets
        .filter((s) => s.reps != null && s.reps > 0)
        .map((s) => s.reps!),
      -Infinity
    )
    const maxVolume = Math.max(
      ...completedSets
        .filter((s) => s.reps != null && s.weight != null)
        .map((s) => (s.reps ?? 0) * (s.weight ?? 0)),
      -Infinity
    )

    const candidates = [
      { type: "max_weight" as const, value: maxWeight },
      { type: "max_reps" as const, value: maxReps },
      { type: "max_volume" as const, value: maxVolume },
    ].filter((pr) => pr.value > 0 && isFinite(pr.value))

    for (const pr of candidates) {
      const existing = prMap.get(`${exercise.exerciseId}:${pr.type}`)
      if (existing == null || pr.value > existing) {
        upserts.push({
          user_id: userId,
          exercise_id: exercise.exerciseId,
          record_type: pr.type,
          value: pr.value,
          achieved_at: now,
        })
      }
    }
  }

  // Batch upsert all new PRs in one query
  if (upserts.length > 0) {
    await supabase
      .from("personal_records")
      .upsert(upserts, { onConflict: "user_id,exercise_id,record_type" })
  }
}
