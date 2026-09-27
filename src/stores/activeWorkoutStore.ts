import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ActiveSet {
  id: string
  exerciseId: string
  setNumber: number
  setType: "warmup" | "working" | "drop" | "failure"
  reps: number | null
  weight: number | null
  completed: boolean
  isPR: boolean
}

export interface ActiveExercise {
  exerciseId: string
  exerciseName: string
  gifUrl: string | null
  targetSets: number
  targetReps: string
  targetWeight: number | null
  restSeconds: number
  sets: ActiveSet[]
}

interface ActiveWorkoutState {
  // Workout metadata
  isActive: boolean
  routineId: string | null
  routineName: string
  startedAt: string | null
  currentExerciseIndex: number

  // Exercises and sets
  exercises: ActiveExercise[]

  // A finished workout that hasn't been handed to the save queue yet (the user
  // is still on the summary screen). Persisted so an iOS app kill or reload on
  // the summary screen never loses the workout.
  pendingResult: WorkoutResult | null

  // Actions
  startWorkout: (
    routineId: string | null,
    routineName: string,
    exercises: ActiveExercise[]
  ) => void
  setCurrentExercise: (index: number) => void
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<ActiveSet>
  ) => void
  completeSet: (exerciseIndex: number, setIndex: number) => void
  addSet: (exerciseIndex: number) => void
  removeSet: (exerciseIndex: number, setIndex: number) => void
  changeSetType: (
    exerciseIndex: number,
    setIndex: number,
    type: ActiveSet["setType"]
  ) => void
  finishWorkout: () => WorkoutResult | null
  clearPendingResult: () => void
  cancelWorkout: () => void
}

export interface WorkoutResult {
  /** Client-generated workout_sessions.id — makes save retries idempotent. */
  sessionId: string
  routineId: string | null
  routineName: string
  startedAt: string
  completedAt: string
  durationSeconds: number
  exercises: ActiveExercise[]
  totalSets: number
  totalReps: number
  totalVolume: number
}

function generateSetId(): string {
  return crypto.randomUUID()
}

function parseTargetReps(targetReps: string): number | null {
  // Handle ranges like "8-12" → take the higher end
  const match = targetReps.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (match) return parseInt(match[2])
  const single = parseInt(targetReps)
  return isNaN(single) ? null : single
}

function createSetsForExercise(exercise: ActiveExercise): ActiveSet[] {
  const reps = parseTargetReps(exercise.targetReps)
  return Array.from({ length: exercise.targetSets }, (_, i) => ({
    id: generateSetId(),
    exerciseId: exercise.exerciseId,
    setNumber: i + 1,
    setType: "working" as const,
    reps,
    weight: exercise.targetWeight,
    completed: false,
    isPR: false,
  }))
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      isActive: false,
      routineId: null,
      routineName: "",
      startedAt: null,
      currentExerciseIndex: 0,
      exercises: [],
      pendingResult: null,

      startWorkout: (routineId, routineName, exercises) => {
        const withSets = exercises.map((ex) => ({
          ...ex,
          sets: createSetsForExercise(ex),
        }))
        set({
          isActive: true,
          routineId,
          routineName,
          startedAt: new Date().toISOString(),
          currentExerciseIndex: 0,
          exercises: withSets,
        })
      },

      setCurrentExercise: (index) => {
        set({ currentExerciseIndex: index })
      },

      updateSet: (exerciseIndex, setIndex, updates) => {
        const exercises = [...get().exercises]
        const sets = [...exercises[exerciseIndex].sets]
        sets[setIndex] = { ...sets[setIndex], ...updates }
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
        set({ exercises })
      },

      completeSet: (exerciseIndex, setIndex) => {
        const exercises = [...get().exercises]
        const sets = [...exercises[exerciseIndex].sets]
        sets[setIndex] = { ...sets[setIndex], completed: true }
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
        set({ exercises })
      },

      addSet: (exerciseIndex) => {
        const exercises = [...get().exercises]
        const ex = exercises[exerciseIndex]
        const newSet: ActiveSet = {
          id: generateSetId(),
          exerciseId: ex.exerciseId,
          setNumber: ex.sets.length + 1,
          setType: "working",
          reps: null,
          weight: ex.targetWeight,
          completed: false,
          isPR: false,
        }
        exercises[exerciseIndex] = {
          ...ex,
          sets: [...ex.sets, newSet],
        }
        set({ exercises })
      },

      removeSet: (exerciseIndex, setIndex) => {
        const exercises = [...get().exercises]
        const sets = exercises[exerciseIndex].sets.filter(
          (_, i) => i !== setIndex
        )
        // Renumber
        const renumbered = sets.map((s, i) => ({
          ...s,
          setNumber: i + 1,
        }))
        exercises[exerciseIndex] = {
          ...exercises[exerciseIndex],
          sets: renumbered,
        }
        set({ exercises })
      },

      changeSetType: (exerciseIndex, setIndex, type) => {
        const exercises = [...get().exercises]
        const sets = [...exercises[exerciseIndex].sets]
        sets[setIndex] = { ...sets[setIndex], setType: type }
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
        set({ exercises })
      },

      finishWorkout: () => {
        const state = get()
        if (!state.isActive || !state.startedAt) return null

        const completedAt = new Date().toISOString()
        const durationSeconds = Math.floor(
          (new Date(completedAt).getTime() -
            new Date(state.startedAt).getTime()) /
            1000
        )

        const completedSets = state.exercises.flatMap((ex) =>
          ex.sets.filter((s) => s.completed)
        )

        const result: WorkoutResult = {
          sessionId: crypto.randomUUID(),
          routineId: state.routineId,
          routineName: state.routineName,
          startedAt: state.startedAt,
          completedAt,
          durationSeconds,
          exercises: state.exercises,
          totalSets: completedSets.length,
          totalReps: completedSets.reduce((sum, s) => sum + (s.reps ?? 0), 0),
          totalVolume: completedSets.reduce(
            (sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0),
            0
          ),
        }

        // Swap the active workout for the pending result in a single persisted
        // write, so there is no moment where the workout exists nowhere.
        set({
          isActive: false,
          routineId: null,
          routineName: "",
          startedAt: null,
          currentExerciseIndex: 0,
          exercises: [],
          pendingResult: result,
        })

        return result
      },

      clearPendingResult: () => {
        set({ pendingResult: null })
      },

      cancelWorkout: () => {
        set({
          isActive: false,
          routineId: null,
          routineName: "",
          startedAt: null,
          currentExerciseIndex: 0,
          exercises: [],
        })
      },
    }),
    {
      name: "gymmat-active-workout",
    }
  )
)
