import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Consistent error state for failed data fetches, with a Retry action that
 * re-runs the query (pass the query's `refetch`).
 */
export function QueryError({
  message = "Couldn't load this. Check your connection and try again.",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
