import { Component, useEffect, type ReactNode } from "react"
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
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
})

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred.
          </p>
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <AppContent />
        </AuthGuard>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
