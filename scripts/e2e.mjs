// End-to-end check of the core flow against a local production build and the
// REAL Supabase project, using a throwaway user that is deleted at the end.
//
// Covers: templates on an empty account → "Add all" → start a workout → log
// sets → finish → reload on the summary (iOS app-kill) → save while offline →
// auto-sync when back online → history refreshed.
//
// Usage:
//   npm run build && npx vite preview --port 5198 --strictPort   (other terminal)
//   npm run test:e2e
// Needs Google Chrome at /usr/bin/google-chrome and a logged-in Supabase CLI.
// Screenshots go to ./e2e-shots (git-ignored).
import { chromium, devices } from "playwright-core"
import { randomBytes } from "crypto"
import { execSync } from "child_process"
import { mkdirSync, readFileSync } from "fs"

const URL = "https://sptfltpjlsfleanjewul.supabase.co"
const APP = "http://localhost:5198"
const SR = JSON.parse(
  execSync("supabase projects api-keys --project-ref sptfltpjlsfleanjewul -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
).find((k) => k.name === "service_role").api_key
const ANON = readFileSync(".env", "utf8").match(/^VITE_SUPABASE_ANON_KEY=(.*)$/m)[1].replace(/"/g, "").trim()
const OUT = "e2e-shots"
mkdirSync(OUT, { recursive: true })
const admin = { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" }

const log = (...a) => console.log("•", ...a)
const email = `e2e-ui-${Date.now()}@gymmat.test`
const password = randomBytes(18).toString("base64url")

const user = await (await fetch(`${URL}/auth/v1/admin/users`, {
  method: "POST", headers: admin,
  body: JSON.stringify({ email, password, email_confirm: true }),
})).json()
log("temp user", user.id)

const rest = (path, jwt) =>
  fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: ANON, Authorization: `Bearer ${jwt}` } }).then((r) => r.json())

let browser
try {
  const session = await (await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })).json()

  browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true })
  const ctx = await browser.newContext({ ...devices["iPhone 13"], isMobile: true })
  await ctx.addInitScript(([k, v]) => {
    if (!localStorage.getItem(k)) localStorage.setItem(k, v)
  }, ["sb-sptfltpjlsfleanjewul-auth-token", JSON.stringify(session)])
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))

  // 1. Templates on an empty account
  await page.goto(`${APP}/routines`)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // now controlled by the SW with precached chunks
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  log("service worker controlling the page ✓")
  await page.getByText("Templates").waitFor()
  await page.getByText("No routines yet").waitFor()
  await page.getByText("Day 3 · Legs").click() // expand details
  await page.screenshot({ path: `${OUT}/1-templates-empty.png`, fullPage: true })
  log("templates visible on empty state ✓")

  await page.getByRole("button", { name: /Add all 5/ }).click()
  await page.getByText("Added 5 routines").waitFor({ timeout: 20000 })
  await page.getByText("Added", { exact: true }).first().waitFor()
  await page.screenshot({ path: `${OUT}/2-templates-added.png`, fullPage: true })

  const routines = await rest(`routines?select=name,template_type,routine_exercises(exercise_id,sort_order,target_sets,target_reps,rest_seconds)&is_archived=eq.false&order=created_at`, session.access_token)
  log("routines in DB:", routines.map((r) => `${r.name} (${r.routine_exercises.length})`).join(", "))
  if (routines.length !== 5) throw new Error("expected 5 routines")
  if ((await page.getByRole("button", { name: /Add all/ }).count()) !== 0)
    throw new Error("Add all should be gone once everything is added")

  // 2. Start Push, log two sets
  await page.getByText("Day 1 · Push", { exact: true }).first().click()
  await page.getByRole("button", { name: /Start Workout/ }).click()
  await page.waitForURL("**/workout")
  const weight = page.getByLabel("Set 1 weight in lbs")
  await weight.fill("135")
  const complete = page.getByTitle("Complete set")
  await complete.first().click()
  await complete.first().click()
  await page.screenshot({ path: `${OUT}/3-workout.png`, fullPage: true })
  log("2 sets completed ✓")

  // 3. Finish → reload on the summary (simulates iOS killing the app)
  await page.getByRole("button", { name: "Finish", exact: true }).click()
  await page.getByText("Workout Complete!").waitFor()
  await page.reload()
  await page.getByText("Workout Complete!").waitFor({ timeout: 10000 })
  log("summary survives reload ✓")

  // 4. Save while the network is down
  await ctx.setOffline(true)
  await page.getByRole("button", { name: "Save Workout" }).click()
  await page.getByText(/Saved on this device/).waitFor({ timeout: 20000 })
  await page.getByText(/1 workout waiting to sync/).waitFor()
  await page.screenshot({ path: `${OUT}/4-offline-queued.png`, fullPage: true })
  const queued = await page.evaluate(() => JSON.parse(localStorage.getItem("gymmat-pending-workouts") || "[]").length)
  log("offline save queued locally ✓ (queue:", queued, ")")

  // 5. Back online → auto sync
  await ctx.setOffline(false)
  await page.getByText(/pending workout synced/).waitFor({ timeout: 20000 })
  await page.getByText(/waiting to sync/).waitFor({ state: "detached", timeout: 10000 })
  await page.screenshot({ path: `${OUT}/5-synced.png`, fullPage: true })

  const sessions = await rest(`workout_sessions?select=name,routine_id,workout_sets(set_number,reps,weight,is_pr)`, session.access_token)
  log("sessions in DB:", JSON.stringify(sessions))
  if (sessions.length !== 1 || sessions[0].workout_sets.length !== 2) throw new Error("expected 1 session with 2 sets")
  if (!sessions[0].routine_id) throw new Error("routine link lost")

  // 6. History shows it without waiting for the 5-min stale time
  await page.goto(`${APP}/history`)
  await page.getByText("Day 1 · Push").first().waitFor({ timeout: 10000 })
  await page.screenshot({ path: `${OUT}/6-history.png`, fullPage: true })
  log("history shows the workout ✓")

  // 7. Second Push session: prefill from last time + progression hint (phase 3)
  await page.goto(`${APP}/routines`)
  await page.getByText("Day 1 · Push", { exact: true }).first().click()
  await page.getByRole("button", { name: /Start Workout/ }).click()
  await page.waitForURL("**/workout")
  const w1 = page.getByLabel("Set 1 weight in lbs")
  if ((await w1.inputValue()) !== "135") throw new Error(`prefill: expected 135, got ${await w1.inputValue()}`)
  log("weight prefilled from last session ✓")
  await page.getByText(/Try 140 lbs/).waitFor()
  await page.screenshot({ path: `${OUT}/7-suggestion.png`, fullPage: true })
  await page.getByRole("button", { name: "Apply" }).click()
  if ((await w1.inputValue()) !== "140") throw new Error("apply suggestion failed")
  log("progression hint applied ✓")

  // 8. Finishing every set of an exercise offers the next one
  const sets = await page.getByTitle("Complete set").count()
  for (let i = 0; i < sets; i++) await page.getByTitle("Complete set").first().click()
  await page.getByRole("button", { name: /Next: dumbbell incline bench press/i }).waitFor()
  await page.screenshot({ path: `${OUT}/8-next.png`, fullPage: true })
  log("next-exercise button ✓")

  // 9. kg preference: same stored lbs, shown in kg
  await fetch(`${URL}/rest/v1/user_preferences?user_id=eq.${user.id}`, {
    method: "PATCH",
    headers: { apikey: ANON, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ weight_unit: "kg" }),
  })
  await page.evaluate(() => sessionStorage.clear())
  await page.reload()
  await page.getByRole("button", { name: "1", exact: true }).click()
  const kg = await page.getByLabel("Set 2 weight in kg").inputValue()
  if (kg !== "63.5") throw new Error(`kg display: expected 63.5, got ${kg}`)
  await page.screenshot({ path: `${OUT}/9-kg.png`, fullPage: true })
  log("kg preference shows 140 lbs as 63.5 kg ✓")

  if (errors.length) log("page errors:", errors)
  log("ALL PASSED")
} catch (e) {
  const pages = browser?.contexts()[0]?.pages() ?? []
  if (pages[0]) await pages[0].screenshot({ path: `${OUT}/FAIL.png`, fullPage: true })
  throw e
} finally {
  await browser?.close()
  const del = await fetch(`${URL}/auth/v1/admin/users/${user.id}`, { method: "DELETE", headers: admin })
  log("temp user deleted:", del.status)
}
