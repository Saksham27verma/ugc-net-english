import "server-only"
import { buildStreak, dayKey, type FreezeInfo, type StreakData } from "@/lib/streak"
import type { Result } from "@/lib/types"
import { listAttemptResults } from "./papers"
import { syncFreezes } from "./freezes"

export type Progress = {
  history: Result[]
  streak: StreakData
  freeze: FreezeInfo
}

export async function loadProgress(now = Date.now()): Promise<Progress> {
  const history = await listAttemptResults()
  const practised = new Set(history.map((item) => dayKey(item.submittedAt)))
  const freeze = await syncFreezes(practised, dayKey(now))
  const streak = buildStreak(
    history.map((item) => ({
      submittedAt: item.submittedAt,
      accuracy: item.accuracy,
      attempted: item.attempted,
      total: item.total,
    })),
    now,
    { frozenDays: freeze.frozenDays },
  )
  return {
    history,
    streak,
    freeze: { available: freeze.available, usedOn: freeze.usedOn },
  }
}
