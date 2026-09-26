import "server-only"
import { shiftDayKey, type StreakData } from "@/lib/streak"
import type { ComebackInfo } from "@/lib/motivation"
import { ensureSchema, hasDatabase } from "./db"
import { grantFreezeCredit } from "./freezes"
import { LEARNER_ID } from "./learner"

/**
 * After a streak breaks, three practised days in a row earn one extra freeze
 * and a one-time Welcome back card. This never touches the voucher ladder.
 */
export async function syncComeback(
  practised: Set<string>,
  frozen: Set<string>,
  streak: StreakData,
): Promise<ComebackInfo | null> {
  if (!hasDatabase()) return null
  const thirdDay = recoveryThirdDay(practised, frozen, streak.todayKey, streak.todayCount > 0)
  if (!thirdDay) return null

  const sql = await ensureSchema()
  const existing = await sql`
    SELECT day_key, granted_at, dismissed_at
    FROM comeback_awards
    WHERE learner_id = ${LEARNER_ID} AND day_key = ${thirdDay}
    LIMIT 1
  `
  if (existing.length === 0) {
    await sql`
      INSERT INTO comeback_awards (learner_id, day_key)
      VALUES (${LEARNER_ID}, ${thirdDay})
      ON CONFLICT (learner_id, day_key) DO NOTHING
    `
    await grantFreezeCredit(`comeback:${thirdDay}`)
  } else if (existing[0].dismissed_at) {
    return null
  }

  const row = existing[0]
  return {
    dayKey: thirdDay,
    grantedAt: row?.granted_at instanceof Date ? row.granted_at.getTime() : Date.now(),
  }
}

export async function dismissComeback(dayKey: string): Promise<void> {
  const sql = await ensureSchema()
  await sql`
    UPDATE comeback_awards
    SET dismissed_at = COALESCE(dismissed_at, now())
    WHERE learner_id = ${LEARNER_ID} AND day_key = ${dayKey}
  `
}

function recoveryThirdDay(
  practised: Set<string>,
  frozen: Set<string>,
  todayKey: string,
  todayDone: boolean,
): string | null {
  const end = todayDone ? todayKey : shiftDayKey(todayKey, -1)
  let cursor = end
  const run: string[] = []
  for (let i = 0; i < 400; i += 1) {
    if (practised.has(cursor)) {
      run.unshift(cursor)
      cursor = shiftDayKey(cursor, -1)
      continue
    }
    // A freeze in the middle of a comeback still counts as the run continuing,
    // but only practised days go toward the three-day requirement.
    if (frozen.has(cursor)) {
      cursor = shiftDayKey(cursor, -1)
      continue
    }
    break
  }
  if (run.length < 3) return null

  const dayBeforeRun = shiftDayKey(run[0], -1)
  // There must have been a real break: some earlier practice, then a miss.
  let sawMiss = false
  let sawEarlierPractice = false
  cursor = dayBeforeRun
  for (let i = 0; i < 400; i += 1) {
    if (practised.has(cursor)) {
      sawEarlierPractice = true
      break
    }
    if (frozen.has(cursor)) {
      cursor = shiftDayKey(cursor, -1)
      continue
    }
    sawMiss = true
    cursor = shiftDayKey(cursor, -1)
  }
  if (!sawMiss || !sawEarlierPractice) return null
  return run[2]
}
