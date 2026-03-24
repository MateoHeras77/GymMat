import type { Database } from "./database"

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
export type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"]

export function getGifUrl(exercise: Exercise): string | null {
  return exercise.gif_url_hd ?? exercise.gif_url_180 ?? null
}
