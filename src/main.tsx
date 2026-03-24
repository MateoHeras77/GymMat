import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { processQueue } from "@/lib/offlineQueue"
import { processPendingWorkouts } from "@/services/workoutService"

// Process any queued offline mutations on startup
if (navigator.onLine) {
  processQueue()
  processPendingWorkouts()
}

// Replay pending workouts when connection is restored
window.addEventListener("online", () => {
  processQueue()
  processPendingWorkouts()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
