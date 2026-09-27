import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { processPendingWorkouts } from "@/services/workoutService"

// Retry queued workouts on startup, when the connection comes back and when
// the app returns to the foreground. navigator.onLine isn't trusted as a gate:
// "online" on gym Wi-Fi doesn't mean requests go through.
processPendingWorkouts()
window.addEventListener("online", () => {
  processPendingWorkouts()
})
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") processPendingWorkouts()
})

// After a deploy, an in-session navigation to a not-yet-loaded lazy page can
// fail to fetch the (now-stale-hashed) chunk. Reload once to pick up the new
// index.html. The sessionStorage guard prevents an infinite reload loop if the
// failure is for some other reason.
window.addEventListener("vite:preloadError", () => {
  if (sessionStorage.getItem("gymmat-preload-reloaded")) return
  sessionStorage.setItem("gymmat-preload-reloaded", "1")
  window.location.reload()
})
window.addEventListener("load", () => {
  sessionStorage.removeItem("gymmat-preload-reloaded")
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
