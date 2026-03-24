import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExercises } from "@/hooks/useExercises"
import { getGifUrl } from "@/types/exercise"
import { GifPreviewDialog } from "@/components/exercises/GifPreviewDialog"

export function ExercisesPage() {
  const [search, setSearch] = useState("")
  const [bodyPart, setBodyPart] = useState<string>("all")
  const [equipment, setEquipment] = useState<string>("all")
  const [target, setTarget] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [previewGif, setPreviewGif] = useState<{
    url: string; name: string
  } | null>(null)

  const {
    exercises,
    isLoading,
    bodyParts,
    equipmentList,
    targets,
  } = useExercises({ search, bodyPart, equipment, target })

  const activeFilters = [bodyPart, equipment, target].filter(
    (f) => f !== "all"
  ).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Exercises</h1>
        <p className="text-sm text-muted-foreground">
          Browse {exercises.length} exercises
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Body Part</label>
              <select
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">All Body Parts</option>
                {bodyParts.map((bp) => (
                  <option key={bp} value={bp}>
                    {bp}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Equipment</label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">All Equipment</option>
                {equipmentList.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Muscle</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">All Targets</option>
                {targets.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {activeFilters > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setBodyPart("all")
                  setEquipment("all")
                  setTarget("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16 pt-4" />
            </Card>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No exercises found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {exercises.slice(0, 50).map((exercise) => {
            const gifUrl = getGifUrl(exercise)
            return (
              <Card key={exercise.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  {gifUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewGif({ url: gifUrl, name: exercise.name })
                      }
                    >
                      <img
                        src={gifUrl}
                        alt={exercise.name}
                        className="h-14 w-14 rounded-md object-cover"
                        loading="lazy"
                      />
                    </button>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <span className="text-xs text-center leading-tight">
                        {exercise.body_part}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize truncate">
                      {exercise.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {exercise.target}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {exercise.equipment}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {exercises.length > 50 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Showing 50 of {exercises.length} exercises. Use search or filters to narrow down.
            </p>
          )}
        </div>
      )}

      {/* GIF Preview */}
      <GifPreviewDialog
        open={!!previewGif}
        onOpenChange={(open) => !open && setPreviewGif(null)}
        gifUrl={previewGif?.url ?? ""}
        exerciseName={previewGif?.name ?? ""}
      />
    </div>
  )
}
