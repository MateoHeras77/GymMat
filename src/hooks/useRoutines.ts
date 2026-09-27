import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./useAuth"
import type { Routine, RoutineInsert } from "@/types/routine"
import type { RoutineTemplate } from "@/data/routineTemplates"
import { createRoutineFromTemplate } from "@/services/templateService"

export function useRoutines() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: routines = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
      if (!user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("routines")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id) // defense-in-depth alongside RLS
        .select()
        .single()

      if (error) throw error
      return data as Routine
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
    },
  })

  const createFromTemplate = useMutation({
    mutationFn: async (templates: RoutineTemplate[]) => {
      if (!user) throw new Error("Not authenticated")
      const created: Routine[] = []
      // Sequential so routines keep the template order (Day 1, Day 2, ...).
      for (const template of templates) {
        created.push(await createRoutineFromTemplate(user.id, template))
      }
      return created
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
    },
  })

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated")
      const { error } = await supabase
        .from("routines")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id) // defense-in-depth alongside RLS

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
    },
  })

  return {
    routines,
    isLoading,
    isError,
    refetch,
    createRoutine,
    createFromTemplate,
    updateRoutine,
    deleteRoutine,
  }
}
