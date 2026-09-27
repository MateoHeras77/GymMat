import { useState, useEffect } from "react"
import { formatDuration } from "@/lib/constants"

/**
 * Self-contained elapsed-time display. Keeping the per-second tick inside its
 * own component means only this small node re-renders each second instead of
 * the whole WorkoutPage tree (SetLogger included).
 *
 * Uses wall-clock comparison so it stays accurate after the tab is backgrounded
 * and throttled.
 */
export function WorkoutTimer({ startedAt }: { startedAt: string | null }) {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : 0
  )

  useEffect(() => {
    if (!startedAt) return
    const tick = () =>
      setElapsed(
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      )
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return <span>{formatDuration(elapsed)}</span>
}
