import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"
import { ActiveWorkoutBanner } from "./ActiveWorkoutBanner"
import { unlockAudio } from "@/lib/audioManager"
import { useInstallPrompt } from "@/hooks/usePWA"
import { Button } from "@/components/ui/button"
import { Download, X, Share } from "lucide-react"

const DISMISS_KEY = "gymmat-install-dismissed"

function InstallBanner() {
  const { canInstall, showIOSInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(DISMISS_KEY) === "1"
  )

  if (dismissed || (!canInstall && !showIOSInstall)) return null

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, "1")
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto flex max-w-lg items-center gap-2 px-4 pb-1">
      <div className="flex flex-1 items-center gap-3 rounded-xl bg-card px-3 py-2.5 ring-1 ring-foreground/10">
        {canInstall ? (
          <>
            <Download className="h-4 w-4 shrink-0 text-primary" />
            <p className="flex-1 text-xs">
              Install GymMat for the best experience
            </p>
            <Button size="xs" onClick={install}>
              Install
            </Button>
          </>
        ) : (
          <>
            <Share className="h-4 w-4 shrink-0 text-primary" />
            <p className="flex-1 text-xs">
              Tap <Share className="inline h-3 w-3 -mt-0.5" /> then <span className="font-medium">"Add to Home Screen"</span>
            </p>
          </>
        )}
        <button
          className="p-1 text-muted-foreground"
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

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
      <InstallBanner />
      <ActiveWorkoutBanner />
      <BottomNav />
    </div>
  )
}
