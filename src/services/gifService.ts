import { supabase } from "@/lib/supabase"

const API_KEY = import.meta.env.VITE_EXERCISEDB_API_KEY

/**
 * Downloads a GIF for an exercise from ExerciseDB API,
 * uploads it to Supabase Storage, and updates the exercise record.
 *
 * Note: This uses an API request (690/month limit on free tier).
 */
export async function downloadExerciseGif(
  exerciseId: string
): Promise<string | null> {
  if (!API_KEY) {
    console.warn("VITE_EXERCISEDB_API_KEY is not set — cannot download exercise GIFs")
    return null
  }

  try {
    // Check if GIF already exists
    const { data: exercise } = await supabase
      .from("exercises")
      .select("gif_url_180")
      .eq("id", exerciseId)
      .single()

    if (exercise?.gif_url_180) {
      return exercise.gif_url_180
    }

    // Fetch GIF from ExerciseDB API
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180`,
      {
        headers: {
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    )

    if (!response.ok) {
      console.error(`Failed to fetch GIF for exercise ${exerciseId}`)
      return null
    }

    const blob = await response.blob()

    // Upload to Supabase Storage
    const filePath = `${exerciseId}.gif`
    const { error: uploadError } = await supabase.storage
      .from("exercise-gifs")
      .upload(filePath, blob, {
        contentType: "image/gif",
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return null
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("exercise-gifs").getPublicUrl(filePath)

    // Update exercise record
    await supabase
      .from("exercises")
      .update({ gif_url_180: publicUrl })
      .eq("id", exerciseId)

    return publicUrl
  } catch (error) {
    console.error("Error downloading GIF:", error)
    return null
  }
}
