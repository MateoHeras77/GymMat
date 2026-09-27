import { KG_TO_LBS, LBS_TO_KG } from "@/lib/constants"

/**
 * Weights are always STORED in lbs (canonical unit). The user's preference
 * only changes what is displayed and typed. Convert at the UI boundary with
 * these helpers and never store a kg value.
 */
export type WeightUnit = "lbs" | "kg"

const round = (n: number, step: number) => Math.round(n / step) * step

/** Stored lbs → number shown to the user (0.1 precision). */
export function toDisplayWeight(lbs: number, unit: WeightUnit): number {
  const value = unit === "kg" ? lbs * LBS_TO_KG : lbs
  return Number(round(value, 0.1).toFixed(1))
}

/** Number typed by the user → lbs to store (0.01 precision so kg round-trips). */
export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  const lbs = unit === "kg" ? value * KG_TO_LBS : value
  return Number(round(lbs, 0.01).toFixed(2))
}

export function formatWeight(lbs: number, unit: WeightUnit): string {
  return `${toDisplayWeight(lbs, unit)} ${unit}`
}

/** Smallest sensible jump in the user's unit: 5 lbs or 2.5 kg. */
export function weightIncrement(unit: WeightUnit): number {
  return unit === "kg" ? 2.5 : 5
}

/** Upper end of a rep target: "8-12" → 12, "10" → 10, "AMRAP" → null. */
export function topOfRepRange(targetReps: string): number | null {
  const match = targetReps.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (match) return parseInt(match[2])
  const single = parseInt(targetReps)
  return isNaN(single) ? null : single
}

export interface LastSet {
  setNumber: number
  setType: string
  weight: number | null
  reps: number | null
}

/**
 * Double progression: if every working set last time reached the top of the
 * rep range at the same weight, suggest the next weight up (in lbs, rounded
 * to a loadable value in the user's unit). Otherwise null.
 */
export function suggestNextWeight(
  lastSets: LastSet[] | undefined,
  targetReps: string,
  unit: WeightUnit
): number | null {
  const top = topOfRepRange(targetReps)
  const working = (lastSets ?? []).filter((s) => s.setType !== "warmup")
  if (top == null || working.length === 0) return null
  if (working.some((s) => s.reps == null || s.reps < top)) return null

  const weights = working.map((s) => s.weight ?? 0)
  const heaviest = Math.max(...weights)
  if (heaviest <= 0) return null

  const step = weightIncrement(unit)
  const next = round(toDisplayWeight(heaviest, unit), step) + step
  return fromDisplayWeight(next, unit)
}
