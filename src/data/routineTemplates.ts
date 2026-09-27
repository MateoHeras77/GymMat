/**
 * Built-in routine templates. Using one clones it into the user's own
 * `routines` + `routine_exercises` rows, which they can then edit freely.
 *
 * Designed for a small gym: dumbbells, barbell + bench, cable station
 * (crossover, rope), treadmill/elliptical/rower. No leg machines, so legs are
 * barbell / dumbbell / bodyweight only.
 *
 * `exerciseId` values are ExerciseDB ids from the global `exercises` table.
 */

export interface TemplateExercise {
  exerciseId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
}

export interface RoutineTemplate {
  key: string
  name: string
  day: number
  focus: string
  description: string
  estimatedMinutes: number
  exercises: TemplateExercise[]
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    key: "ppl-ul-push",
    name: "Day 1 · Push",
    day: 1,
    focus: "Chest, shoulders, triceps",
    description: "Heavy press first, then shoulders and triceps.",
    estimatedMinutes: 60,
    exercises: [
      { exerciseId: "0025", name: "barbell bench press", sets: 4, reps: "6-8", restSeconds: 150 },
      { exerciseId: "0314", name: "dumbbell incline bench press", sets: 3, reps: "8-10", restSeconds: 120 },
      { exerciseId: "0405", name: "dumbbell seated shoulder press", sets: 3, reps: "8-10", restSeconds: 120 },
      { exerciseId: "0334", name: "dumbbell lateral raise", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseId: "0227", name: "cable standing fly", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseId: "0201", name: "cable pushdown", sets: 3, reps: "10-12", restSeconds: 60 },
    ],
  },
  {
    key: "ppl-ul-pull",
    name: "Day 2 · Pull",
    day: 2,
    focus: "Back, rear delts, biceps",
    description: "Vertical and horizontal pulls, then rear delts and arms.",
    estimatedMinutes: 55,
    exercises: [
      { exerciseId: "0198", name: "cable pulldown", sets: 4, reps: "8-10", restSeconds: 120 },
      { exerciseId: "0027", name: "barbell bent over row", sets: 4, reps: "8", restSeconds: 120 },
      { exerciseId: "0861", name: "cable seated row", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseId: "0383", name: "dumbbell reverse fly", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseId: "0031", name: "barbell curl", sets: 3, reps: "10", restSeconds: 60 },
      { exerciseId: "0313", name: "dumbbell hammer curl", sets: 3, reps: "12", restSeconds: 60 },
    ],
  },
  {
    key: "ppl-ul-legs",
    name: "Day 3 · Legs",
    day: 3,
    focus: "Quads, hamstrings, glutes, calves",
    description: "No machines needed: barbell squat and RDL, dumbbell single-leg work.",
    estimatedMinutes: 60,
    exercises: [
      { exerciseId: "0043", name: "barbell full squat", sets: 4, reps: "6-8", restSeconds: 180 },
      { exerciseId: "0085", name: "barbell romanian deadlift", sets: 3, reps: "8-10", restSeconds: 150 },
      { exerciseId: "0336", name: "dumbbell lunge", sets: 3, reps: "10", restSeconds: 90 },
      { exerciseId: "0431", name: "dumbbell step-up", sets: 3, reps: "10", restSeconds: 90 },
      { exerciseId: "0417", name: "dumbbell standing calf raise", sets: 4, reps: "12-15", restSeconds: 60 },
      { exerciseId: "0472", name: "hanging leg raise", sets: 3, reps: "10-12", restSeconds: 60 },
    ],
  },
  {
    key: "ppl-ul-upper",
    name: "Day 4 · Upper",
    day: 4,
    focus: "Full upper body, dumbbell focus",
    description: "Lighter than Push/Pull, more volume with dumbbells.",
    estimatedMinutes: 60,
    exercises: [
      { exerciseId: "0289", name: "dumbbell bench press", sets: 3, reps: "8-10", restSeconds: 120 },
      { exerciseId: "0293", name: "dumbbell bent over row", sets: 3, reps: "8-10", restSeconds: 120 },
      { exerciseId: "0426", name: "dumbbell standing overhead press", sets: 3, reps: "8-10", restSeconds: 120 },
      { exerciseId: "0198", name: "cable pulldown", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseId: "0308", name: "dumbbell fly", sets: 3, reps: "12", restSeconds: 60 },
      { exerciseId: "0868", name: "cable curl", sets: 2, reps: "12", restSeconds: 60 },
      { exerciseId: "0814", name: "triceps dip", sets: 2, reps: "8-12", restSeconds: 60 },
    ],
  },
  {
    key: "ppl-ul-lower",
    name: "Day 5 · Lower",
    day: 5,
    focus: "Posterior chain, glutes, core",
    description: "Deadlift day. Finish with 10-15 min incline walk on the treadmill.",
    estimatedMinutes: 60,
    exercises: [
      { exerciseId: "0032", name: "barbell deadlift", sets: 3, reps: "5", restSeconds: 180 },
      { exerciseId: "1760", name: "dumbbell goblet squat", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseId: "2368", name: "split squats", sets: 3, reps: "10", restSeconds: 90 },
      { exerciseId: "3013", name: "low glute bridge on floor", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseId: "1379", name: "dumbbell seated calf raise", sets: 3, reps: "15", restSeconds: 60 },
      { exerciseId: "0687", name: "russian twist", sets: 3, reps: "20", restSeconds: 45 },
    ],
  },
]
