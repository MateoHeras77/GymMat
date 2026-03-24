import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Plus,
  Settings2,
  Trash2,
  Play,
  ChevronUp,
  ChevronDown,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  useRoutineExercises,
  type RoutineExerciseWithDetails,
} from "@/hooks/useRoutineExercises"
import { useRoutines } from "@/hooks/useRoutines"
import { ExercisePicker } from "@/components/exercises/ExercisePicker"
import { ExerciseConfigSheet } from "@/components/routines/ExerciseConfigSheet"
import { downloadExerciseGif } from "@/services/gifService"
import { getGifUrl } from "@/types/exercise"
import type { Routine } from "@/types/routine"
import type { Exercise } from "@/types/exercise"

export function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [configExercise, setConfigExercise] =
    useState<RoutineExerciseWithDetails | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [downloadingGif, setDownloadingGif] = useState<string | null>(null)

  const { data: routine, isLoading: routineLoading } = useQuery({
    queryKey: ["routine", id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw error
      return data as Routine
    },
    enabled: !!id,
  })

  const {
    routineExercises,
    isLoading: exercisesLoading,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
  } = useRoutineExercises(id)

  const { deleteRoutine } = useRoutines()

  const handleConfirmExercises = async (
    toAdd: Exercise[],
    toRemove: string[]
  ) => {
    if (!id) return

    // Remove exercises
    for (const exerciseId of toRemove) {
      const re = routineExercises.find((r) => r.exercise_id === exerciseId)
      if (re) {
        removeExercise.mutate(re.id)
      }
    }

    // Add exercises
    for (const exercise of toAdd) {
      await addExercise.mutateAsync({
        exercise_id: exercise.id,
      })

      // Download GIF in background if not already downloaded
      if (!exercise.gif_url_180 && !exercise.gif_url_hd) {
        setDownloadingGif(exercise.id)
        await downloadExerciseGif(exercise.id)
        setDownloadingGif(null)
      }
    }
  }

  const handleConfigSave = (
    exerciseId: string,
    updates: {
      target_sets: number
      target_reps: string
      target_weight: number | null
      rest_seconds: number
      notes: string | null
      superset_group: number | null
    }
  ) => {
    updateExercise.mutate({ id: exerciseId, ...updates })
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    const newOrder = [...routineExercises]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newOrder.length) return
    ;[newOrder[index], newOrder[swapIndex]] = [
      newOrder[swapIndex],
      newOrder[index],
    ]
    reorderExercises.mutate(newOrder.map((e) => e.id))
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm("Archive this routine?")) return
    await deleteRoutine.mutateAsync(id)
    navigate("/routines")
  }

  if (routineLoading || exercisesLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 pt-4" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Routine not found</p>
        <Button className="mt-4" onClick={() => navigate("/routines")}>
          Back to Routines
        </Button>
      </div>
    )
  }

  // Group exercises by superset
  const groups: { group: number | null; exercises: RoutineExerciseWithDetails[] }[] = []
  let currentGroup: typeof groups[0] | null = null

  routineExercises.forEach((re) => {
    if (re.superset_group !== null) {
      if (currentGroup && currentGroup.group === re.superset_group) {
        currentGroup.exercises.push(re)
      } else {
        currentGroup = { group: re.superset_group, exercises: [re] }
        groups.push(currentGroup)
      }
    } else {
      currentGroup = null
      groups.push({ group: null, exercises: [re] })
    }
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/routines")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{routine.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {routine.template_type && (
              <Badge variant="secondary" className="capitalize">
                {routine.template_type}
              </Badge>
            )}
            {routine.estimated_duration_min && (
              <span className="text-xs text-muted-foreground">
                ~{routine.estimated_duration_min} min
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {routineExercises.length} exercises
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {routine.description && (
        <p className="text-sm text-muted-foreground">{routine.description}</p>
      )}

      {/* Start Workout Button */}
      {routineExercises.length > 0 && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate(`/workout?routine=${id}`)}
        >
          <Play className="mr-2 h-4 w-4" />
          Start Workout
        </Button>
      )}

      {/* Exercise List */}
      <div className="space-y-2">
        {groups.map((group, gi) => {
          const isSuperset =
            group.group !== null && group.exercises.length > 1

          return (
            <div
              key={gi}
              className={
                isSuperset
                  ? "rounded-lg border-2 border-dashed border-primary/30 p-2 space-y-2"
                  : ""
              }
            >
              {isSuperset && (
                <div className="flex items-center gap-1.5 px-1">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    Superset {group.group}
                  </span>
                </div>
              )}
              {group.exercises.map((re) => {
                const globalIndex = routineExercises.indexOf(re)
                const gifUrl = getGifUrl(re.exercise)
                const isDownloading = downloadingGif === re.exercise.id

                return (
                  <Card key={re.id}>
                    <CardContent className="flex items-center gap-2 py-2.5 pr-2">
                      {/* Drag handle / reorder buttons */}
                      <div className="flex flex-col">
                        <button
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => handleMove(globalIndex, "up")}
                          disabled={globalIndex === 0}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => handleMove(globalIndex, "down")}
                          disabled={
                            globalIndex === routineExercises.length - 1
                          }
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Exercise GIF / placeholder */}
                      {isDownloading ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      ) : gifUrl ? (
                        <img
                          src={gifUrl}
                          alt={re.exercise.name}
                          className="h-12 w-12 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                          <span className="text-[10px] text-center leading-tight">
                            {re.exercise.body_part}
                          </span>
                        </div>
                      )}

                      {/* Exercise info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize truncate">
                          {re.exercise.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {re.target_sets} sets × {re.target_reps} reps
                          {re.target_weight
                            ? ` @ ${re.target_weight} lbs`
                            : ""}
                          {" · "}
                          {re.rest_seconds}s rest
                        </p>
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setConfigExercise(re)
                          setConfigOpen(true)
                        }}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm("Remove this exercise?")) {
                            removeExercise.mutate(re.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Add Exercise Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Exercise
      </Button>

      {/* Exercise Picker Dialog */}
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onConfirm={handleConfirmExercises}
        selectedIds={routineExercises.map((re) => re.exercise_id)}
      />

      {/* Exercise Config Dialog */}
      <ExerciseConfigSheet
        exercise={configExercise}
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSave={handleConfigSave}
      />
    </div>
  )
}
