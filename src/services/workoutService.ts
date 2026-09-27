import { supabase } from "@/lib/supabase"
import { queryClient } from "@/lib/queryClient"
import { toast } from "sonner"
import type { WorkoutResult } from "@/stores/activeWorkoutStore"
import type { WorkoutSession } from "@/types/workout"

// --- Durable save queue ---
//
// Every finished workout is written to localStorage FIRST, then synced to
// Supabase. It only leaves the queue once the server confirms the save, so a
// dead connection, a hung request or iOS killing the app can't lose it.
// Retries are safe: the session id is generated on the client and the
// `save_workout` RPC is idempotent on it.

const PENDING_WORKOUTS_KEY = "gymmat-pending-workouts"
const PENDING_CHANGED_EVENT = "gymmat-pending-changed"

export interface PendingWorkout {
  id: string
  userId: string
  result: WorkoutResult
  rating: number | null
  queuedAt: string
}

export function getPendingWorkouts(): PendingWorkout[] {
  try {
    const items: PendingWorkout[] = JSON.parse(
      localStorage.getItem(PENDING_WORKOUTS_KEY) || "[]"
    )
    // Entries queued by older app versions have no client session id.
    let migrated = false
    for (const w of items) {
      if (!w.result.sessionId) {
        w.result.sessionId = crypto.randomUUID()
        migrated = true
      }
    }
    if (migrated) writePendingWorkouts(items)
    return items
  } catch {
    return []
  }
}

function writePendingWorkouts(workouts: PendingWorkout[]) {
  localStorage.setItem(PENDING_WORKOUTS_KEY, JSON.stringify(workouts))
  window.dispatchEvent(new Event(PENDING_CHANGED_EVENT))
}

function enqueue(workout: PendingWorkout) {
  const pending = getPendingWorkouts().filter((w) => w.id !== workout.id)
  writePendingWorkouts([...pending, workout])
}

function dequeue(id: string) {
  writePendingWorkouts(getPendingWorkouts().filter((w) => w.id !== id))
}

/** Subscribe to queue changes (this tab and other tabs). */
export function subscribePendingWorkouts(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === PENDING_WORKOUTS_KEY) callback()
  }
  window.addEventListener(PENDING_CHANGED_EVENT, callback)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(PENDING_CHANGED_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}

// Syncs run one at a time: in this tab via a promise chain, across tabs via
// the Web Locks API where available. A run started while another is in flight
// waits for it and then picks up anything queued in the meantime.
let syncChain: Promise<unknown> = Promise.resolve()

function syncPending(): Promise<Set<string>> {
  const run = async (): Promise<Set<string>> =>
    navigator.locks
      ? await navigator.locks.request("gymmat-workout-sync", syncPendingNow)
      : syncPendingNow()
  const next = syncChain.then(run, run)
  syncChain = next.catch(() => {})
  return next
}

async function syncPendingNow(): Promise<Set<string>> {
  const synced = new Set<string>()
  const pending = getPendingWorkouts()
  if (pending.length === 0) return synced

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user.id
  if (!currentUserId) return synced

  for (const w of pending) {
    // Another account's workout stays queued until that user signs back in.
    if (w.userId !== currentUserId) continue
    try {
      await saveWorkout(w.result, w.rating)
      dequeue(w.id)
      synced.add(w.id)
    } catch (error) {
      if (import.meta.env.DEV) console.error("Workout sync failed:", error)
    }
  }

  if (synced.size > 0) invalidateWorkoutQueries()
  return synced
}

function invalidateWorkoutQueries() {
  for (const key of [
    "workout-history",
    "workout-days",
    "previous-sets",
    "personal-records",
    "exercise-history",
    "weekly-volume",
    "user-exercises",
  ]) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
}

/**
 * Queues the workout locally, then tries to sync it. Never throws: if the
 * network fails the workout stays queued and is retried automatically.
 */
export async function saveWorkoutWithOfflineSupport(
  userId: string,
  result: WorkoutResult,
  rating: number | null
): Promise<"saved" | "queued"> {
  enqueue({
    id: result.sessionId,
    userId,
    result,
    rating,
    queuedAt: new Date().toISOString(),
  })
  const synced = await syncPending()
  return synced.has(result.sessionId) ? "saved" : "queued"
}

/** Background retry (app start, back online, app foregrounded, manual). */
export async function processPendingWorkouts() {
  const synced = await syncPending()
  if (synced.size > 0) {
    toast.success(
      `${synced.size} pending workout${synced.size > 1 ? "s" : ""} synced`
    )
  }
  return synced
}

// --- Core save logic ---

/**
 * Saves session + completed sets + new personal records in one transaction
 * (`save_workout` RPC). Idempotent on `result.sessionId`.
 */
export async function saveWorkout(
  result: WorkoutResult,
  rating: number | null
): Promise<WorkoutSession> {
  const sets = result.exercises.flatMap((ex) =>
    ex.sets
      .filter((s) => s.completed)
      .map((s) => ({
        id: s.id,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        set_type: s.setType,
        reps: s.reps,
        weight: s.weight,
      }))
  )

  const { data, error } = await supabase.rpc("save_workout", {
    p_session: {
      id: result.sessionId,
      routine_id: result.routineId,
      name: result.routineName,
      started_at: result.startedAt,
      completed_at: result.completedAt,
      duration_seconds: result.durationSeconds,
      rating,
    },
    p_sets: sets,
  })

  if (error) throw error
  return data as WorkoutSession
}
