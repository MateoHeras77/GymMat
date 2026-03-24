import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { usePreferences } from "@/hooks/usePreferences"
import { router } from "@/router"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { preferences } = usePreferences()

  useEffect(() => {
    const root = document.documentElement
    if (preferences.theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", isDark)

      const listener = (e: MediaQueryListEvent) => {
        root.classList.toggle("dark", e.matches)
      }
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      mq.addEventListener("change", listener)
      return () => mq.removeEventListener("change", listener)
    } else {
      root.classList.toggle("dark", preferences.theme === "dark")
    }
  }, [preferences.theme])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </QueryClientProvider>
  )
}
