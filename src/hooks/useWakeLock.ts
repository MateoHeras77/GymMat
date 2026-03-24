import { useEffect, useRef } from "react"

export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return

    let released = false

    const request = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null
        })
      } catch {
        // Permission denied or not supported — silent fallback
      }
    }

    // Re-acquire on visibility change (browser releases it when tab is hidden)
    const onVisibilityChange = () => {
      if (!released && document.visibilityState === "visible" && !wakeLockRef.current) {
        request()
      }
    }

    request()
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      released = true
      document.removeEventListener("visibilitychange", onVisibilityChange)
      wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [active])
}
