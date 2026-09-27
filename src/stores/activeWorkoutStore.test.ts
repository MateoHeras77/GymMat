import { beforeEach, describe, expect, it } from "vitest"
import { useActiveWorkoutStore, type ActiveExercise } from "./activeWorkoutStore"

const exercise: ActiveExercise = {
  exerciseId: "0025",
  exerciseName: "barbell bench press",
  gifUrl: null,
  targetSets: 3,
  targetReps: "8-10",
  targetWeight: 135,
  restSeconds: 90,
  sets: [],
}

function persisted() {
  return JSON.parse(localStorage.getItem("gymmat-active-workout") || "{}").state
}

beforeEach(() => {
  localStorage.clear()
  useActiveWorkoutStore.setState({
    isActive: false,
    routineId: null,
    routineName: "",
    startedAt: null,
    currentExerciseIndex: 0,
    exercises: [],
    pendingResult: null,
  })
})

describe("finishWorkout", () => {
  it("keeps the finished workout persisted until it is cleared", () => {
    const store = useActiveWorkoutStore.getState()
    store.startWorkout("routine-1", "Push", [exercise])
    store.completeSet(0, 0)

    const result = useActiveWorkoutStore.getState().finishWorkout()

    expect(result?.sessionId).toMatch(/^[0-9a-f-]{36}$/)
    expect(result?.totalSets).toBe(1)
    // Survives a reload / iOS app kill: it's in localStorage, not just memory.
    expect(persisted().pendingResult.sessionId).toBe(result?.sessionId)
    expect(persisted().isActive).toBe(false)

    useActiveWorkoutStore.getState().clearPendingResult()
    expect(persisted().pendingResult).toBeNull()
  })

  it("starting another workout does not discard an unsaved finished one", () => {
    const store = useActiveWorkoutStore.getState()
    store.startWorkout("routine-1", "Push", [exercise])
    store.completeSet(0, 0)
    const result = useActiveWorkoutStore.getState().finishWorkout()

    useActiveWorkoutStore.getState().startWorkout("routine-2", "Pull", [exercise])

    expect(useActiveWorkoutStore.getState().pendingResult?.sessionId).toBe(result?.sessionId)
  })
})

describe("set prefill", () => {
  const withHistory: ActiveExercise = {
    ...exercise,
    lastSets: [
      { setNumber: 1, setType: "warmup", weight: 95, reps: 5 },
      { setNumber: 2, setType: "working", weight: 135, reps: 10 },
      { setNumber: 3, setType: "working", weight: 140, reps: 8 },
    ],
  }

  it("starts each set at last session's weight (skipping warmups) and the rep goal", () => {
    useActiveWorkoutStore.getState().startWorkout("r", "Push", [withHistory])
    const sets = useActiveWorkoutStore.getState().exercises[0].sets
    expect(sets.map((s) => s.weight)).toEqual([135, 140, 140])
    expect(sets.map((s) => s.reps)).toEqual([10, 10, 10])
  })

  it("falls back to the routine target weight without history", () => {
    useActiveWorkoutStore.getState().startWorkout("r", "Push", [exercise])
    expect(useActiveWorkoutStore.getState().exercises[0].sets[0].weight).toBe(135)
  })

  it("carries a completed set's numbers into the blank sets after it", () => {
    const store = useActiveWorkoutStore.getState()
    store.startWorkout("r", "Push", [{ ...exercise, targetWeight: null }])
    store.updateSet(0, 0, { weight: 100, reps: 9 })
    store.updateSet(0, 2, { weight: 110 })
    store.completeSet(0, 0)

    const sets = useActiveWorkoutStore.getState().exercises[0].sets
    expect(sets[1].weight).toBe(100)
    expect(sets[2].weight).toBe(110) // user-entered values are kept
  })

  it("new sets copy the previous set", () => {
    const store = useActiveWorkoutStore.getState()
    store.startWorkout("r", "Push", [exercise])
    store.updateSet(0, 2, { weight: 150, reps: 6 })
    store.addSet(0)
    const last = useActiveWorkoutStore.getState().exercises[0].sets.at(-1)!
    expect(last).toMatchObject({ setNumber: 4, weight: 150, reps: 6 })
  })

  it("applyWeightToRemaining only touches sets that aren't done", () => {
    const store = useActiveWorkoutStore.getState()
    store.startWorkout("r", "Push", [exercise])
    store.completeSet(0, 0)
    store.applyWeightToRemaining(0, 140)
    const sets = useActiveWorkoutStore.getState().exercises[0].sets
    expect(sets.map((s) => s.weight)).toEqual([135, 140, 140])
  })
})
