import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./useAuth"
import type { Routine, RoutineInsert } from "@/types/routine"

export function useRoutines() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["routines", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("sort_order")

      if (error) throw error
      return data as Routine[]
    },
    enabled: !!user,
  })

  const createRoutine = useMutation({
    mutationFn: async (routine: Omit<RoutineInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("routines")
        .insert({ ...routine, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as Routine
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
    },
  })

  const updateRoutine = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<RoutineInsert>) => {
      const { data, error } = await supabase
        .from("routines")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as Routine
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
    },
  })

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("routines")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
    },
  })

  return {
    routines,
    isLoading,
    createRoutine,
    updateRoutine,
    deleteRoutine,
  }
}
