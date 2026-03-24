import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Flame, TrendingUp, Play } from "lucide-react"

export function DashboardPage() {
  const navigate = useNavigate()

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
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Total Volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold">0</p>
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
          <p className="text-sm text-muted-foreground">
            No workouts yet. Start your first workout!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
