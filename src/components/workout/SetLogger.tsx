import { useState } from "react"
import { Check, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWeightUnit } from "@/hooks/useWeightUnit"
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

// 44px rows/targets (Apple HIG) — this is used one-handed with sweaty fingers.
const ROW = "grid grid-cols-[36px_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.8fr)_44px] items-center gap-2"

/** Parses what the user typed; accepts "62,5" (Spanish iOS decimal keypad). */
function parseNumber(text: string): number | null {
  const n = parseFloat(text.replace(",", "."))
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Text input that keeps the raw text while focused, so typing "62." or "62,"
 * isn't normalized away by the lbs⇄kg round-trip on every keystroke.
 */
function NumberInput({
  value,
  onCommit,
  decimal,
  disabled,
  ariaLabel,
}: {
  value: number | null
  onCommit: (value: number | null) => void
  decimal: boolean
  disabled: boolean
  ariaLabel: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <Input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      enterKeyHint="done"
      aria-label={ariaLabel}
      value={draft ?? (value != null ? String(value) : "")}
      onFocus={(e) => {
        setDraft(value != null ? String(value) : "")
        e.currentTarget.select()
      }}
      onChange={(e) => {
        setDraft(e.target.value)
        const n = parseNumber(e.target.value)
        onCommit(n == null ? null : decimal ? n : Math.round(n))
      }}
      onBlur={() => setDraft(null)}
      className="h-11 px-2 text-center text-base tabular-nums"
      placeholder="--"
      disabled={disabled}
    />
  )
}

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
  const { unit, showDual, toDisplay, fromDisplay, formatOther } = useWeightUnit()

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className={cn(ROW, "px-2 text-xs font-medium text-muted-foreground")}>
        <span>Set</span>
        <span>Previous</span>
        <span className="text-center">{unit}</span>
        <span className="text-center">Reps</span>
        <span></span>
      </div>

      {/* Sets */}
      {sets.map((s, i) => {
        const typeInfo = SET_TYPES.find((t) => t.value === s.setType) ?? SET_TYPES[1]
        const prev = previousSets[i]

        return (
          <div
            key={s.id}
            className={cn(
              ROW,
              "rounded-lg px-2 py-1.5",
              s.completed ? "bg-primary/10" : "bg-card"
            )}
          >
            {/* Set number / type */}
            <button
              className={cn(
                "flex h-11 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors",
                typeInfo.color
              )}
              onClick={() => {
                const currentIdx = SET_TYPES.findIndex((t) => t.value === s.setType)
                const nextIdx = (currentIdx + 1) % SET_TYPES.length
                onChangeSetType(i, SET_TYPES[nextIdx].value)
              }}
              title={`Type: ${s.setType} (tap to change)`}
            >
              {typeInfo.label}
              {s.setNumber}
            </button>

            {/* Previous session data */}
            <span className="truncate text-xs text-muted-foreground tabular-nums">
              {prev ? `${prev.weight != null ? toDisplay(prev.weight) : 0} × ${prev.reps ?? 0}` : "--"}
            </span>

            {/* Weight (stored in lbs, shown in the user's unit) */}
            <div className="relative">
              <NumberInput
                value={s.weight != null ? toDisplay(s.weight) : null}
                onCommit={(v) => onUpdateSet(i, { weight: v == null ? null : fromDisplay(v) })}
                decimal
                disabled={s.completed}
                ariaLabel={`Set ${s.setNumber} weight in ${unit}`}
              />
              {showDual && s.weight != null && s.weight > 0 && (
                <span className="pointer-events-none absolute -bottom-3 inset-x-0 text-center text-[10px] text-muted-foreground">
                  {formatOther(s.weight)}
                </span>
              )}
            </div>

            {/* Reps */}
            <NumberInput
              value={s.reps}
              onCommit={(v) => onUpdateSet(i, { reps: v })}
              decimal={false}
              disabled={s.completed}
              ariaLabel={`Set ${s.setNumber} reps`}
            />

            {/* Complete / Undo */}
            {s.completed ? (
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
                onClick={() => onUpdateSet(i, { completed: false })}
                title="Undo"
              >
                <Check className="h-5 w-5" />
              </button>
            ) : (
              <button
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors",
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
                <Check className="h-5 w-5" />
              </button>
            )}
          </div>
        )
      })}

      {/* Add/Remove set */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="h-11 flex-1" onClick={onAddSet}>
          <Plus className="mr-1 h-4 w-4" />
          Add Set
        </Button>
        {sets.length > 1 && (
          <Button
            variant="outline"
            className="h-11 w-11"
            onClick={() => onRemoveSet(sets.length - 1)}
            title="Remove last set"
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
