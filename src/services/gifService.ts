import { supabase } from "@/lib/supabase"

/**
 * Downloads a GIF for an exercise.
 *
 * The actual RapidAPI request happens server-side in the `download-exercise-gif`
 * Edge Function so the RapidAPI key never ships in the client bundle. The
 * function fetches the GIF, stores it in Supabase Storage, updates the exercise
 * record, and returns the public URL.
 */
export async function downloadExerciseGif(
  exerciseId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke<{ url?: string }>(
      "download-exercise-gif",
      { body: { exerciseId } }
    )

    if (error) {
      if (import.meta.env.DEV) console.error("Error downloading GIF:", error)
      return null
    }

    return data?.url ?? null
  } catch (error) {
    if (import.meta.env.DEV) console.error("Error downloading GIF:", error)
    return null
  }
}
