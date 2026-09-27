# GymMat — Lecciones y decisiones

Bitácora de cosas no obvias aprendidas trabajando en el proyecto. Añadir al final, con fecha.
Formato: **qué pasó → por qué importa → qué hacer**.

---

### 2026-09-27 · Supabase free tier se pausa por inactividad
El proyecto estuvo pausado tras meses sin uso; al reanudar hubo ~2 min de 502/521 en auth y REST
(incluido un login con Google fallido). → Si la app pasa ~1 semana sin uso, la primera carga falla hasta
que Supabase reanuda (~30 s). Antes de diagnosticar "la app no funciona", revisar el estado del proyecto
(`supabase projects list` o MCP `get_project`).

### 2026-09-27 · La key de RapidAPI vive en Supabase, no en el cliente
La descarga de GIFs pasa por la Edge Function `download-exercise-gif`, que lee los secrets
`EXERCISEDB_API_KEY` (principal) y `EXERCISEDB_API_KEY_2` (respaldo, otra cuenta free).
Cada key: 690 requests/mes. → Hacer commit/push a Vercel **no** despliega Edge Functions:
`supabase functions deploy <nombre> --project-ref sptfltpjlsfleanjewul`.
Las `VITE_EXERCISEDB_API_KEY*` del `.env` local solo sirven para `scripts/`.

### 2026-09-27 · `navigator.onLine` no significa "hay internet"
En un gym es típico tener WiFi/LTE débil: `navigator.onLine === true` pero las requests fallan o se cuelgan.
→ Nunca decidir si encolar un guardado según `navigator.onLine`; encolar ante cualquier error de red.

### 2026-09-27 · Solo los GET pasan por el cache del service worker
La regla `NetworkFirst` (timeout 5 s) de Workbox aplica a lecturas. Los POST/inserts van directo a la red
sin timeout. → Los timeouts de escritura hay que ponerlos en el cliente de Supabase.

### 2026-09-27 · Presets sin cambios de schema
`routines.user_id` es NOT NULL y la RLS es `auth.uid() = user_id`: no existen rutinas "globales".
→ Las plantillas se guardan como datos estáticos en el cliente y se clonan a la cuenta del usuario.

### 2026-09-27 · Datos de producción
16 usuarios registrados (6 con rutinas). `MOCK_SEED_2026` ya no tiene filas (datos mock limpiados).
Catálogo: 1,325 ejercicios globales (tabla `exercises`, solo lectura, id = id de ExerciseDB).

### 2026-09-27 · Guardado de entrenamientos: cola primero, red después
Antes: `finishWorkout()` borraba el store persistido y el resultado vivía solo en `useState`; si iOS
mataba la app en la pantalla de resumen, el entreno se perdía. Ahora:
1. `finishWorkout()` mueve el entreno a `pendingResult` (persistido) en una sola escritura.
2. "Save" lo escribe en la cola `gymmat-pending-workouts` **antes** de cualquier request.
3. Se sincroniza vía RPC `save_workout` (sesión + series + PRs en una transacción, idempotente por
   `sessionId` generado en el cliente). Solo sale de la cola cuando el servidor confirma.
4. Reintentos: al abrir la app, al volver `online`, al volver a primer plano, y botón "Retry" en el banner.
   Las sincronizaciones se serializan (cadena de promesas + Web Locks) → nunca dos a la vez.
→ Cualquier cambio futuro al guardado debe mantener: *escribir local antes que red* e *idempotencia*.
Tests: `npm test` (`src/services/workoutService.test.ts`, `src/stores/activeWorkoutStore.test.ts`).

### 2026-09-27 · Vitest en Node 25 necesita un localStorage propio
Node 25 expone un `localStorage` global experimental que tapa el de jsdom y lanza
`localStorage.clear is not a function`. → `src/test/setup.ts` instala un Storage en memoria.

### 2026-09-27 · El historial no se refrescaba tras guardar
Con `staleTime` de 5 min, el Dashboard mostraba datos viejos después de guardar un entreno.
→ `queryClient` ahora vive en `src/lib/queryClient.ts` para que el servicio de guardado invalide
historial, PRs y "previous sets" tras sincronizar.

### 2026-09-27 · E2E real: build de producción + usuario temporal
`npm run test:e2e` (`scripts/e2e.mjs`) maneja Chrome headless (iPhone 13) contra `vite preview` y la DB
real, con un usuario creado vía admin API y **borrado al final** (cascade limpia sus datos).
→ Probar offline contra `npm run dev` da falsos fallos: sin service worker, las páginas lazy no cargan
sin red. Usar siempre el build de producción (`vite preview`), esperar a que el SW controle la página.
→ Login de la app es solo Google: para E2E se inyecta la sesión en `localStorage`
(`sb-sptfltpjlsfleanjewul-auth-token`).

### 2026-09-27 · Toasts y banners en móvil
Con la barra inferior + botón central elevado (`-top-3`), todo lo `fixed bottom-16` queda tapado.
→ Toasts en `top-center` (con safe-area) y banners en `bottom-[4.75rem]`.
