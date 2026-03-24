import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useRoutines } from "@/hooks/useRoutines"

export function RoutineFormPage() {
  const navigate = useNavigate()
  const { createRoutine } = useRoutines()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      const result = await createRoutine.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        estimated_duration_min: estimatedDuration
          ? parseInt(estimatedDuration)
          : null,
      })
      navigate(`/routines/${result.id}`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Routine</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Routine Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Push Day, Leg Day"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this routine"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="e.g., 60"
                min="1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving || !name.trim()}>
              {saving ? "Creating..." : "Create Routine"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
