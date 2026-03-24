import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { DashboardPage } from "@/pages/DashboardPage"
import { RoutinesPage } from "@/pages/RoutinesPage"
import { RoutineFormPage } from "@/pages/RoutineFormPage"
import { RoutineDetailPage } from "@/pages/RoutineDetailPage"
import { ExercisesPage } from "@/pages/ExercisesPage"
import { WorkoutPage } from "@/pages/WorkoutPage"
import { HistoryPage } from "@/pages/HistoryPage"
import { ProgressPage } from "@/pages/ProgressPage"
import { SettingsPage } from "@/pages/SettingsPage"

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "routines", element: <RoutinesPage /> },
      { path: "routines/new", element: <RoutineFormPage /> },
      { path: "routines/:id", element: <RoutineDetailPage /> },
      { path: "exercises", element: <ExercisesPage /> },
      { path: "workout", element: <WorkoutPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
])
