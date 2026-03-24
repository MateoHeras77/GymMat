import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { RoutineExerciseWithDetails } from "@/hooks/useRoutineExercises"

interface ExerciseConfigSheetProps {
  exercise: RoutineExerciseWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    id: string,
    updates: {
      target_sets: number
      target_reps: string
      target_weight: number | null
      rest_seconds: number
      notes: string | null
      superset_group: number | null
    }
  ) => void
}

export function ExerciseConfigSheet({
  exercise,
  open,
  onOpenChange,
  onSave,
}: ExerciseConfigSheetProps) {
  const [sets, setSets] = useState("3")
  const [reps, setReps] = useState("10")
  const [weight, setWeight] = useState("")
  const [rest, setRest] = useState("90")
  const [notes, setNotes] = useState("")
  const [supersetGroup, setSupersetGroup] = useState("")

  useEffect(() => {
    if (exercise) {
      setSets(String(exercise.target_sets))
      setReps(exercise.target_reps)
      setWeight(exercise.target_weight ? String(exercise.target_weight) : "")
      setRest(String(exercise.rest_seconds))
      setNotes(exercise.notes ?? "")
      setSupersetGroup(
        exercise.superset_group !== null
          ? String(exercise.superset_group)
          : ""
      )
    }
  }, [exercise])

  if (!exercise) return null

  const handleSave = () => {
    onSave(exercise.id, {
      target_sets: parseInt(sets) || 3,
      target_reps: reps || "10",
      target_weight: weight ? parseFloat(weight) : null,
      rest_seconds: parseInt(rest) || 90,
      notes: notes.trim() || null,
      superset_group: supersetGroup ? parseInt(supersetGroup) : null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">
            {exercise.exercise.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g., 8-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Target Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Optional"
                step="2.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rest">Rest (seconds)</Label>
              <Input
                id="rest"
                type="number"
                value={rest}
                onChange={(e) => setRest(e.target.value)}
                min="0"
                step="15"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="superset">
              Superset Group (optional)
            </Label>
            <Input
              id="superset"
              type="number"
              value={supersetGroup}
              onChange={(e) => setSupersetGroup(e.target.value)}
              placeholder="Same number = superset together"
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              Exercises with the same group number are performed as a superset
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Form cues, variations..."
              rows={2}
            />
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
