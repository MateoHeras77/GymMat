import { useState, useMemo } from "react"
import { format, startOfWeek } from "date-fns"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Trophy, Plus, Trash2, Scale } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  usePersonalRecords,
  useExerciseHistory,
  useWeeklyVolume,
  useBodyMeasurements,
  useUserExercises,
} from "@/hooks/useProgress"
import { formatWeight } from "@/lib/constants"

export function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Track your gains</p>
      </div>

      <Tabs defaultValue="strength">
        <TabsList className="w-full">
          <TabsTrigger value="strength" className="flex-1">
            Strength
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex-1">
            Volume
          </TabsTrigger>
          <TabsTrigger value="prs" className="flex-1">
            PRs
          </TabsTrigger>
          <TabsTrigger value="body" className="flex-1">
            Body
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strength">
          <StrengthTab />
        </TabsContent>
        <TabsContent value="volume">
          <VolumeTab />
        </TabsContent>
        <TabsContent value="prs">
          <PRsTab />
        </TabsContent>
        <TabsContent value="body">
          <BodyTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Strength Tab ───

function StrengthTab() {
  const exercises = useUserExercises()
  const [selectedExercise, setSelectedExercise] = useState<string | undefined>()

  // Auto-select first exercise
  const exerciseId = selectedExercise ?? exercises[0]?.id

  const { sets, isLoading } = useExerciseHistory(exerciseId)

  const chartData = useMemo(() => {
    if (!sets.length) return []

    // Group by session date, take max weight per session
    const byDate = new Map<string, { maxWeight: number; maxVolume: number }>()
    for (const s of sets) {
      if (s.weight == null || s.set_type === "warmup") continue
      const date = format(new Date(s.session.started_at), "MMM d")
      const existing = byDate.get(date)
      const volume = (s.weight ?? 0) * (s.reps ?? 0)
      if (!existing) {
        byDate.set(date, { maxWeight: s.weight, maxVolume: volume })
      } else {
        existing.maxWeight = Math.max(existing.maxWeight, s.weight)
        existing.maxVolume = Math.max(existing.maxVolume, volume)
      }
    }

    return Array.from(byDate.entries()).map(([date, data]) => ({
      date,
      weight: data.maxWeight,
      volume: data.maxVolume,
    }))
  }, [sets])

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Complete workouts to see your strength progress
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Exercise selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {exercises.map((ex) => (
          <Badge
            key={ex.id}
            variant={exerciseId === ex.id ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap capitalize"
            onClick={() => setSelectedExercise(ex.id)}
          >
            {ex.name}
          </Badge>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Max Weight (lbs)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-secondary" />
          ) : chartData.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Need at least 2 sessions to show a chart
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Volume Tab ───

function VolumeTab() {
  const { weeklyData, isLoading } = useWeeklyVolume()

  const chartData = useMemo(() => {
    if (!weeklyData.length) return []

    // Group by week
    const byWeek = new Map<string, number>()
    for (const s of weeklyData) {
      const weekStart = startOfWeek(new Date(s.session.started_at), {
        weekStartsOn: 1,
      })
      const key = format(weekStart, "MMM d")
      const volume = (s.weight ?? 0) * (s.reps ?? 0)
      byWeek.set(key, (byWeek.get(key) ?? 0) + volume)
    }

    return Array.from(byWeek.entries()).map(([week, volume]) => ({
      week,
      volume: Math.round(volume),
    }))
  }, [weeklyData])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Volume (lbs)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded bg-secondary" />
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Complete workouts to see volume trends
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} lbs`,
                  "Volume",
                ]}
              />
              <Bar
                dataKey="volume"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── PRs Tab ───

function PRsTab() {
  const { records, isLoading } = usePersonalRecords()

  // Group PRs by exercise
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { name: string; bodyPart: string; prs: typeof records }
    >()
    for (const r of records) {
      const key = r.exercise_id
      if (!map.has(key)) {
        map.set(key, {
          name: r.exercise.name,
          bodyPart: r.exercise.body_part,
          prs: [],
        })
      }
      map.get(key)!.prs.push(r)
    }
    return Array.from(map.values())
  }, [records])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-20 pt-4" />
          </Card>
        ))}
      </div>
    )
  }

  if (grouped.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
          No personal records yet. Complete workouts to set PRs!
        </CardContent>
      </Card>
    )
  }

  const prLabel = (type: string) => {
    switch (type) {
      case "max_weight":
        return "Weight"
      case "max_reps":
        return "Reps"
      case "max_volume":
        return "Volume"
      default:
        return type
    }
  }

  const prValue = (type: string, value: number) => {
    switch (type) {
      case "max_weight":
        return formatWeight(value)
      case "max_reps":
        return `${value} reps`
      case "max_volume":
        return `${value.toLocaleString()} lbs`
      default:
        return String(value)
    }
  }

  return (
    <div className="space-y-3">
      {grouped.map((group) => (
        <Card key={group.name}>
          <CardContent className="py-3">
            <p className="text-sm font-semibold capitalize">{group.name}</p>
            <p className="text-xs text-muted-foreground capitalize mb-2">
              {group.bodyPart}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.prs.map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5"
                >
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <div>
                    <p className="text-xs font-medium">
                      {prValue(pr.record_type, Number(pr.value))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {prLabel(pr.record_type)} ·{" "}
                      {format(new Date(pr.achieved_at), "MMM d")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Body Tab ───

function BodyTab() {
  const { measurements, isLoading, addMeasurement, deleteMeasurement } =
    useBodyMeasurements()
  const [showForm, setShowForm] = useState(false)

  const chartData = useMemo(() => {
    return [...measurements]
      .reverse()
      .filter((m) => m.body_weight != null)
      .map((m) => ({
        date: format(new Date(m.measured_at), "MMM d"),
        weight: Number(m.body_weight),
      }))
  }, [measurements])

  return (
    <div className="space-y-4">
      {/* Weight chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Body Weight</CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-secondary" />
          ) : chartData.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Add at least 2 measurements to see a chart
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={40}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value} lbs`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent measurements */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Measurements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {measurements.slice(0, 10).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(m.measured_at), "MMM d, yyyy")}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {m.body_weight != null && (
                      <span>
                        <Scale className="mr-0.5 inline h-3 w-3" />
                        {Number(m.body_weight)} lbs
                      </span>
                    )}
                    {m.body_fat_pct != null && (
                      <span>{Number(m.body_fat_pct)}% BF</span>
                    )}
                    {m.chest != null && <span>Chest: {Number(m.chest)}"</span>}
                    {m.waist != null && <span>Waist: {Number(m.waist)}"</span>}
                    {m.bicep_left != null && (
                      <span>Bicep: {Number(m.bicep_left)}"</span>
                    )}
                  </div>
                </div>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Delete this measurement?")) {
                      deleteMeasurement.mutate(m.id)
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add measurement dialog */}
      <MeasurementForm
        open={showForm}
        onOpenChange={setShowForm}
        onSave={(data) => {
          addMeasurement.mutate(data)
          setShowForm(false)
        }}
      />
    </div>
  )
}

// ─── Measurement Form Dialog ───

function MeasurementForm({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    measured_at: string
    body_weight: number | null
    body_fat_pct: number | null
    chest: number | null
    waist: number | null
    hips: number | null
    bicep_left: number | null
    bicep_right: number | null
    thigh_left: number | null
    thigh_right: number | null
    calf_left: number | null
    calf_right: number | null
    notes: string | null
  }) => void
}) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [bodyWeight, setBodyWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [chest, setChest] = useState("")
  const [waist, setWaist] = useState("")
  const [hips, setHips] = useState("")
  const [bicep, setBicep] = useState("")
  const [thigh, setThigh] = useState("")
  const [calf, setCalf] = useState("")

  const parseNum = (v: string) => (v ? parseFloat(v) : null)

  const handleSave = () => {
    onSave({
      measured_at: date,
      body_weight: parseNum(bodyWeight),
      body_fat_pct: parseNum(bodyFat),
      chest: parseNum(chest),
      waist: parseNum(waist),
      hips: parseNum(hips),
      bicep_left: parseNum(bicep),
      bicep_right: parseNum(bicep),
      thigh_left: parseNum(thigh),
      thigh_right: parseNum(thigh),
      calf_left: parseNum(calf),
      calf_right: parseNum(calf),
      notes: null,
    })
    // Reset
    setBodyWeight("")
    setBodyFat("")
    setChest("")
    setWaist("")
    setHips("")
    setBicep("")
    setThigh("")
    setCalf("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex max-h-[80vh] !flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Measurement</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Body Weight (lbs)</Label>
              <Input
                type="number"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body Fat %</Label>
              <Input
                type="number"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Chest (in)</Label>
              <Input
                type="number"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Waist (in)</Label>
              <Input
                type="number"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hips (in)</Label>
              <Input
                type="number"
                value={hips}
                onChange={(e) => setHips(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Bicep (in)</Label>
              <Input
                type="number"
                value={bicep}
                onChange={(e) => setBicep(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Thigh (in)</Label>
              <Input
                type="number"
                value={thigh}
                onChange={(e) => setThigh(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Calf (in)</Label>
              <Input
                type="number"
                value={calf}
                onChange={(e) => setCalf(e.target.value)}
                placeholder="--"
                step="0.1"
              />
            </div>
          </div>
        </div>
        <Button className="w-full shrink-0" onClick={handleSave}>
          Save Measurement
        </Button>
      </DialogContent>
    </Dialog>
  )
}
