/**
 * One-time seed script to populate exercises from ExerciseDB API into Supabase.
 *
 * Usage: npx tsx src/scripts/seedExercises.ts
 *
 * Required env vars:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 *   EXERCISEDB_API_KEY - RapidAPI key for ExerciseDB
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_KEY = process.env.EXERCISEDB_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_KEY) {
  console.error(
    "Missing env vars. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and EXERCISEDB_API_KEY"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface ExerciseDBExercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  secondaryMuscles: string[]
  instructions: string[]
  description?: string
  difficulty?: string
  category?: string
}

async function fetchAllExercises(): Promise<ExerciseDBExercise[]> {
  console.log("Fetching all exercises from ExerciseDB API...")
  const response = await fetch(
    "https://exercisedb.p.rapidapi.com/exercises?limit=0",
    {
      headers: {
        "X-RapidAPI-Key": API_KEY!,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`Fetched ${data.length} exercises`)
  return data
}

async function seedExercises() {
  const exercises = await fetchAllExercises()

  const BATCH_SIZE = 100
  let inserted = 0

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE).map((ex) => ({
      id: String(ex.id),
      name: ex.name,
      body_part: ex.bodyPart,
      target: ex.target,
      equipment: ex.equipment,
      secondary_muscles: ex.secondaryMuscles || [],
      instructions: ex.instructions || [],
      description: ex.description || null,
      difficulty: ex.difficulty || null,
      category: ex.category || null,
      synced_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from("exercises")
      .upsert(batch, { onConflict: "id" })

    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error)
    } else {
      inserted += batch.length
      console.log(`Inserted ${inserted}/${exercises.length} exercises`)
    }
  }

  console.log(`\nDone! ${inserted} exercises seeded.`)
}

seedExercises().catch(console.error)
