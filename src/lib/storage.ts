import type { Attempt, AttemptResponse, Result } from "./types"

export const ACTIVE_KEY = "ugcnet:active"
export const HISTORY_KEY = "ugcnet:history"
export const VISITOR_KEY = "ugcnet:visitor"

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

export function writeHistory(history: Result[]): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function appendHistory(result: Result): void {
  const history = readHistory()
  const next = [result, ...history.filter((item) => item.attemptId !== result.attemptId)]
  writeHistory(next)
}

export function findResult(attemptId: string): Result | undefined {
  return readHistory().find((item) => item.attemptId === attemptId)
}

export function getVisitorId(): string {
  if (!canUseStorage()) return ""
  const existing = window.localStorage.getItem(VISITOR_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  window.localStorage.setItem(VISITOR_KEY, id)
  return id
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
