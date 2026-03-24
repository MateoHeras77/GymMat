import { Outlet } from "react-router-dom"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"
import { ActiveWorkoutBanner } from "./ActiveWorkoutBanner"

export function AppShell() {
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
