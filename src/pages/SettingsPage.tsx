import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { usePreferences } from "@/hooks/usePreferences"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LogOut, Sun, Moon, Monitor, Download, Check, Send } from "lucide-react"
import { useInstallPrompt } from "@/hooks/usePWA"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { preferences, updatePreferences } = usePreferences()
  const { canInstall, isInstalled, install } = useInstallPrompt()

  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "other">("bug")
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [sendingFeedback, setSendingFeedback] = useState(false)

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim() || !user) return
    setSendingFeedback(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("feedback").insert({
      user_id: user.id,
      type: feedbackType,
      message: feedbackMessage.trim(),
    })
    setSendingFeedback(false)
    if (error) {
      toast.error("Failed to send feedback")
    } else {
      toast.success("Feedback sent!")
      setFeedbackMessage("")
    }
  }

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ]

  const unitOptions = [
    { value: "lbs" as const, label: "lbs" },
    { value: "kg" as const, label: "kg" },
  ]

  const feedbackTypes = [
    { value: "bug" as const, label: "Bug" },
    { value: "feature" as const, label: "Feature" },
    { value: "other" as const, label: "Other" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">App preferences</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-sm transition-colors ${
                  preferences.theme === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-secondary hover:bg-secondary/80"
                }`}
                onClick={() =>
                  updatePreferences.mutate({ theme: opt.value })
                }
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Units & Workout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weight unit */}
          <div className="space-y-1.5">
            <Label>Weight Unit</Label>
            <div className="flex gap-2">
              {unitOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    preferences.weight_unit === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-secondary hover:bg-secondary/80"
                  }`}
                  onClick={() =>
                    updatePreferences.mutate({ weight_unit: opt.value })
                  }
                >
                  {opt.value}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.show_dual_units}
                  onChange={(e) =>
                    updatePreferences.mutate({
                      show_dual_units: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                Show both units
              </label>
            </div>
          </div>

          <Separator />

          {/* Default rest */}
          <div className="space-y-1.5">
            <Label htmlFor="rest">Default Rest Time (seconds)</Label>
            <Input
              id="rest"
              type="number"
              value={preferences.default_rest_seconds}
              onChange={(e) =>
                updatePreferences.mutate({
                  default_rest_seconds: parseInt(e.target.value) || 90,
                })
              }
              min="0"
              step="15"
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-1.5">
            {feedbackTypes.map((t) => (
              <Badge
                key={t.value}
                variant={feedbackType === t.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFeedbackType(t.value)}
                render={<button type="button" />}
              >
                {t.label}
              </Badge>
            ))}
          </div>
          <Textarea
            placeholder="Describe the bug or your idea..."
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            rows={3}
          />
          <Button
            className="w-full"
            size="sm"
            onClick={handleSendFeedback}
            disabled={!feedbackMessage.trim() || sendingFeedback}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sendingFeedback ? "Sending..." : "Send Feedback"}
          </Button>
        </CardContent>
      </Card>

      {/* Install App */}
      {(canInstall || isInstalled) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Install App</CardTitle>
          </CardHeader>
          <CardContent>
            {isInstalled ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                App is installed
              </div>
            ) : (
              <Button className="w-full" onClick={install}>
                <Download className="mr-2 h-4 w-4" />
                Install GymMat
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm">{user?.email}</p>
          </div>
          <Separator />
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
