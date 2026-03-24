import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRoutines } from "@/hooks/useRoutines"

export function RoutinesPage() {
  const navigate = useNavigate()
  const { routines, isLoading, deleteRoutine } = useRoutines()
  const [visibleCount, setVisibleCount] = useState(10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routines</h1>
          <p className="text-sm text-muted-foreground">
            Your workout routines
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/routines/new")}>
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 pt-4" />
            </Card>
          ))}
        </div>
      ) : routines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <p className="text-muted-foreground">No routines yet</p>
            <Button onClick={() => navigate("/routines/new")}>
              Create your first routine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {routines.slice(0, visibleCount).map((routine) => (
            <Card key={routine.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="text-base cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/routines/${routine.id}`)}
                  >
                    {routine.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => navigate(`/routines/${routine.id}`)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Delete this routine?")) {
                          deleteRoutine.mutate(routine.id)
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className="pb-3 cursor-pointer"
                onClick={() => navigate(`/routines/${routine.id}`)}
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {routine.estimated_duration_min && (
                    <span>{routine.estimated_duration_min} min</span>
                  )}
                </div>
                {routine.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {routine.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {routines.length > visibleCount && (
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => setVisibleCount((c) => c + 10)}
            >
              Show more ({routines.length - visibleCount} remaining)
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
