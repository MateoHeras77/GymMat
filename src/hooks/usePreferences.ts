import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./useAuth"
import type { UserPreferences } from "@/types/workout"

const DEFAULTS: Omit<UserPreferences, "user_id" | "created_at" | "updated_at"> = {
  weight_unit: "lbs",
  show_dual_units: true,
  measurement_unit: "in",
  default_rest_seconds: 90,
  theme: "dark",
}

export function usePreferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: preferences } = useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code === "PGRST116") {
        // No row found — create defaults
        const { data: newData, error: insertError } = await supabase
          .from("user_preferences")
          .insert({ user_id: user.id })
          .select()
          .single()
        if (insertError) throw insertError
        return newData as unknown as UserPreferences
      }
      if (error) throw error
      return data as unknown as UserPreferences
    },
    enabled: !!user,
    staleTime: Infinity,
  })

  const updatePreferences = useMutation({
    mutationFn: async (
      updates: Partial<Omit<UserPreferences, "user_id" | "created_at" | "updated_at">>
    ) => {
      if (!user) throw new Error("Not authenticated")
      const { error } = await supabase
        .from("user_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
      if (error) throw error
    },
    onMutate: async (updates) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["user-preferences"] })
      const prev = queryClient.getQueryData<UserPreferences>(["user-preferences", user?.id])
      if (prev) {
        queryClient.setQueryData(["user-preferences", user?.id], {
          ...prev,
          ...updates,
        })
      }
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["user-preferences", user?.id], context.prev)
      }
    },
  })

  // Merge with defaults for any missing fields
  const merged = preferences
    ? { ...DEFAULTS, ...preferences }
    : DEFAULTS

  return {
    preferences: merged as UserPreferences,
    updatePreferences,
    isLoaded: !!preferences,
  }
}
