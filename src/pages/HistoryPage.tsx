import { useState, useMemo } from "react"
import { format, isSameDay } from "date-fns"
import { Clock, Dumbbell, ChevronDown, Star, Trophy, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WorkoutCalendar } from "@/components/calendar/WorkoutCalendar"
import {
  useWorkoutHistory,
  useWorkoutDays,
  useSessionDetail,
} from "@/hooks/useWorkoutHistory"
import { formatDuration, formatWeight } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { WorkoutSession } from "@/types/workout"

export function HistoryPage() {
  const { sessions, isLoading, deleteSession } = useWorkoutHistory()
  const workoutDays = useWorkoutDays()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(10)

  const filteredSessions = useMemo(() => {
    if (!selectedDate) return sessions
    return sessions.filter((s) =>
      isSameDay(new Date(s.started_at), selectedDate)
    )
  }, [sessions, selectedDate])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground">
          {sessions.length} workout{sessions.length !== 1 ? "s" : ""} logged
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-4">
          <WorkoutCalendar
            workoutDays={workoutDays}
            selectedDate={selectedDate}
            onSelectDate={(date) =>
              setSelectedDate(
                selectedDate && isSameDay(date, selectedDate) ? null : date
              )
            }
          />
        </CardContent>
      </Card>

      {/* Selected date label */}
      {selectedDate && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
          <button
            className="text-xs text-primary"
            onClick={() => setSelectedDate(null)}
          >
            Show all
          </button>
        </div>
      )}

      {/* Session list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 pt-4" />
            </Card>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {selectedDate
              ? "No workouts on this day"
              : "No workout history yet. Complete your first workout!"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.slice(0, visibleCount).map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isExpanded={expandedSession === session.id}
              onToggle={() =>
                setExpandedSession(
                  expandedSession === session.id ? null : session.id
                )
              }
              onDelete={() => {
                if (confirm("Delete this workout session?")) {
                  deleteSession.mutate(session.id)
                }
              }}
            />
          ))}
          {filteredSessions.length > visibleCount && (
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => setVisibleCount((c) => c + 10)}
            >
              Show more ({filteredSessions.length - visibleCount} remaining)
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function SessionCard({
  session,
  isExpanded,
  onToggle,
  onDelete,
}: {
  session: WorkoutSession
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const { session: detail, isLoading } = useSessionDetail(
    isExpanded ? session.id : undefined
  )

  return (
    <Card>
      <button
        className="w-full text-left"
        onClick={onToggle}
      >
        <CardContent className="flex items-center gap-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{session.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{format(new Date(session.started_at), "MMM d, h:mm a")}</span>
              {session.duration_seconds && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDuration(session.duration_seconds)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {session.rating && (
              <div className="flex items-center gap-0.5 mr-1">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-xs">{session.rating}</span>
              </div>
            )}
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title="Delete session"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </CardContent>
      </button>

      {isExpanded && (
        <div className="border-t px-4 pb-3 pt-2">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : detail ? (
            <SessionDetail detail={detail} />
          ) : null}
        </div>
      )}
    </Card>
  )
}

function SessionDetail({
  detail,
}: {
  detail: NonNullable<ReturnType<typeof useSessionDetail>["session"]>
}) {
  // Group sets by exercise
  const exerciseGroups = useMemo(() => {
    const groups: {
      exerciseId: string
      exerciseName: string
      sets: typeof detail.sets
    }[] = []

    for (const set of detail.sets) {
      const existing = groups.find((g) => g.exerciseId === set.exercise_id)
      if (existing) {
        existing.sets.push(set)
      } else {
        groups.push({
          exerciseId: set.exercise_id,
          exerciseName: set.exercise.name,
          sets: [set],
        })
      }
    }

    return groups
  }, [detail.sets])

  return (
    <div className="space-y-3">
      {exerciseGroups.map((group) => (
        <div key={group.exerciseId}>
          <p className="text-sm font-medium capitalize">{group.exerciseName}</p>
          <div className="mt-1 space-y-0.5">
            {group.sets.map((set) => (
              <div
                key={set.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Badge
                  variant="outline"
                  className="h-5 min-w-[28px] justify-center px-1 text-[10px]"
                >
                  {set.set_type === "warmup"
                    ? "W"
                    : set.set_type === "drop"
                      ? "D"
                      : set.set_type === "failure"
                        ? "F"
                        : "S"}
                  {set.set_number}
                </Badge>
                <span>
                  {set.weight != null ? formatWeight(Number(set.weight)) : "BW"}
                </span>
                <span>×</span>
                <span>{set.reps ?? 0} reps</span>
                {set.is_pr && (
                  <Trophy className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {detail.notes && (
        <p className="text-xs text-muted-foreground italic">
          {detail.notes}
        </p>
      )}
    </div>
  )
}
