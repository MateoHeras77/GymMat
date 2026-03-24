/**
 * Offline mutation queue.
 * Stores failed Supabase mutations in localStorage and retries them when online.
 */

import { supabase } from "./supabase"

interface QueuedMutation {
  id: string
  table: string
  type: "insert" | "update" | "delete" | "upsert"
  data?: Record<string, unknown>
  match?: Record<string, unknown>
  createdAt: string
}

const STORAGE_KEY = "gymmat-offline-queue"

function getQueue(): QueuedMutation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedMutation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function enqueue(mutation: Omit<QueuedMutation, "id" | "createdAt">) {
  const queue = getQueue()
  queue.push({
    ...mutation,
    id: Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString(),
  })
  saveQueue(queue)
}

export function getQueueLength(): number {
  return getQueue().length
}

async function processMutation(m: QueuedMutation): Promise<boolean> {
  try {
    let query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from(m.table) as any
    switch (m.type) {
      case "insert":
        query = table.insert(m.data!)
        break
      case "update":
        query = table.update(m.data!)
        if (m.match) {
          for (const [key, value] of Object.entries(m.match)) {
            query = query.eq(key, value as string)
          }
        }
        break
      case "upsert":
        query = table.upsert(m.data!)
        break
      case "delete":
        query = supabase.from(m.table).delete()
        if (m.match) {
          for (const [key, value] of Object.entries(m.match)) {
            query = query.eq(key, value as string)
          }
        }
        break
    }

    const { error } = await query
    if (error) {
      console.error("[OfflineQueue] Failed to process mutation:", error)
      return false
    }
    return true
  } catch {
    return false
  }
}

export async function processQueue() {
  const queue = getQueue()
  if (queue.length === 0) return

  console.log(`[OfflineQueue] Processing ${queue.length} queued mutations`)

  const remaining: QueuedMutation[] = []
  for (const mutation of queue) {
    const success = await processMutation(mutation)
    if (!success) {
      remaining.push(mutation)
    }
  }

  saveQueue(remaining)

  if (remaining.length > 0) {
    console.log(`[OfflineQueue] ${remaining.length} mutations still pending`)
  } else {
    console.log("[OfflineQueue] All mutations processed")
  }
}

// Auto-process when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processQueue()
  })
}
