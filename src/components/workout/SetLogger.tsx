import { Check, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { lbsToKg } from "@/lib/constants"
import type { ActiveSet } from "@/stores/activeWorkoutStore"
import type { PreviousSet } from "@/hooks/usePreviousSets"

interface SetLoggerProps {
  sets: ActiveSet[]
  targetReps: string
  previousSets?: PreviousSet[]
  onUpdateSet: (setIndex: number, updates: Partial<ActiveSet>) => void
  onCompleteSet: (setIndex: number) => void
  onAddSet: () => void
  onRemoveSet: (setIndex: number) => void
  onChangeSetType: (setIndex: number, type: ActiveSet["setType"]) => void
  onRestTimer: (seconds: number) => void
  restSeconds: number
}

const SET_TYPES: { value: ActiveSet["setType"]; label: string; color: string }[] = [
  { value: "warmup", label: "W", color: "text-yellow-500" },
  { value: "working", label: "S", color: "text-foreground" },
  { value: "drop", label: "D", color: "text-blue-500" },
  { value: "failure", label: "F", color: "text-red-500" },
]

export function SetLogger({
  sets,
  previousSets = [],
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  onChangeSetType,
  onRestTimer,
  restSeconds,
}: SetLoggerProps) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 px-2 text-xs font-medium text-muted-foreground">
        <span>Set</span>
        <span>Previous</span>
        <span>lbs (kg)</span>
        <span>Reps</span>
        <span></span>
      </div>

      {/* Sets */}
      {sets.map((s, i) => {
        const typeInfo = SET_TYPES.find((t) => t.value === s.setType) ?? SET_TYPES[1]

        return (
          <div
            key={s.id}
            className={cn(
              "grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 items-center rounded-lg px-2 py-1.5",
              s.completed ? "bg-primary/10" : "bg-card"
            )}
          >
            {/* Set number / type */}
            <button
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                typeInfo.color
              )}
              onClick={() => {
                const currentIdx = SET_TYPES.findIndex(
                  (t) => t.value === s.setType
                )
                const nextIdx = (currentIdx + 1) % SET_TYPES.length
                onChangeSetType(i, SET_TYPES[nextIdx].value)
              }}
              title={`Type: ${s.setType} (tap to change)`}
            >
              {typeInfo.label}{s.setNumber}
            </button>

            {/* Previous session data */}
            <span className="text-xs text-muted-foreground">
              {previousSets[i]
                ? `${previousSets[i].weight ?? 0} × ${previousSets[i].reps ?? 0}`
                : "--"}
            </span>

            {/* Weight */}
            <div className="relative">
              <Input
                type="number"
                value={s.weight ?? ""}
                onChange={(e) =>
                  onUpdateSet(i, {
                    weight: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="h-8 text-sm pr-1"
                placeholder="--"
                step="2.5"
                disabled={s.completed}
              />
              {s.weight != null && (
                <span className="absolute -bottom-3.5 left-0.5 text-[10px] text-muted-foreground">
                  {lbsToKg(s.weight)} kg
                </span>
              )}
            </div>

            {/* Reps */}
            <Input
              type="number"
              value={s.reps ?? ""}
              onChange={(e) =>
                onUpdateSet(i, {
                  reps: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="h-8 text-sm"
              placeholder="--"
              disabled={s.completed}
            />

            {/* Complete / Undo */}
            {s.completed ? (
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
                onClick={() => onUpdateSet(i, { completed: false })}
                title="Undo"
              >
                <Check className="h-4 w-4" />
              </button>
            ) : (
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  s.reps
                    ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    : "border-muted text-muted cursor-not-allowed"
                )}
                onClick={() => {
                  if (s.reps != null && s.reps > 0) {
                    onCompleteSet(i)
                    if (restSeconds > 0) {
                      onRestTimer(restSeconds)
                    }
                  }
                }}
                disabled={!s.reps}
                title="Complete set"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}

      {/* Add/Remove set */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onAddSet}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Set
        </Button>
        {sets.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveSet(sets.length - 1)}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
