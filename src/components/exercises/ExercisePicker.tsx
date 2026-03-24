import { useState } from "react"
import { Search, Plus, Check, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useExercises } from "@/hooks/useExercises"
import { getGifUrl } from "@/types/exercise"
import type { Exercise } from "@/types/exercise"

interface ExercisePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (toAdd: Exercise[], toRemove: string[]) => void
  selectedIds?: string[]
}

export function ExercisePicker({
  open,
  onOpenChange,
  onConfirm,
  selectedIds = [],
}: ExercisePickerProps) {
  const [search, setSearch] = useState("")
  const [bodyPart, setBodyPart] = useState("all")
  const [toAdd, setToAdd] = useState<Exercise[]>([])
  const [toRemove, setToRemove] = useState<Set<string>>(new Set())

  const { exercises, bodyParts } = useExercises({ search, bodyPart })

  const toAddIds = new Set(toAdd.map((e) => e.id))

  const handleToggle = (exercise: Exercise) => {
    const isAlreadyAdded = selectedIds.includes(exercise.id)

    if (isAlreadyAdded) {
      // Toggle removal of existing exercise
      setToRemove((prev) => {
        const next = new Set(prev)
        if (next.has(exercise.id)) {
          next.delete(exercise.id)
        } else {
          next.add(exercise.id)
        }
        return next
      })
    } else {
      // Toggle addition of new exercise
      if (toAddIds.has(exercise.id)) {
        setToAdd(toAdd.filter((e) => e.id !== exercise.id))
      } else {
        setToAdd([...toAdd, exercise])
      }
    }
  }

  const totalChanges = toAdd.length + toRemove.size

  const handleDone = () => {
    onConfirm(toAdd, Array.from(toRemove))
    resetState()
    onOpenChange(false)
  }

  const resetState = () => {
    setToAdd([])
    setToRemove(new Set())
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState()
    onOpenChange(isOpen)
  }

  const buttonLabel = () => {
    const parts: string[] = []
    if (toAdd.length > 0) parts.push(`Add ${toAdd.length}`)
    if (toRemove.size > 0) parts.push(`Remove ${toRemove.size}`)
    return parts.length > 0 ? parts.join(", ") : "Select exercises"
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!flex max-h-[80vh] !flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Exercises</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <Badge
              variant={bodyPart === "all" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setBodyPart("all")}
            >
              All
            </Badge>
            {bodyParts.map((bp) => (
              <Badge
                key={bp}
                variant={bodyPart === bp ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap capitalize"
                onClick={() => setBodyPart(bp)}
              >
                {bp}
              </Badge>
            ))}
          </div>
        </div>

        {/* Selected count */}
        {totalChanges > 0 && (
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="font-medium">{buttonLabel()}</span>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={resetState}
            >
              Clear
            </button>
          </div>
        )}

        {/* Exercise list — plain scrollable div */}
        <div className="min-h-0 flex-1 overflow-y-auto -mx-4 px-4">
          <div className="space-y-1 py-2">
            {exercises.slice(0, 100).map((exercise) => {
              const isAlreadyAdded = selectedIds.includes(exercise.id)
              const markedForRemoval = toRemove.has(exercise.id)
              const isPicked = toAddIds.has(exercise.id)
              const gifUrl = getGifUrl(exercise)

              // Visual state
              const isActive = isAlreadyAdded && !markedForRemoval
              const isNewPick = isPicked

              return (
                <button
                  key={exercise.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    markedForRemoval
                      ? "bg-destructive/10 opacity-60"
                      : isNewPick
                        ? "bg-primary/10"
                        : isActive
                          ? "bg-accent/50"
                          : "hover:bg-accent"
                  }`}
                  onClick={() => handleToggle(exercise)}
                >
                  {gifUrl ? (
                    <img
                      src={gifUrl}
                      alt={exercise.name}
                      className="h-11 w-11 rounded-md object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <span className="text-[10px] text-center leading-tight">
                        {exercise.body_part}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize truncate">
                      {exercise.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {exercise.target} · {exercise.equipment}
                    </p>
                  </div>
                  {markedForRemoval ? (
                    <Minus className="h-4 w-4 text-destructive" />
                  ) : isActive ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : isNewPick ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Done button */}
        <Button
          className="w-full shrink-0"
          onClick={handleDone}
          disabled={totalChanges === 0}
        >
          {buttonLabel()}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
