import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Play,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  TrendingUp,
  ArrowRight,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useActiveWorkoutStore } from "@/stores/activeWorkoutStore"
import { useTimerStore } from "@/stores/timerStore"
import { useAuth } from "@/hooks/useAuth"
import { SetLogger } from "@/components/workout/SetLogger"
import { WorkoutTimer } from "@/components/workout/WorkoutTimer"
import { RestTimer } from "@/components/workout/RestTimer"
import { WorkoutSummary } from "@/components/workout/WorkoutSummary"
import { saveWorkoutWithOfflineSupport } from "@/services/workoutService"
import { toast } from "sonner"
import { useWakeLock } from "@/hooks/useWakeLock"
import { usePreviousSets } from "@/hooks/usePreviousSets"
import { GifPreviewDialog } from "@/components/exercises/GifPreviewDialog"
import { useConfirm } from "@/components/ConfirmDialog"
import { useWeightUnit } from "@/hooks/useWeightUnit"
import { suggestNextWeight, topOfRepRange } from "@/lib/weightUnits"

export function WorkoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const confirm = useConfirm()

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
    applyWeightToRemaining,
    finishWorkout,
    cancelWorkout,
    pendingResult: workoutResult,
    clearPendingResult,
  } = useActiveWorkoutStore()

  const { startTimer } = useTimerStore()
  useWakeLock(isActive)

  const [saving, setSaving] = useState(false)
  const [previewGif, setPreviewGif] = useState<{
    url: string; name: string
  } | null>(null)

  const { unit, format } = useWeightUnit()
  const currentExercise = exercises[currentExerciseIndex]
  const fetchedPreviousSets = usePreviousSets(currentExercise?.exerciseId)
  // Prefer the snapshot taken when the workout started (works offline).
  const previousSets =
    currentExercise?.lastSets?.map((s) => ({
      set_number: s.setNumber,
      weight: s.weight,
      reps: s.reps,
    })) ?? fetchedPreviousSets

  const suggestedWeight = currentExercise
    ? suggestNextWeight(currentExercise.lastSets, currentExercise.targetReps, unit)
    : null
  const showSuggestion =
    suggestedWeight != null &&
    currentExercise.sets.some((s) => !s.completed && s.weight !== suggestedWeight)
  const currentDone =
    !!currentExercise &&
    currentExercise.sets.length > 0 &&
    currentExercise.sets.every((s) => s.completed)
  const nextExercise = exercises[currentExerciseIndex + 1]

  const handleFinish = async () => {
    const completedSets = exercises.flatMap((ex) =>
      ex.sets.filter((s) => s.completed)
    )
    if (completedSets.length === 0) {
      if (
        await confirm({
          title: "Discard workout?",
          description: "No sets were completed, so nothing will be saved.",
          confirmLabel: "Discard",
          destructive: true,
        })
      ) {
        cancelWorkout()
        navigate("/")
      }
      return
    }

    finishWorkout()
  }

  const handleSaveWorkout = async (rating: number | null) => {
    if (!workoutResult || !user) return
    setSaving(true)
    // Queues locally before touching the network and never throws, so the
    // pending result can always be cleared afterwards (a retry is idempotent).
    const outcome = await saveWorkoutWithOfflineSupport(user.id, workoutResult, rating)
    clearPendingResult()
    if (outcome === "saved") {
      toast.success("Workout saved")
    } else {
      toast.info("Saved on this device. It will sync automatically when the connection is back.")
    }
    navigate("/")
  }

  const handleCancel = async () => {
    if (
      await confirm({
        title: "Cancel workout?",
        description: "All progress in this session will be lost.",
        confirmLabel: "Cancel workout",
        cancelLabel: "Keep going",
        destructive: true,
      })
    ) {
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
            <WorkoutTimer startedAt={startedAt} />
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
                    ? ` @ ${format(currentExercise.targetWeight)}`
                    : ""}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  Rest: {currentExercise.restSeconds}s
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Progression hint */}
          {showSuggestion && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2">
              <TrendingUp className="h-5 w-5 shrink-0 text-green-500" />
              <p className="flex-1 text-sm">
                You hit {topOfRepRange(currentExercise.targetReps)} reps on every set last
                time. Try <span className="font-semibold">{format(suggestedWeight)}</span>
              </p>
              <Button
                size="sm"
                className="h-9"
                onClick={() => applyWeightToRemaining(currentExerciseIndex, suggestedWeight)}
              >
                Apply
              </Button>
            </div>
          )}

          {/* Set Logger */}
          <SetLogger
            sets={currentExercise.sets}
            targetReps={currentExercise.targetReps}
            previousSets={previousSets}
            onUpdateSet={(setIndex, updates) =>
              updateSet(currentExerciseIndex, setIndex, updates)
            }
            onCompleteSet={(setIndex) =>
              completeSet(currentExerciseIndex, setIndex)
            }
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

          {/* Next step once every set of this exercise is done */}
          {currentDone &&
            (nextExercise ? (
              <Button
                size="lg"
                className="h-12 w-full"
                onClick={() => setCurrentExercise(currentExerciseIndex + 1)}
              >
                <span className="truncate capitalize">Next: {nextExercise.exerciseName}</span>
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            ) : (
              <Button size="lg" className="h-12 w-full" onClick={handleFinish}>
                <Flag className="mr-2 h-4 w-4" />
                Finish workout
              </Button>
            ))}
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
