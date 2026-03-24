import { useTimerStore } from "@/stores/timerStore"
import { formatTimerDisplay } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { X, Pause, Play } from "lucide-react"

export function RestTimer() {
  const { isRunning, totalSeconds, remainingSeconds, startTimer, stopTimer, resetTimer } =
    useTimerStore()

  if (!isRunning && remainingSeconds === 0) return null

  const progress = totalSeconds > 0
    ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
    : 0

  const isComplete = !isRunning && remainingSeconds === 0 && totalSeconds > 0

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 flex justify-center px-4 safe-bottom">
      <div className="flex w-full max-w-lg items-center gap-3 rounded-2xl bg-card border shadow-lg px-4 py-3">
        {/* Progress circle */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-secondary"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <span className="absolute text-xs font-bold">
            {formatTimerDisplay(remainingSeconds)}
          </span>
        </div>

        {/* Label */}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isComplete ? "Rest Complete!" : "Rest Timer"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isComplete
              ? "Ready for next set"
              : `${formatTimerDisplay(remainingSeconds)} remaining`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {isRunning ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopTimer}>
              <Pause className="h-4 w-4" />
            </Button>
          ) : remainingSeconds > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => startTimer(remainingSeconds)}
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetTimer}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
