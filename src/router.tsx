import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then(m => ({ default: m.DashboardPage })))
const RoutinesPage = lazy(() => import("@/pages/RoutinesPage").then(m => ({ default: m.RoutinesPage })))
const RoutineFormPage = lazy(() => import("@/pages/RoutineFormPage").then(m => ({ default: m.RoutineFormPage })))
const RoutineDetailPage = lazy(() => import("@/pages/RoutineDetailPage").then(m => ({ default: m.RoutineDetailPage })))
const ExercisesPage = lazy(() => import("@/pages/ExercisesPage").then(m => ({ default: m.ExercisesPage })))
const WorkoutPage = lazy(() => import("@/pages/WorkoutPage").then(m => ({ default: m.WorkoutPage })))
const HistoryPage = lazy(() => import("@/pages/HistoryPage").then(m => ({ default: m.HistoryPage })))
const ProgressPage = lazy(() => import("@/pages/ProgressPage").then(m => ({ default: m.ProgressPage })))
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })))

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <LazyPage><DashboardPage /></LazyPage> },
      { path: "routines", element: <LazyPage><RoutinesPage /></LazyPage> },
      { path: "routines/new", element: <LazyPage><RoutineFormPage /></LazyPage> },
      { path: "routines/:id", element: <LazyPage><RoutineDetailPage /></LazyPage> },
      { path: "exercises", element: <LazyPage><ExercisesPage /></LazyPage> },
      { path: "workout", element: <LazyPage><WorkoutPage /></LazyPage> },
      { path: "history", element: <LazyPage><HistoryPage /></LazyPage> },
      { path: "progress", element: <LazyPage><ProgressPage /></LazyPage> },
      { path: "settings", element: <LazyPage><SettingsPage /></LazyPage> },
    ],
  },
])
