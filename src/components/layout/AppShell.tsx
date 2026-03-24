import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"
import { ActiveWorkoutBanner } from "./ActiveWorkoutBanner"
import { unlockAudio } from "@/lib/audioManager"

export function AppShell() {
  // Unlock iOS audio on first user interaction
  useEffect(() => {
    const handler = () => {
      unlockAudio()
      document.removeEventListener("touchstart", handler)
      document.removeEventListener("click", handler)
    }
    document.addEventListener("touchstart", handler, { once: true })
    document.addEventListener("click", handler, { once: true })
    return () => {
      document.removeEventListener("touchstart", handler)
      document.removeEventListener("click", handler)
    }
  }, [])

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-background">
      <Header />
      <main className="px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <ActiveWorkoutBanner />
      <BottomNav />
    </div>
  )
}
