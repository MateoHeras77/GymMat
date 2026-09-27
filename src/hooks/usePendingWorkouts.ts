import { useSyncExternalStore } from "react"
import { subscribePendingWorkouts } from "@/services/workoutService"

function getPendingCount(): number {
  try {
    const items = JSON.parse(localStorage.getItem("gymmat-pending-workouts") || "[]")
    return Array.isArray(items) ? items.length : 0
  } catch {
    return 0
  }
}

/** Number of finished workouts still waiting to reach the server. */
export function usePendingWorkoutsCount(): number {
  return useSyncExternalStore(subscribePendingWorkouts, getPendingCount)
}
