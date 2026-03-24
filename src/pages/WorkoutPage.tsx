import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Play,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  useActiveWorkoutStore,
  type WorkoutResult,
} from "@/stores/activeWorkoutStore"
import { useTimerStore } from "@/stores/timerStore"
import { useAuth } from "@/hooks/useAuth"
import { SetLogger } from "@/components/workout/SetLogger"
import { RestTimer } from "@/components/workout/RestTimer"
import { WorkoutSummary } from "@/components/workout/WorkoutSummary"
import { saveWorkoutWithOfflineSupport } from "@/services/workoutService"
import { toast } from "sonner"
import { useWakeLock } from "@/hooks/useWakeLock"
import { usePreviousSets } from "@/hooks/usePreviousSets"
import { formatDuration } from "@/lib/constants"
import { GifPreviewDialog } from "@/components/exercises/GifPreviewDialog"

export function WorkoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    isActive,
    routineName,
    startedAt,
    currentExerciseIndex,
    exercises,
    setCurrentExercise,
    updateSet,
    completeSet,
    addSet,
    removeSet,
    changeSetType,
    finishWorkout,
    cancelWorkout,
  } = useActiveWorkoutStore()

  const { startTimer } = useTimerStore()
  useWakeLock(isActive)

  // Request notification permission once on first workout
  useEffect(() => {
    if (isActive && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [isActive])
  const [workoutResult, setWorkoutResult] = useState<WorkoutResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [previewGif, setPreviewGif] = useState<{
    url: string; name: string
  } | null>(null)

  // Elapsed time ticker
  useEffect(() => {
    if (!isActive || !startedAt) return
    const interval = setInterval(() => {
      setElapsed(
        Math.floor(
          (Date.now() - new Date(startedAt).getTime()) / 1000
        )
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, startedAt])

  const currentExercise = exercises[currentExerciseIndex]
  const previousSets = usePreviousSets(currentExercise?.exerciseId)

  const handleFinish = () => {
    const completedSets = exercises.flatMap((ex) =>
      ex.sets.filter((s) => s.completed)
    )
    if (completedSets.length === 0) {
      if (confirm("No sets completed. Discard workout?")) {
        cancelWorkout()
        navigate("/")
      }
      return
    }

    const result = finishWorkout()
    if (result) {
      setWorkoutResult(result)
    }
  }

  const handleSaveWorkout = async (rating: number | null) => {
    if (!workoutResult || !user) return
    setSaving(true)
    try {
      const result = await saveWorkoutWithOfflineSupport(user.id, workoutResult, rating)
      if (result === "queued") {
        toast.info("Workout saved offline. It will sync when you're back online.")
      }
      setWorkoutResult(null)
      navigate("/")
    } catch (err) {
      console.error("Failed to save workout:", err)
      toast.error("Failed to save workout. Please try again.")
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (confirm("Cancel workout? All progress will be lost.")) {
      cancelWorkout()
      navigate("/")
    }
  }

  // Show summary if workout finished
  if (workoutResult) {
    return (
      <WorkoutSummary
        result={workoutResult}
        onSave={handleSaveWorkout}
        saving={saving}
      />
    )
  }

  // Show start screen if no active workout
  if (!isActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Workout</h1>
          <p className="text-sm text-muted-foreground">
            Start a new workout session
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              Select a routine to start your workout
            </p>
            <Button onClick={() => navigate("/routines")}>
              <Play className="mr-2 h-4 w-4" />
              Choose Routine
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active workout view
  return (
    <div className="space-y-4 pb-20">
      {/* Workout header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{routineName}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(elapsed)}</span>
            <span>·</span>
            <span>
              {exercises.flatMap((e) => e.sets).filter((s) => s.completed).length}{" "}
              sets done
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="destructive" size="sm" onClick={handleCancel}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleFinish}>
            Finish
          </Button>
        </div>
      </div>

      {/* Exercise navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCurrentExercise(currentExerciseIndex - 1)}
          disabled={currentExerciseIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {exercises.map((ex, i) => {
            const completed = ex.sets.filter((s) => s.completed).length
            const total = ex.sets.length
            const allDone = completed === total && total > 0

            return (
              <button
                key={ex.exerciseId}
                onClick={() => setCurrentExercise(i)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  i === currentExerciseIndex
                    ? "bg-primary text-primary-foreground"
                    : allDone
                      ? "bg-green-500/20 text-green-600"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCurrentExercise(currentExerciseIndex + 1)}
          disabled={currentExerciseIndex === exercises.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Current exercise */}
      {currentExercise && (
        <div className="space-y-4">
          {/* Exercise info */}
          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              {currentExercise.gifUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewGif({
                      url: currentExercise.gifUrl!,
                      name: currentExercise.exerciseName,
                    })
                  }
                >
                  <img
                    src={currentExercise.gifUrl}
                    alt={currentExercise.exerciseName}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-secondary">
                  <Dumbbell className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold capitalize text-base">
                  {currentExercise.exerciseName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Target: {currentExercise.targetSets} × {currentExercise.targetReps}
                  {currentExercise.targetWeight
                    ? ` @ ${currentExercise.targetWeight} lbs`
                    : ""}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  Rest: {currentExercise.restSeconds}s
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Set Logger */}
          <SetLogger
            sets={currentExercise.sets}
            targetReps={currentExercise.targetReps}
            previousSets={previousSets}
            onUpdateSet={(setIndex, updates) =>
              updateSet(currentExerciseIndex, setIndex, updates)
            }
            onCompleteSet={(setIndex) => {
              completeSet(currentExerciseIndex, setIndex)
              // Auto-advance to next exercise if all sets done
              const ex = exercises[currentExerciseIndex]
              const completedAfter =
                ex.sets.filter((s) => s.completed).length + 1
              if (
                completedAfter === ex.sets.length &&
                currentExerciseIndex < exercises.length - 1
              ) {
                // Don't auto-advance, let user navigate
              }
            }}
            onAddSet={() => addSet(currentExerciseIndex)}
            onRemoveSet={(setIndex) =>
              removeSet(currentExerciseIndex, setIndex)
            }
            onChangeSetType={(setIndex, type) =>
              changeSetType(currentExerciseIndex, setIndex, type)
            }
            onRestTimer={(seconds) => startTimer(seconds)}
            restSeconds={currentExercise.restSeconds}
          />
        </div>
      )}

      {/* GIF Preview */}
      <GifPreviewDialog
        open={!!previewGif}
        onOpenChange={(open) => !open && setPreviewGif(null)}
        gifUrl={previewGif?.url ?? ""}
        exerciseName={previewGif?.name ?? ""}
      />

      {/* Rest Timer overlay */}
      <RestTimer />
    </div>
  )
}
