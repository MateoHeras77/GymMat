// Edge Function: download-exercise-gif
//
// Proxies the ExerciseDB (RapidAPI) GIF download server-side so the RapidAPI
// key never ships in the client bundle. The caller must be an authenticated
// user; the function fetches the GIF, stores it in the `exercise-gifs` bucket,
// updates the exercise row, and returns the public URL.
//
// Required secrets (supabase secrets set ...):
//   EXERCISEDB_API_KEY       (primary RapidAPI key)
//   EXERCISEDB_API_KEY_2     (optional fallback key)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by the platform.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Missing authorization" }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // Validate the caller is an authenticated user.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: "Unauthorized" }, 401)

    const { exerciseId } = await req.json().catch(() => ({}))
    if (!exerciseId || typeof exerciseId !== "string") {
      return json({ error: "Missing exerciseId" }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Already downloaded? Return the cached URL.
    const { data: existing } = await admin
      .from("exercises")
      .select("gif_url_180")
      .eq("id", exerciseId)
      .single()
    if (existing?.gif_url_180) return json({ url: existing.gif_url_180 }, 200)

    // Fetch the GIF from RapidAPI, trying the primary key then the fallback.
    const keys = [
      Deno.env.get("EXERCISEDB_API_KEY"),
      Deno.env.get("EXERCISEDB_API_KEY_2"),
    ].filter((k): k is string => Boolean(k))
    if (keys.length === 0) return json({ error: "Server not configured" }, 500)

    let blob: Blob | null = null
    for (const key of keys) {
      const resp = await fetch(
        `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(
          exerciseId
        )}&resolution=180`,
        {
          headers: {
            "X-RapidAPI-Key": key,
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
          },
        }
      )
      if (resp.ok) {
        blob = await resp.blob()
        break
      }
    }
    if (!blob) return json({ error: "Failed to fetch GIF" }, 502)

    const filePath = `${exerciseId}.gif`
    const { error: uploadError } = await admin.storage
      .from("exercise-gifs")
      .upload(filePath, blob, { contentType: "image/gif", upsert: true })
    if (uploadError) return json({ error: uploadError.message }, 500)

    const {
      data: { publicUrl },
    } = admin.storage.from("exercise-gifs").getPublicUrl(filePath)

    await admin
      .from("exercises")
      .update({ gif_url_180: publicUrl })
      .eq("id", exerciseId)

    return json({ url: publicUrl }, 200)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
