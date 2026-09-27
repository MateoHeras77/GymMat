import { beforeEach, describe, expect, it, vi } from "vitest"
import { ROUTINE_TEMPLATES } from "@/data/routineTemplates"

// --- Supabase mock: records every call per table ----------------------------
type Call = { table: string; op: string; payload?: unknown; filters: [string, unknown][] }
const calls: Call[] = []
let failExercisesInsert = false

function builder(table: string) {
  const call: Call = { table, op: "", filters: [] }
  calls.push(call)
  const b = {
    insert(payload: unknown) {
      call.op = "insert"
      call.payload = payload
      return b
    },
    update(payload: unknown) {
      call.op = "update"
      call.payload = payload
      return b
    },
    eq(col: string, val: unknown) {
      call.filters.push([col, val])
      return b
    },
    select: () => b,
    single: () => Promise.resolve({ data: { id: "routine-1", name: "x" }, error: null }),
    then(resolve: (v: unknown) => void) {
      const fail = table === "routine_exercises" && call.op === "insert" && failExercisesInsert
      resolve({ data: null, error: fail ? new Error("insert failed") : null })
    },
  }
  return b
}

vi.mock("@/lib/supabase", () => ({ supabase: { from: (t: string) => builder(t) } }))

const { createRoutineFromTemplate } = await import("./templateService")

beforeEach(() => {
  calls.length = 0
  failExercisesInsert = false
})

describe("ROUTINE_TEMPLATES", () => {
  it("is a 5-day split with 5-7 exercises per day", () => {
    expect(ROUTINE_TEMPLATES.map((t) => t.day)).toEqual([1, 2, 3, 4, 5])
    for (const t of ROUTINE_TEMPLATES) {
      expect(t.exercises.length).toBeGreaterThanOrEqual(5)
      expect(t.exercises.length).toBeLessThanOrEqual(7)
    }
  })

  it("has unique keys and names, and sane targets", () => {
    expect(new Set(ROUTINE_TEMPLATES.map((t) => t.key)).size).toBe(ROUTINE_TEMPLATES.length)
    expect(new Set(ROUTINE_TEMPLATES.map((t) => t.name)).size).toBe(ROUTINE_TEMPLATES.length)
    for (const ex of ROUTINE_TEMPLATES.flatMap((t) => t.exercises)) {
      expect(ex.exerciseId).toMatch(/^\d{4}$/)
      expect(ex.sets).toBeGreaterThan(0)
      expect(ex.reps).toMatch(/^\d+(-\d+)?$/)
      expect(ex.restSeconds).toBeGreaterThanOrEqual(30)
    }
  })
})

describe("createRoutineFromTemplate", () => {
  const push = ROUTINE_TEMPLATES[0]

  it("creates the routine and all its exercises in order with one batch insert", async () => {
    await createRoutineFromTemplate("user-1", push)

    const [routineCall, exercisesCall] = calls
    expect(routineCall).toMatchObject({ table: "routines", op: "insert" })
    expect(routineCall.payload).toMatchObject({ user_id: "user-1", name: push.name })

    expect(exercisesCall).toMatchObject({ table: "routine_exercises", op: "insert" })
    const rows = exercisesCall.payload as Record<string, unknown>[]
    expect(rows).toHaveLength(push.exercises.length)
    rows.forEach((row, i) => {
      expect(row).toEqual({
        routine_id: "routine-1",
        exercise_id: push.exercises[i].exerciseId,
        sort_order: i,
        target_sets: push.exercises[i].sets,
        target_reps: push.exercises[i].reps,
        rest_seconds: push.exercises[i].restSeconds,
      })
    })
    expect(calls).toHaveLength(2)
  })

  it("archives the new routine if adding its exercises fails", async () => {
    failExercisesInsert = true

    await expect(createRoutineFromTemplate("user-1", push)).rejects.toThrow("insert failed")

    const rollback = calls[2]
    expect(rollback).toMatchObject({ table: "routines", op: "update", payload: { is_archived: true } })
    expect(rollback.filters).toEqual([
      ["id", "routine-1"],
      ["user_id", "user-1"],
    ])
  })
})
