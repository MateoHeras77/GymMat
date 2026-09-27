import { supabase } from "@/lib/supabase"
import type { RoutineTemplate } from "@/data/routineTemplates"
import type { Routine } from "@/types/routine"

/**
 * Clones a built-in template into the user's own routine + routine_exercises.
 * Exercises go in one batch insert; if it fails the new routine is archived so
 * the user never ends up with an empty half-created routine.
 */
export async function createRoutineFromTemplate(
  userId: string,
  template: RoutineTemplate
): Promise<Routine> {
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      name: template.name,
      description: template.description,
      template_type: template.focus,
      estimated_duration_min: template.estimatedMinutes,
    })
    .select()
    .single()

  if (routineError) throw routineError

  const { error: exercisesError } = await supabase.from("routine_exercises").insert(
    template.exercises.map((ex, index) => ({
      routine_id: routine.id,
      exercise_id: ex.exerciseId,
      sort_order: index,
      target_sets: ex.sets,
      target_reps: ex.reps,
      rest_seconds: ex.restSeconds,
    }))
  )

  if (exercisesError) {
    await supabase
      .from("routines")
      .update({ is_archived: true })
      .eq("id", routine.id)
      .eq("user_id", userId)
    throw exercisesError
  }

  return routine as Routine
}
