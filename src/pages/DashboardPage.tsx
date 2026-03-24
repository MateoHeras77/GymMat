import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { startOfWeek, isAfter, subDays, startOfDay } from "date-fns"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Flame, TrendingUp, Play, Clock, Trophy } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { formatDuration } from "@/lib/constants"
import type { WorkoutSession } from "@/types/workout"

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch all sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["workout-history", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("started_at", { ascending: false })
      if (error) throw error
      return data as unknown as WorkoutSession[]
    },
    enabled: !!user,
  })

  // Fetch PR count
  const { data: prCount = 0 } = useQuery({
    queryKey: ["pr-count", user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { count, error } = await supabase
        .from("personal_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!user,
  })

  const stats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })

    // This week count
    const thisWeek = sessions.filter((s) =>
      isAfter(new Date(s.started_at), weekStart)
    ).length

    // Total volume (all time)
    // Volume is calculated from sets, but we don't have sets here.
    // Use duration as a proxy, or we can show total workouts instead.
    const totalWorkouts = sessions.length

    // Streak calculation: consecutive days with workouts going backwards from today
    let streak = 0
    if (sessions.length > 0) {
      const workoutDates = new Set(
        sessions.map((s) =>
          format(new Date(s.started_at), "yyyy-MM-dd")
        )
      )

      let checkDate = startOfDay(now)
      // If no workout today, start checking from yesterday
      if (!workoutDates.has(format(checkDate, "yyyy-MM-dd"))) {
        checkDate = subDays(checkDate, 1)
      }

      while (workoutDates.has(format(checkDate, "yyyy-MM-dd"))) {
        streak++
        checkDate = subDays(checkDate, 1)
      }
    }

    return { thisWeek, streak, totalWorkouts }
  }, [sessions])

  const recentSessions = sessions.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your workout overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <p className="text-2xl font-bold">{stats.streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
            <p className="text-xs text-muted-foreground">Total Workouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold">{prCount}</p>
            <p className="text-xs text-muted-foreground">PRs</p>
          </CardContent>
        </Card>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={() => navigate("/routines")}
      >
        <Play className="mr-2 h-4 w-4" />
        Start Workout
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workouts yet. Start your first workout!
            </p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(session.started_at), "MMM d")}
                      </span>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
