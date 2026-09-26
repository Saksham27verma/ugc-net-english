import "server-only"
import { monthKeyOf, shiftDayKey, type FreezeInfo } from "@/lib/streak"
import { ensureSchema, hasDatabase } from "./db"
import { LEARNER_ID } from "./learner"

const LOOKBACK_DAYS = 400

export type FreezeState = FreezeInfo & {
  frozenDays: string[]
}

/**
 * One monthly freeze, plus any unused comeback credits. A freeze is spent on
 * the first missed day that would otherwise break a live streak. Already-used
 * rows are never deleted, so a later miss in the same month is a real break.
 */
export async function syncFreezes(practised: Set<string>, todayKey: string): Promise<FreezeState> {
  if (!hasDatabase()) {
    return { frozenDays: [], available: 1, usedOn: null }
  }
  const sql = await ensureSchema()

  const existing = await sql`
    SELECT day_key, month, source
    FROM freeze_uses
    WHERE learner_id = ${LEARNER_ID}
  `
  const frozen = new Set(existing.map((row) => String(row.day_key)))
  const monthsUsed = new Set(existing.map((row) => String(row.month)))

  const unusedCredits = await sql`
    SELECT id
    FROM freeze_credits
    WHERE learner_id = ${LEARNER_ID} AND consumed_day_key IS NULL
    ORDER BY granted_at
  `

  // Today is still open, so a missing attempt today is not a miss yet.
  const yesterday = shiftDayKey(todayKey, -1)
  const lastActive = lastActiveOnOrBefore(practised, frozen, yesterday)
  if (lastActive && lastActive < yesterday) {
    const firstMiss = shiftDayKey(lastActive, 1)
    if (!practised.has(firstMiss) && !frozen.has(firstMiss)) {
      const month = monthKeyOf(firstMiss)
      const monthlyOpen = !monthsUsed.has(month)
      const credit = unusedCredits[0]
      if (monthlyOpen || credit) {
        const source = monthlyOpen ? "monthly" : "credit"
        await sql`
          INSERT INTO freeze_uses (learner_id, day_key, month, source)
          VALUES (${LEARNER_ID}, ${firstMiss}, ${month}, ${source})
          ON CONFLICT (learner_id, day_key) DO NOTHING
        `
        if (source === "credit" && credit) {
          await sql`
            UPDATE freeze_credits
            SET consumed_day_key = ${firstMiss}
            WHERE id = ${credit.id}::uuid AND consumed_day_key IS NULL
          `
        }
        frozen.add(firstMiss)
        monthsUsed.add(month)
      }
    }
  }

  const remainingCredits = await sql`
    SELECT count(*)::int AS n
    FROM freeze_credits
    WHERE learner_id = ${LEARNER_ID} AND consumed_day_key IS NULL
  `
  const thisMonth = monthKeyOf(todayKey)
  const usedThisMonth = [...frozen].filter((key) => monthKeyOf(key) === thisMonth).sort()
  const monthlyLeft = monthsUsed.has(thisMonth) ? 0 : 1

  return {
    frozenDays: [...frozen].sort(),
    available: monthlyLeft + Number(remainingCredits[0]?.n ?? 0),
    usedOn: usedThisMonth[0] ?? null,
  }
}

export async function grantFreezeCredit(reason: string): Promise<void> {
  const sql = await ensureSchema()
  await sql`
    INSERT INTO freeze_credits (learner_id, reason)
    VALUES (${LEARNER_ID}, ${reason})
  `
}

function lastActiveOnOrBefore(
  practised: Set<string>,
  frozen: Set<string>,
  start: string,
): string | null {
  let cursor = start
  for (let i = 0; i < LOOKBACK_DAYS; i += 1) {
    if (practised.has(cursor) || frozen.has(cursor)) return cursor
    cursor = shiftDayKey(cursor, -1)
  }
  return null
}
