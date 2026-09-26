import "server-only"
import type { ComebackInfo, WeeklyRecap } from "@/lib/motivation"
import { buildStreak, dayKey, type FreezeInfo, type StreakData } from "@/lib/streak"
import type { Result } from "@/lib/types"
import { syncComeback } from "./comebacks"
import { syncFreezes } from "./freezes"
import { listAttemptResults } from "./papers"
import { loadWeeklyRecap } from "./recap"

export type Progress = {
  history: Result[]
  streak: StreakData
  freeze: FreezeInfo
  comeback: ComebackInfo | null
  recap: WeeklyRecap | null
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
  let comeback: ComebackInfo | null = null
  try {
    comeback = await syncComeback(practised, new Set(freeze.frozenDays), streak)
  } catch {
    comeback = null
  }
  const latest = await syncFreezes(practised, dayKey(now))
  let recap: WeeklyRecap | null = null
  try {
    recap = await loadWeeklyRecap(history, now, latest.frozenDays)
  } catch {
    recap = null
  }
  return {
    history,
    streak,
    freeze: { available: latest.available, usedOn: latest.usedOn },
    comeback,
    recap,
  }
}
