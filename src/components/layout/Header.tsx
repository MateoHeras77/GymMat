import { useNavigate } from "react-router-dom"
import { Settings, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">GymMat</span>
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
