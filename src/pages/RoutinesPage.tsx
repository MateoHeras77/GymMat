import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRoutines } from "@/hooks/useRoutines"

export function RoutinesPage() {
  const navigate = useNavigate()
  const { routines, isLoading } = useRoutines()

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
          {routines.map((routine) => (
            <Card
              key={routine.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => navigate(`/routines/${routine.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{routine.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {routine.template_type && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 capitalize">
                      {routine.template_type}
                    </span>
                  )}
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
        </div>
      )}
    </div>
  )
}
