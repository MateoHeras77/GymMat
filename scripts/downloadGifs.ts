/**
 * Downloads GIFs for ALL exercises from ExerciseDB API
 * and uploads them to Supabase Storage.
 *
 * Supports multiple API keys to maximize monthly quota.
 * Rotates to next key when one gets rate-limited (429).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/downloadGifs.ts
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

// Load .env file manually (no dotenv dependency needed)
const envPath = resolve(import.meta.dirname, "../.env")
const envFile = readFileSync(envPath, "utf-8")
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match && !process.env[match[1].trim()]) {
    process.env[match[1].trim()] = match[2].trim()
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Ensure .env has VITE_SUPABASE_URL and pass SUPABASE_SERVICE_ROLE_KEY manually."
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Two API keys — 690 requests/month each = 1380 total
const API_KEYS = [
  "97fde48068msh3793e2c07e222e7p172817jsnd176c22a87ca",
  "7f32888a48msh378beb96d2932d2p15868djsnefd014a934e6",
]

let currentKeyIndex = 0
const keyUsage = API_KEYS.map(() => 0)
const exhaustedKeys = new Set<number>()

function getCurrentKey(): string | null {
  if (exhaustedKeys.size >= API_KEYS.length) return null
  while (exhaustedKeys.has(currentKeyIndex)) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  }
  return API_KEYS[currentKeyIndex]
}

function rotateKey(): string | null {
  exhaustedKeys.add(currentKeyIndex)
  console.log(`\n  Key #${currentKeyIndex + 1} exhausted (${keyUsage[currentKeyIndex]} requests used). Switching...`)
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return getCurrentKey()
}

const BATCH_SIZE = 10
const BATCH_DELAY_MS = 2500 // slightly conservative to respect 1000/hour rate limit

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function downloadGif(
  exerciseId: string,
  exerciseName: string
): Promise<boolean | "exhausted"> {
  const apiKey = getCurrentKey()
  if (!apiKey) return "exhausted"

  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    )

    keyUsage[currentKeyIndex]++

    // Rate limited or quota exceeded — try next key
    if (response.status === 429 || response.status === 403) {
      const nextKey = rotateKey()
      if (!nextKey) return "exhausted"
      // Retry with new key
      return downloadGif(exerciseId, exerciseName)
    }

    if (!response.ok) {
      console.error(`  FAIL: ${exerciseName} (HTTP ${response.status})`)
      return false
    }

    const blob = await response.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())

    // Upload to Supabase Storage
    const filePath = `${exerciseId}.gif`
    const { error: uploadError } = await supabase.storage
      .from("exercise-gifs")
      .upload(filePath, buffer, {
        contentType: "image/gif",
        upsert: true,
      })

    if (uploadError) {
      console.error(`  FAIL upload: ${exerciseName}:`, uploadError.message)
      return false
    }

    // Get public URL and update exercise record
    const {
      data: { publicUrl },
    } = supabase.storage.from("exercise-gifs").getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from("exercises")
      .update({ gif_url_180: publicUrl })
      .eq("id", exerciseId)

    if (updateError) {
      console.error(`  FAIL update: ${exerciseName}:`, updateError.message)
      return false
    }

    return true
  } catch (error) {
    console.error(`  FAIL: ${exerciseName}:`, error)
    return false
  }
}

async function main() {
  console.log("Querying exercises without GIFs...")

  // Fetch ALL exercises that don't have GIFs yet (paginate to avoid 1000-row limit)
  const exercises: { id: string; name: string }[] = []
  let from = 0
  const PAGE_SIZE = 1000
  while (true) {
    const { data, error: fetchErr } = await supabase
      .from("exercises")
      .select("id, name")
      .is("gif_url_180", null)
      .order("id")
      .range(from, from + PAGE_SIZE - 1)
    if (fetchErr) {
      console.error("Failed to query exercises:", fetchErr)
      process.exit(1)
    }
    exercises.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  const error = null

  if (error) {
    console.error("Failed to query exercises:", error)
    process.exit(1)
  }

  // Also check how many already have GIFs
  const { count } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true })
    .not("gif_url_180", "is", null)

  console.log(`Already downloaded: ${count} exercises`)
  console.log(`Remaining to download: ${exercises.length} exercises`)
  console.log(`Available API requests: ${API_KEYS.length} keys × 690 = ${API_KEYS.length * 690}`)
  console.log(`Rate limit: 1000 requests/hour per key`)
  console.log()

  if (exercises.length === 0) {
    console.log("All exercises already have GIFs!")
    return
  }

  let success = 0
  let failed = 0
  let stopped = false

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE)

    for (const exercise of batch) {
      const result = await downloadGif(exercise.id, exercise.name)

      if (result === "exhausted") {
        console.log(`\n  All API keys exhausted. Stopping.`)
        stopped = true
        break
      }

      if (result) {
        success++
        console.log(
          `  OK [${success + failed}/${exercises.length}] (key#${currentKeyIndex + 1}): ${exercise.name}`
        )
      } else {
        failed++
        console.log(
          `  FAIL [${success + failed}/${exercises.length}]: ${exercise.name}`
        )
      }
    }

    if (stopped) break

    // Delay between batches
    if (i + BATCH_SIZE < exercises.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  console.log(`\n--- Summary ---`)
  console.log(`Downloaded: ${success}`)
  console.log(`Failed: ${failed}`)
  console.log(`Remaining: ${exercises.length - success - failed}`)
  API_KEYS.forEach((_, i) => {
    console.log(`Key #${i + 1} used: ${keyUsage[i]} requests`)
  })
}

main().catch(console.error)
