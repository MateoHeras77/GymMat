import { usePreferences } from "./usePreferences"
import {
  formatWeight,
  fromDisplayWeight,
  toDisplayWeight,
  type WeightUnit,
} from "@/lib/weightUnits"

/** The user's display unit plus converters (storage is always lbs). */
export function useWeightUnit() {
  const { preferences } = usePreferences()
  const unit: WeightUnit = preferences.weight_unit
  const otherUnit: WeightUnit = unit === "kg" ? "lbs" : "kg"

  return {
    unit,
    otherUnit,
    showDual: preferences.show_dual_units,
    toDisplay: (lbs: number) => toDisplayWeight(lbs, unit),
    fromDisplay: (value: number) => fromDisplayWeight(value, unit),
    format: (lbs: number) => formatWeight(lbs, unit),
    formatOther: (lbs: number) => formatWeight(lbs, otherUnit),
  }
}
