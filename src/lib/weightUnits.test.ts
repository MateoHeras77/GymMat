import { describe, expect, it } from "vitest"
import {
  fromDisplayWeight,
  suggestNextWeight,
  toDisplayWeight,
  topOfRepRange,
  type LastSet,
} from "./weightUnits"

const set = (weight: number | null, reps: number | null, setType = "working"): LastSet => ({
  setNumber: 1,
  setType,
  weight,
  reps,
})

describe("unit conversion (storage is lbs)", () => {
  it("round-trips common kg plate weights without drift", () => {
    for (const kg of [2.5, 20, 42.5, 60, 62.5, 100, 142.5]) {
      expect(toDisplayWeight(fromDisplayWeight(kg, "kg"), "kg")).toBe(kg)
    }
  })

  it("leaves lbs untouched", () => {
    expect(fromDisplayWeight(135, "lbs")).toBe(135)
    expect(toDisplayWeight(137.5, "lbs")).toBe(137.5)
  })

  it("shows lbs stored by older sessions in kg", () => {
    expect(toDisplayWeight(135, "kg")).toBe(61.2)
  })
})

describe("topOfRepRange", () => {
  it.each([
    ["8-12", 12],
    ["10", 10],
    ["6 – 8", 8],
    ["AMRAP", null],
  ])("%s → %s", (input, expected) => {
    expect(topOfRepRange(input)).toBe(expected)
  })
})

describe("suggestNextWeight", () => {
  it("suggests +5 lbs when every working set hit the top of the range", () => {
    expect(suggestNextWeight([set(135, 10), set(135, 10), set(135, 11)], "8-10", "lbs")).toBe(140)
  })

  it("suggests +2.5 kg for kg users, returned in lbs", () => {
    const lbs = suggestNextWeight([set(fromDisplayWeight(60, "kg"), 10)], "8-10", "kg")
    expect(toDisplayWeight(lbs!, "kg")).toBe(62.5)
  })

  it("rounds odd previous weights to a loadable value before adding", () => {
    // 61.2 kg (from 135 lbs) → 60 + 2.5
    expect(toDisplayWeight(suggestNextWeight([set(135, 12)], "12", "kg")!, "kg")).toBe(62.5)
  })

  it("does not suggest when any working set fell short", () => {
    expect(suggestNextWeight([set(135, 10), set(135, 8)], "8-10", "lbs")).toBeNull()
  })

  it("ignores warmups", () => {
    expect(suggestNextWeight([set(95, 5, "warmup"), set(135, 10)], "8-10", "lbs")).toBe(140)
  })

  it("does not suggest without history, weight or a numeric target", () => {
    expect(suggestNextWeight(undefined, "8-10", "lbs")).toBeNull()
    expect(suggestNextWeight([set(null, 12)], "8-10", "lbs")).toBeNull()
    expect(suggestNextWeight([set(135, 12)], "AMRAP", "lbs")).toBeNull()
  })
})
