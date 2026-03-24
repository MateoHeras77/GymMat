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

GymMat is a mobile-first PWA gym workout tracker built with React 19 + TypeScript + Vite 7, using Supabase for auth/database/storage. Deployed to **Vercel** (`vercel.json` handles SPA rewrites + caching headers).

### Stack

- **UI**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) + shadcn/ui components built on **Base UI** (NOT Radix) + class-variance-authority
- **Server state**: TanStack Query v5 — custom hooks in `src/hooks/` wrap queries/mutations with cache invalidation. Default `staleTime: 5min`, `gcTime: 30min`.
- **Client state**: Zustand with localStorage persistence (`src/stores/`)
- **Forms**: React Hook Form + Zod v4
- **Routing**: React Router v7 with `createBrowserRouter` in `src/router.tsx`. All pages are **lazy-loaded** via `React.lazy()` + `Suspense`.
- **Charts**: Recharts v3 (only loaded in ProgressPage chunk)
- **PWA**: vite-plugin-pwa with Workbox service worker, offline mutation queue in `src/lib/offlineQueue.ts`

### Key Directories

```
src/
├── pages/          # One component per route (lazy-loaded)
├── hooks/          # TanStack Query hooks (useRoutines, useExercises, useWorkoutHistory, useProgress, etc.)
│   ├── useWakeLock.ts   # Screen Wake Lock API — keeps screen on during workouts
│   └── usePWA.ts        # Install prompt detection + online status
├── stores/         # Zustand stores (activeWorkoutStore, timerStore)
├── services/       # Business logic (workoutService saves workouts + batch PR check, gifService)
├── components/
│   ├── ui/         # shadcn primitives (button, card, dialog, input, etc.)
│   ├── layout/     # AppShell, Header, BottomNav, ActiveWorkoutBanner
│   ├── workout/    # SetLogger, RestTimer, WorkoutSummary
│   └── ...         # Feature-specific components
├── lib/
│   ├── supabase.ts      # Supabase client (env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   ├── audioManager.ts  # iOS-compatible audio: singleton AudioContext + HTML5 <audio> fallback
│   ├── offlineQueue.ts  # Offline mutation queue with toast notifications on sync
│   └── utils.ts         # cn() helper
└── types/          # database.ts (auto-generated Supabase types), routine.ts, workout.ts, exercise.ts
```

### Data Flow Patterns

- **Custom hooks** follow this pattern: call `useAuth()` for user context → `useQuery` for reads → `useMutation` with `queryClient.invalidateQueries()` for writes
- **Active workout state** lives in Zustand (not server), persisted to localStorage. Workout is started in `RoutineDetailPage` (which has fresh data), then `WorkoutPage` reads from the store — no query params or cache race conditions.
- **Supabase queries** are made directly in hooks via `supabase.from('table').select()...` — no separate API layer
- **Offline mutations** are queued in localStorage and replayed on reconnect (with toast notifications)
- **Delete mutations** always include `.eq("user_id", user.id)` as defense-in-depth alongside RLS
- **PR detection** uses batch fetch + in-memory comparison + single upsert (not N+1 queries)

### Database Tables

`exercises`, `routines`, `routine_exercises`, `workout_sessions`, `workout_sets`, `personal_records`, `body_measurements`, `user_preferences` — all with RLS. Types in `src/types/database.ts`.

### Path Alias

`@/` → `src/` (configured in tsconfig and vite.config.ts)

### Theme

Dynamic light/dark/system via `document.documentElement` class toggle in `App.tsx`, driven by `user_preferences` table. Implemented manually (no external theme library).

## PWA & iOS

### Service Worker (Workbox)

- **Supabase REST API**: `NetworkFirst` with 5s timeout (fresh data first, cache fallback offline)
- **Supabase Storage** (GIFs): `CacheFirst` with 30-day expiry
- **Static assets**: Precached at build time (JS, CSS, HTML, fonts, icons, `notification.wav`)

### iOS-Specific Handling

- **Audio**: `src/lib/audioManager.ts` uses a singleton `AudioContext` unlocked on first user touch (`AppShell.tsx`). HTML5 `<audio>` with `/sounds/notification.wav` as fallback to bypass iOS mute switch. Web Audio alone doesn't work on iOS without user gesture unlock.
- **Timer**: `timerStore.ts` uses **wall-clock comparison** (`Date.now()`) instead of decrementing counter — iOS throttles `setInterval` to ~60s when backgrounded, wall-clock catches up instantly on foreground return.
- **Wake Lock**: `useWakeLock.ts` keeps screen on during active workouts. Re-acquires on visibility change. Supported on iOS 16.4+.
- **Touch**: `touch-action: manipulation` on all elements (prevents 300ms tap delay). Hover variant scoped to `@media (hover: hover)` to prevent double-tap-to-activate on iOS.
- **Viewport**: `viewport-fit=cover` with `env(safe-area-inset-*)` for notch/Dynamic Island support.
- **Limitations**: `navigator.vibrate()` and `new Notification()` do NOT work on iOS. Background audio/timers are suspended when PWA is not in foreground.

### Deployment (Vercel)

- `vercel.json`: SPA rewrites (excluding static assets), `Cache-Control` headers for SW (`no-cache`), assets (`immutable`), manifest (`application/manifest+json`)
- CSP meta tag in `index.html` restricts sources (includes `wss://*.supabase.co` for realtime, `media-src data: blob:` for audio)

## Performance

- **Code splitting**: All pages lazy-loaded → main bundle ~620KB (down from 1.15MB)
- **Query limits**: Progress hooks use `.limit(500-2000)` to prevent unbounded fetches
- **Error boundary**: `App.tsx` wraps entire app — crashes show "Something went wrong" with reload button
- **IDs**: Use `crypto.randomUUID()` everywhere (not `Math.random()`)

## Mock Data

There is seeded mock data tagged with `MOCK_SEED_2026` in the database. Cleanup SQL is in `scripts/cleanup-mock-data.sql`.
