import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Dumbbell,
  Play,
  Calendar,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems: readonly {
  to: string
  icon: typeof LayoutDashboard
  label: string
  isCenter?: boolean
}[] = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/routines", icon: Dumbbell, label: "Routines" },
  { to: "/workout", icon: Play, label: "Workout", isCenter: true },
  { to: "/history", icon: Calendar, label: "History" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                item.isCenter && "relative -top-3",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.isCenter ? (
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                ) : (
                  <item.icon className="h-5 w-5" />
                )}
                <span className={cn(item.isCenter && "mt-0.5")}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
