import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Play, X } from "lucide-react"
import { useActiveWorkoutStore } from "@/stores/activeWorkoutStore"
import { formatDuration } from "@/lib/constants"

export function ActiveWorkoutBanner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isActive, routineName, startedAt, cancelWorkout } =
    useActiveWorkoutStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive || !startedAt) return
    const tick = () =>
      setElapsed(
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      )
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isActive, startedAt])

  // Don't show on the workout page itself
  if (!isActive || location.pathname === "/workout") return null

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg px-2">
        <div className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-lg">
          <button
            className="flex flex-1 items-center gap-2 text-left"
            onClick={() => navigate("/workout")}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
              <Play className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{routineName}</p>
              <p className="text-xs opacity-80">{formatDuration(elapsed)}</p>
            </div>
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-primary-foreground/20 transition-colors"
            onClick={() => {
              if (confirm("Discard this workout? All progress will be lost.")) {
                cancelWorkout()
              }
            }}
            title="Discard workout"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
