import { useState } from "react"
import { Trophy, Clock, Dumbbell, Flame, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDuration } from "@/lib/constants"
import type { WorkoutResult } from "@/stores/activeWorkoutStore"

interface WorkoutSummaryProps {
  result: WorkoutResult
  onSave: (rating: number | null) => void
  saving: boolean
}

export function WorkoutSummary({ result, onSave, saving }: WorkoutSummaryProps) {
  const [rating, setRating] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
        <h1 className="mt-3 text-2xl font-bold">Workout Complete!</h1>
        <p className="text-muted-foreground">{result.routineName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-lg font-bold">
                {formatDuration(result.durationSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Dumbbell className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold">{result.totalSets}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-lg font-bold">{result.totalReps}</p>
              <p className="text-xs text-muted-foreground">Reps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Trophy className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-lg font-bold">
                {result.totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Volume (lbs)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise breakdown */}
      <Card>
        <CardContent className="space-y-2 pt-4">
          <h3 className="text-sm font-medium">Exercises</h3>
          {result.exercises.map((ex) => {
            const completed = ex.sets.filter((s) => s.completed)
            if (completed.length === 0) return null
            return (
              <div
                key={ex.exerciseId}
                className="flex items-center justify-between text-sm"
              >
                <span className="capitalize truncate flex-1">
                  {ex.exerciseName}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {completed.length} sets
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Rating */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">How was your workout?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  rating !== null && star <= rating
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button
        className="w-full"
        size="lg"
        onClick={() => onSave(rating)}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Workout"}
      </Button>
    </div>
  )
}
