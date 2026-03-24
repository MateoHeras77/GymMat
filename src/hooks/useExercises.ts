import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Exercise } from "@/types/exercise"
import { useMemo } from "react"

interface UseExercisesOptions {
  search?: string
  bodyPart?: string
  equipment?: string
  target?: string
}

export function useExercises(options: UseExercisesOptions = {}) {
  const { search, bodyPart, equipment, target } = options

  const { data: allExercises = [], isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name")

      if (error) throw error
      return data as Exercise[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const bodyParts = useMemo(
    () => [...new Set(allExercises.map((e) => e.body_part))].sort(),
    [allExercises]
  )

  const equipmentList = useMemo(
    () => [...new Set(allExercises.map((e) => e.equipment))].sort(),
    [allExercises]
  )

  const targets = useMemo(
    () => [...new Set(allExercises.map((e) => e.target))].sort(),
    [allExercises]
  )

  const exercises = useMemo(() => {
    let filtered = allExercises

    if (search) {
      const lower = search.toLowerCase()
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(lower))
    }
    if (bodyPart && bodyPart !== "all") {
      filtered = filtered.filter((e) => e.body_part === bodyPart)
    }
    if (equipment && equipment !== "all") {
      filtered = filtered.filter((e) => e.equipment === equipment)
    }
    if (target && target !== "all") {
      filtered = filtered.filter((e) => e.target === target)
    }

    return filtered
  }, [allExercises, search, bodyPart, equipment, target])

  return { exercises, allExercises, isLoading, bodyParts, equipmentList, targets }
}
