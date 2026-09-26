import type { Attempt, AttemptResponse, Result } from "./types"

export const ACTIVE_KEY = "ugcnet:active"
export const HISTORY_KEY = "ugcnet:history"
export const HISTORY_SYNCED_KEY = "ugcnet:history-synced"

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function normalizeResponses(raw: Record<string, AttemptResponse> | undefined): Record<number, AttemptResponse> {
  const out: Record<number, AttemptResponse> = {}
  if (!raw) return out
  for (const [key, value] of Object.entries(raw)) {
    out[Number(key)] = value
  }
  return out
}

export function readActive(): Attempt | null {
  if (!canUseStorage()) return null
  const raw = window.localStorage.getItem(ACTIVE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Attempt
    if (!parsed?.id || parsed.submittedAt) return null
    parsed.responses = normalizeResponses(parsed.responses as unknown as Record<string, AttemptResponse>)
    return parsed
  } catch {
    return null
  }
}

export function writeActive(attempt: Attempt): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(attempt))
}

export function clearActive(): void {
  if (!canUseStorage()) return
  window.localStorage.removeItem(ACTIVE_KEY)
}

export function readHistory(): Result[] {
  if (!canUseStorage()) return []
  const raw = window.localStorage.getItem(HISTORY_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Result[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function shouldSyncLocalHistory(): boolean {
  if (!canUseStorage()) return false
  if (window.localStorage.getItem(HISTORY_SYNCED_KEY)) return false
  return readHistory().length > 0
}

export function markHistorySynced(): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(HISTORY_SYNCED_KEY, "1")
  window.localStorage.removeItem(HISTORY_KEY)
}

export function createAttempt(setId: number, durationMs: number): Attempt {
  return {
    id: crypto.randomUUID(),
    setId,
    startedAt: Date.now(),
    durationMs,
    responses: {},
    submittedAt: null,
  }
}
