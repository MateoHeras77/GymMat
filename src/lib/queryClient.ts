import { QueryClient } from "@tanstack/react-query"

// Shared instance so non-React code (e.g. the workout sync queue) can
// invalidate cached queries after writing.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
})
