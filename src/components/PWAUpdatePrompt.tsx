import { useEffect } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "sonner"

/**
 * Surfaces service-worker lifecycle events to the user:
 * - "App ready to work offline" once the SW has precached everything.
 * - "New version available → Reload" when an updated SW is waiting, so a long
 *   gym session isn't stuck on a stale build (which can also break lazy chunk
 *   imports after a deploy).
 *
 * Renders nothing; it only drives toasts.
 */
export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    toast.success("App ready to work offline")
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady])

  useEffect(() => {
    if (!needRefresh) return
    toast("New version available", {
      description: "Reload to update GymMat.",
      duration: Infinity,
      action: {
        label: "Reload",
        onClick: () => updateServiceWorker(true),
      },
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
