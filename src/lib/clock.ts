import type { Attempt } from "./types"

export const DURATION_MS = 10_800_000

export function remainingMs(attempt: Attempt, now = Date.now()): number {
  return attempt.startedAt + attempt.durationMs - now
}

export function overtimeMs(attempt: Attempt, now = Date.now()): number {
  return Math.max(0, -remainingMs(attempt, now))
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":")
}

export function formatRemaining(ms: number): string {
  return formatClock(ms)
}

export function formatTimer(remaining: number): { display: string; label: string; overtime: boolean } {
  if (remaining >= 0) {
    return { display: formatClock(remaining), label: "Time remaining", overtime: false }
  }
  return { display: `+${formatClock(-remaining)}`, label: "Overtime", overtime: true }
}

export type TimerWarning = 30 | 10 | 5 | 1 | null

export function timerWarning(ms: number): TimerWarning {
  if (ms <= 0) return null
  if (ms <= 60_000) return 1
  if (ms <= 5 * 60_000) return 5
  if (ms <= 10 * 60_000) return 10
  if (ms <= 30 * 60_000) return 30
  return null
}

export function timerTone(ms: number): "normal" | "amber" | "red" {
  if (ms <= 0) return "red"
  if (ms <= 5 * 60_000) return "red"
  if (ms <= 10 * 60_000) return "amber"
  return "normal"
}
