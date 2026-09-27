import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Play, X, Save, CloudOff, RefreshCw } from "lucide-react"
import { useActiveWorkoutStore } from "@/stores/activeWorkoutStore"
import { formatDuration } from "@/lib/constants"
import { useConfirm } from "@/components/ConfirmDialog"
import { usePendingWorkoutsCount } from "@/hooks/usePendingWorkouts"
import { processPendingWorkouts } from "@/services/workoutService"
import { toast } from "sonner"

export function ActiveWorkoutBanner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isActive, routineName, startedAt, cancelWorkout, pendingResult } =
    useActiveWorkoutStore()
  const pendingCount = usePendingWorkoutsCount()
  const confirm = useConfirm()
  const [elapsed, setElapsed] = useState(0)
  const [retrying, setRetrying] = useState(false)

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
  if (location.pathname === "/workout") return null
  if (!isActive && !pendingResult && pendingCount === 0) return null

  const retrySync = async () => {
    setRetrying(true)
    const synced = await processPendingWorkouts()
    setRetrying(false)
    if (synced.size === 0) {
      toast.error("Still can't reach the server. Will keep retrying.")
    }
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg space-y-1.5 px-2">
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-white shadow-lg">
            <CloudOff className="h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">
              {pendingCount} workout{pendingCount > 1 ? "s" : ""} waiting to sync
            </p>
            <button
              className="flex h-8 items-center gap-1 rounded-full bg-white/20 px-3 text-xs font-semibold disabled:opacity-60"
              onClick={retrySync}
              disabled={retrying}
            >
              <RefreshCw className={retrying ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Retry
            </button>
          </div>
        )}

        {!isActive && pendingResult && (
          <button
            className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2 text-left text-primary-foreground shadow-lg"
            onClick={() => navigate("/workout")}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
              <Save className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {pendingResult.routineName}
              </p>
              <p className="text-xs opacity-80">Finished — tap to save</p>
            </div>
          </button>
        )}

        {isActive && (
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
              onClick={async () => {
                if (
                  await confirm({
                    title: "Discard workout?",
                    description: "All progress in this session will be lost.",
                    confirmLabel: "Discard",
                    destructive: true,
                  })
                ) {
                  cancelWorkout()
                }
              }}
              title="Discard workout"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
