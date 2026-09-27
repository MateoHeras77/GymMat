import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Gym Wi-Fi / weak LTE often reports "online" but requests hang for minutes.
// Abort instead so callers fail fast (workouts are already queued locally).
const REQUEST_TIMEOUT_MS = 12_000
// Edge Functions (GIF download) fetch + upload server-side; give them longer.
const FUNCTION_TIMEOUT_MS = 30_000

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input)
  const ms = url.includes("/functions/v1/") ? FUNCTION_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  const timeout = AbortSignal.timeout(ms)
  const signal =
    init?.signal && "any" in AbortSignal
      ? AbortSignal.any([init.signal, timeout])
      : (init?.signal ?? timeout)
  return fetch(input, { ...init, signal })
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
})
