import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, ChevronDown, LayoutTemplate, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ROUTINE_TEMPLATES, type RoutineTemplate } from "@/data/routineTemplates"
import { useRoutines } from "@/hooks/useRoutines"

export function RoutineTemplates() {
  const navigate = useNavigate()
  const { routines, createFromTemplate } = useRoutines()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  // A template counts as added while the user has an active routine with its name.
  const existingNames = new Set(routines.map((r) => r.name))
  const missing = ROUTINE_TEMPLATES.filter((t) => !existingNames.has(t.name))

  const add = (templates: RoutineTemplate[], key: string) => {
    setPendingKey(key)
    createFromTemplate.mutate(templates, {
      onSuccess: (created) => {
        if (created.length === 1) {
          toast.success(`Added "${created[0].name}"`)
          navigate(`/routines/${created[0].id}`)
        } else {
          toast.success(`Added ${created.length} routines`)
        }
      },
      onError: () => toast.error("Couldn't add the template. Please try again."),
      onSettled: () => setPendingKey(null),
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </h2>
          <p className="text-xs text-muted-foreground">
            5-day split · Push / Pull / Legs / Upper / Lower · no leg machines
          </p>
        </div>
        {missing.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            disabled={createFromTemplate.isPending}
            onClick={() => add(missing, "all")}
          >
            {pendingKey === "all" ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1 h-4 w-4" />
            )}
            Add all {missing.length}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {ROUTINE_TEMPLATES.map((template) => {
          const added = existingNames.has(template.name)
          const isOpen = expanded === template.key
          return (
            <Card key={template.key}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => setExpanded(isOpen ? null : template.key)}
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{template.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {template.focus} · {template.exercises.length} exercises · ~
                        {template.estimatedMinutes} min
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {added ? (
                    <span className="flex h-9 items-center gap-1 px-2 text-xs font-medium text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Added
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="h-9"
                      disabled={createFromTemplate.isPending}
                      onClick={() => add([template], template.key)}
                    >
                      {pendingKey === template.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Use"
                      )}
                    </Button>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-1.5 border-t pt-3">
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                    <ol className="space-y-1">
                      {template.exercises.map((ex, i) => (
                        <li
                          key={`${ex.exerciseId}-${i}`}
                          className="flex items-baseline justify-between gap-2 text-sm"
                        >
                          <span className="capitalize">
                            <span className="mr-1.5 text-xs text-muted-foreground">{i + 1}.</span>
                            {ex.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {ex.sets} × {ex.reps}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
