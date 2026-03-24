# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Preview production build
npx tsc --noEmit   # Type-check without emitting
```

No test framework is configured.

## Architecture

GymMat is a mobile-first PWA gym workout tracker built with React 19 + TypeScript + Vite 7, using Supabase for auth/database/storage.

### Stack

- **UI**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) + shadcn/ui components built on **Base UI** (NOT Radix) + class-variance-authority
- **Server state**: TanStack Query v5 — custom hooks in `src/hooks/` wrap queries/mutations with cache invalidation
- **Client state**: Zustand with localStorage persistence (`src/stores/`)
- **Forms**: React Hook Form + Zod v4
- **Routing**: React Router v7 with `createBrowserRouter` in `src/router.tsx`
- **Charts**: Recharts v3
- **PWA**: vite-plugin-pwa with Workbox service worker, offline mutation queue in `src/lib/offlineQueue.ts`

### Key Directories

```
src/
├── pages/          # One component per route
├── hooks/          # TanStack Query hooks (useRoutines, useExercises, useWorkoutHistory, useProgress, etc.)
├── stores/         # Zustand stores (activeWorkoutStore, timerStore)
├── services/       # Business logic (workoutService saves workouts + tracks PRs, gifService)
├── components/
│   ├── ui/         # shadcn primitives (button, card, dialog, input, etc.)
│   ├── layout/     # AppShell, Header, BottomNav, ActiveWorkoutBanner
│   ├── workout/    # SetLogger, RestTimer, WorkoutSummary
│   └── ...         # Feature-specific components
├── lib/
│   ├── supabase.ts # Supabase client (env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   ├── offlineQueue.ts
│   └── utils.ts    # cn() helper
└── types/          # database.ts (auto-generated Supabase types), routine.ts, workout.ts, exercise.ts
```

### Data Flow Patterns

- **Custom hooks** follow this pattern: call `useAuth()` for user context → `useQuery` for reads → `useMutation` with `queryClient.invalidateQueries()` for writes
- **Active workout state** lives in Zustand (not server), persisted to localStorage. Workout is started in `RoutineDetailPage` (which has fresh data), then `WorkoutPage` reads from the store — no query params or cache race conditions.
- **Supabase queries** are made directly in hooks via `supabase.from('table').select()...` — no separate API layer
- **Offline mutations** are queued in localStorage and replayed on reconnect

### Database Tables

`exercises`, `routines`, `routine_exercises`, `workout_sessions`, `workout_sets`, `personal_records`, `body_measurements`, `user_preferences` — all with RLS. Types in `src/types/database.ts`.

### Path Alias

`@/` → `src/` (configured in tsconfig and vite.config.ts)

### Theme

Dynamic light/dark/system via `document.documentElement` class toggle in `App.tsx`, driven by `user_preferences` table. Uses `next-themes` pattern but implemented manually.
