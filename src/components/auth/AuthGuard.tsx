import type { ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import { LoginPage } from "@/pages/LoginPage"
import { Dumbbell } from "lucide-react"

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Dumbbell className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}
