# GymMat — Roadmap

Lista de trabajo activa. Se marca `[x]` al terminar **y verificar** cada punto.
Origen: auditoría del 2026-09-27 (4 agentes: integridad de datos, build/deploy, UX, catálogo).
Lecciones y decisiones técnicas → [`LESSONS.md`](./LESSONS.md).

Estado de producción al iniciar: Vercel en commit `fd96a1e` (~6 meses), ~30 cambios locales sin commit
(build/lint/tsc limpios). Supabase `ACTIVE_HEALTHY`. Edge Function `download-exercise-gif` desplegada y
con secrets configurados.

---

## Fase 1 — Guardado confiable y problemas encontrados

Objetivo: que un entrenamiento terminado **nunca** se pierda, aun con señal mala o si iOS cierra la app.

### Críticos (pérdida de datos)
- [x] **1.1** No borrar el entrenamiento activo hasta que el guardado se confirme. Hoy `finishWorkout()`
      limpia el store persistido y el resultado vive solo en `useState` (`activeWorkoutStore.ts`, `WorkoutPage.tsx`).
- [x] **1.2** Encolar para reintento ante **cualquier** fallo de guardado, no solo cuando `navigator.onLine === false`
      (`workoutService.ts`).
- [x] **1.3** Timeout en las llamadas a Supabase para que un guardado con señal débil no se quede colgado (`lib/supabase.ts`).

### Altos (duplicados / datos huérfanos)
- [x] **1.4** Guardado atómico e idempotente: sesión + series en una sola transacción (RPC en Postgres) con id de
      sesión generado en el cliente → reintentar nunca duplica ni deja sesiones vacías.
      ✅ RPC `save_workout` (migración `20260927000000`), verificada en la DB real con transacción revertida.
- [x] **1.5** Evitar que la cola offline se procese dos veces a la vez (arranque + evento `online`).

### Medios / bajos
- [x] **1.6** Unidad de peso consistente para PRs (hoy se guardan números sin unidad; cambiar kg⇄lb rompe PRs).
      ✅ Decisión: **lbs es la unidad canónica** en DB (comentario en columnas); kg será solo visual (Fase 3).
- [x] **1.7** Guardar `personal_records.workout_set_id` al detectar un PR.
- [x] **1.8** `useRoutineExercises` delete: añadir filtro defensivo como en el resto de hooks.

### Limpieza y seguridad
- [x] **1.9** Quitar `exercisedb.p.rapidapi.com` del CSP (`index.html`) — ya no se llama desde el cliente.
- [x] **1.10** `.gitignore`: añadir `supabase/.temp/`.
- [x] **1.11** Supabase: activar *leaked password protection*; revisar exposición de tablas en GraphQL.
      ✅ `pg_graphql` desactivado (la app no lo usa). Leaked-password: **no aplica** (solo login Google) y es feature Pro.
- [x] **1.12** `npm audit fix` (solo parches no-breaking).

### Verificación y deploy
- [x] **1.13** Añadir Vitest + tests del flujo de guardado (éxito, fallo online, offline, reintento sin duplicar).
- [ ] **1.14** Prueba manual en iPhone: terminar entreno en modo avión → reabrir app → se sincroniza.
      ⏳ Pendiente de Mateo (ver pasos en el chat del 2026-09-27).
- [x] **1.15** Commit + deploy a Vercel; probar descarga de GIF end-to-end en producción.
      ✅ `9700e7c` en producción. E2E con usuario temporal (luego borrado): RPC + reintento sin duplicar,
      PRs con `workout_set_id`, GIF `3666` descargado vía Edge Function en 1.8 s.
- [x] **1.16** Borrar `VITE_EXERCISEDB_API_KEY*` de las variables de Vercel (ya no se usan).

---

## Fase 2 — Plantillas de rutinas

Presets que cualquier usuario (tú + amigos) carga con un toque → se crea **su propia copia editable**.
Sin cambios de schema: datos estáticos en el cliente + mutations existentes (`createRoutine` + `addExercise`).

Equipo del gym: mancuernas, barra + banca, caminadoras, elípticas, remo, estación de poleas/cable crossover
(con cuerda para pushdown/curl). **Sin** máquinas de pierna (prensa, extensión, curl, abductor/aductor).

- [ ] **2.1** `src/data/routineTemplates.ts` con 5 plantillas (Push / Pull / Legs / Upper / Lower, 6-7 ejercicios).
- [ ] **2.2** Sección "Templates" en `RoutinesPage` (visible también en el estado vacío para amigos nuevos).
- [ ] **2.3** Acción "Use template" → crea rutina + ejercicios en la cuenta del usuario.
- [ ] **2.4** Test + verificación manual + deploy.

---

## Fase 3 — Mejoras de uso en el gym

- [ ] **3.1** Rellenar peso/reps con la última sesión real (hoy solo se muestra "Previous" como referencia).
- [ ] **3.2** Sugerencia de progresión ("+2.5 kg?") si se cumplieron todas las reps la vez anterior.
- [ ] **3.3** Respetar la preferencia kg/lb en `SetLogger` (hoy siempre muestra lb primero).
- [ ] **3.4** Botones/inputs de 44px mínimo e `inputMode="decimal"` en el registro de series.
- [ ] **3.5** Aviso de "siguiente ejercicio" al completar la última serie.
- [ ] **3.6** Test + verificación manual + deploy.

---

## Backlog (sin fecha)

- "Repeat last workout" desde el Dashboard.
- Compartir una rutina con un amigo (link/código).
- Reducir bundle principal (683 KB) y chunk de Progress (394 KB).
- Actualizar dependencias con versión mayor pendiente (`@base-ui/react`, `lucide-react`, `typescript`).
