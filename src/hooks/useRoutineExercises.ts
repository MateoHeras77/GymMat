import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { RoutineExercise, RoutineExerciseInsert } from "@/types/routine"
import type { Exercise } from "@/types/exercise"

export type RoutineExerciseWithDetails = RoutineExercise & {
  exercise: Exercise
}

export function useRoutineExercises(routineId: string | undefined) {
  const queryClient = useQueryClient()

  const { data: routineExercises = [], isLoading } = useQuery({
    queryKey: ["routine-exercises", routineId],
    queryFn: async () => {
      if (!routineId) return []
      const { data, error } = await supabase
        .from("routine_exercises")
        .select("*, exercise:exercises(*)")
        .eq("routine_id", routineId)
        .order("sort_order")

      if (error) throw error
      return data as unknown as RoutineExerciseWithDetails[]
    },
    enabled: !!routineId,
  })

  const addExercise = useMutation({
    mutationFn: async (
      input: Omit<RoutineExerciseInsert, "routine_id"> & {
        routine_id?: string
      }
    ) => {
      const rid = input.routine_id ?? routineId
      if (!rid) throw new Error("No routine ID")

      const maxOrder = routineExercises.length
      const { data, error } = await supabase
        .from("routine_exercises")
        .insert({
          ...input,
          routine_id: rid,
          sort_order: input.sort_order ?? maxOrder,
        })
        .select("*, exercise:exercises(*)")
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["routine-exercises", routineId],
      })
    },
  })

  const updateExercise = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<RoutineExerciseInsert>) => {
      const { error } = await supabase
        .from("routine_exercises")
        .update(updates)
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["routine-exercises", routineId],
      })
    },
  })

  const removeExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["routine-exercises", routineId],
      })
    },
  })

  const reorderExercises = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from("routine_exercises")
          .update({ sort_order: index })
          .eq("id", id)
      )
      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["routine-exercises", routineId],
      })
    },
  })

  return {
    routineExercises,
    isLoading,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
  }
}
