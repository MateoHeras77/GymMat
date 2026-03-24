import { useNavigate } from "react-router-dom"
import { Settings, Dumbbell, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOnlineStatus } from "@/hooks/usePWA"

export function Header() {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">GymMat</span>
          {!isOnline && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
              <WifiOff className="h-3 w-3" />
              Offline
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
