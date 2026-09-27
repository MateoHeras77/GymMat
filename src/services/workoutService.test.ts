import { beforeEach, describe, expect, it, vi } from "vitest"
import type { WorkoutResult } from "@/stores/activeWorkoutStore"

// --- Supabase mock -----------------------------------------------------------
const rpc = vi.fn()
let currentUserId: string | null = "user-1"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    auth: {
      getSession: async () => ({
        data: { session: currentUserId ? { user: { id: currentUserId } } : null },
      }),
    },
  },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }))

const {
  saveWorkoutWithOfflineSupport,
  processPendingWorkouts,
  getPendingWorkouts,
} = await import("./workoutService")

// --- Helpers -----------------------------------------------------------------
function makeResult(overrides: Partial<WorkoutResult> = {}): WorkoutResult {
  return {
    sessionId: crypto.randomUUID(),
    routineId: null,
    routineName: "Push",
    startedAt: "2026-09-27T10:00:00.000Z",
    completedAt: "2026-09-27T11:00:00.000Z",
    durationSeconds: 3600,
    exercises: [
      {
        exerciseId: "0025",
        exerciseName: "barbell bench press",
        gifUrl: null,
        targetSets: 2,
        targetReps: "8",
        targetWeight: 135,
        restSeconds: 90,
        sets: [
          { id: crypto.randomUUID(), exerciseId: "0025", setNumber: 1, setType: "working", reps: 8, weight: 135, completed: true, isPR: false },
          { id: crypto.randomUUID(), exerciseId: "0025", setNumber: 2, setType: "working", reps: null, weight: 135, completed: false, isPR: false },
        ],
      },
    ],
    totalSets: 1,
    totalReps: 8,
    totalVolume: 1080,
    ...overrides,
  }
}

const ok = () => Promise.resolve({ data: { id: "s" }, error: null })
const networkError = () => Promise.resolve({ data: null, error: new Error("TypeError: Failed to fetch") })

beforeEach(() => {
  localStorage.clear()
  rpc.mockReset()
  currentUserId = "user-1"
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true })
})

// --- Tests -------------------------------------------------------------------
describe("saveWorkoutWithOfflineSupport", () => {
  it("saves through the save_workout RPC and leaves the queue empty", async () => {
    rpc.mockImplementation(ok)
    const result = makeResult()

    await expect(saveWorkoutWithOfflineSupport("user-1", result, 4)).resolves.toBe("saved")

    expect(rpc).toHaveBeenCalledTimes(1)
    const [fn, args] = rpc.mock.calls[0]
    expect(fn).toBe("save_workout")
    expect(args.p_session).toMatchObject({ id: result.sessionId, name: "Push", rating: 4 })
    // Only completed sets are sent, keeping their client ids.
    expect(args.p_sets).toEqual([
      expect.objectContaining({ id: result.exercises[0].sets[0].id, reps: 8, weight: 135 }),
    ])
    expect(getPendingWorkouts()).toHaveLength(0)
  })

  it("queues the workout when the request fails even though navigator.onLine is true", async () => {
    rpc.mockImplementation(networkError)
    const result = makeResult()

    await expect(saveWorkoutWithOfflineSupport("user-1", result, null)).resolves.toBe("queued")

    const pending = getPendingWorkouts()
    expect(pending).toHaveLength(1)
    expect(pending[0].result.sessionId).toBe(result.sessionId)
  })

  it("queues when the request throws (timeout / abort)", async () => {
    rpc.mockImplementation(() => Promise.reject(new DOMException("timed out", "TimeoutError")))

    await expect(saveWorkoutWithOfflineSupport("user-1", makeResult(), null)).resolves.toBe("queued")
    expect(getPendingWorkouts()).toHaveLength(1)
  })

  it("writes to the queue before the network call starts", async () => {
    let queuedDuringRequest = -1
    rpc.mockImplementation(() => {
      queuedDuringRequest = getPendingWorkouts().length
      return ok()
    })

    await saveWorkoutWithOfflineSupport("user-1", makeResult(), null)
    expect(queuedDuringRequest).toBe(1)
  })

  it("does not duplicate the queue entry when the same workout is saved twice", async () => {
    rpc.mockImplementation(networkError)
    const result = makeResult()

    await saveWorkoutWithOfflineSupport("user-1", result, null)
    await saveWorkoutWithOfflineSupport("user-1", result, 5)

    const pending = getPendingWorkouts()
    expect(pending).toHaveLength(1)
    expect(pending[0].rating).toBe(5)
  })
})

describe("processPendingWorkouts", () => {
  it("retries with the same session id and dequeues on success", async () => {
    rpc.mockImplementation(networkError)
    const result = makeResult()
    await saveWorkoutWithOfflineSupport("user-1", result, null)

    rpc.mockImplementation(ok)
    const synced = await processPendingWorkouts()

    expect(synced.has(result.sessionId)).toBe(true)
    expect(rpc.mock.calls.at(-1)?.[1].p_session.id).toBe(result.sessionId)
    expect(getPendingWorkouts()).toHaveLength(0)
  })

  it("runs overlapping syncs one at a time so a workout is sent only once", async () => {
    rpc.mockImplementation(networkError)
    await saveWorkoutWithOfflineSupport("user-1", makeResult(), null)
    rpc.mockReset()

    let inFlight = 0
    let maxInFlight = 0
    rpc.mockImplementation(async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((r) => setTimeout(r, 20))
      inFlight--
      return { data: { id: "s" }, error: null }
    })

    // Startup + "online" + "visibilitychange" firing together.
    await Promise.all([processPendingWorkouts(), processPendingWorkouts(), processPendingWorkouts()])

    expect(maxInFlight).toBe(1)
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(getPendingWorkouts()).toHaveLength(0)
  })

  it("keeps another account's workouts queued", async () => {
    rpc.mockImplementation(networkError)
    await saveWorkoutWithOfflineSupport("user-1", makeResult(), null)

    currentUserId = "user-2"
    rpc.mockReset()
    rpc.mockImplementation(ok)
    await processPendingWorkouts()

    expect(rpc).not.toHaveBeenCalled()
    expect(getPendingWorkouts()).toHaveLength(1)
  })

  it("keeps the queue when signed out", async () => {
    rpc.mockImplementation(networkError)
    await saveWorkoutWithOfflineSupport("user-1", makeResult(), null)

    currentUserId = null
    rpc.mockReset()
    await processPendingWorkouts()

    expect(rpc).not.toHaveBeenCalled()
    expect(getPendingWorkouts()).toHaveLength(1)
  })

  it("assigns a session id to entries queued by older app versions", async () => {
    const legacy = makeResult() as Partial<WorkoutResult>
    delete legacy.sessionId
    localStorage.setItem(
      "gymmat-pending-workouts",
      JSON.stringify([{ id: "old", userId: "user-1", result: legacy, rating: null, queuedAt: "" }])
    )

    const first = getPendingWorkouts()[0].result.sessionId
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    // Stable across reads, so retries stay idempotent.
    expect(getPendingWorkouts()[0].result.sessionId).toBe(first)
  })
})
