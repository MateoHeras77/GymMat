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
