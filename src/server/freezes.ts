import "server-only"
import { monthKeyOf, shiftDayKey, type FreezeInfo } from "@/lib/streak"
import { ensureSchema, hasDatabase } from "./db"
import { LEARNER_ID } from "./learner"

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

  // Today is still open. Only yesterday can newly become a miss, and only when
  // the day before it was a live streak (practised or already frozen).
  const yesterday = shiftDayKey(todayKey, -1)
  const beforeYesterday = shiftDayKey(yesterday, -1)
  const yesterdayMissed = !practised.has(yesterday) && !frozen.has(yesterday)
  const streakToSave = practised.has(beforeYesterday) || frozen.has(beforeYesterday)
  if (yesterdayMissed && streakToSave) {
    const month = monthKeyOf(yesterday)
    const monthlyOpen = !monthsUsed.has(month)
    const credit = unusedCredits[0]
    if (monthlyOpen || credit) {
      const source = monthlyOpen ? "monthly" : "credit"
      await sql`
        INSERT INTO freeze_uses (learner_id, day_key, month, source)
        VALUES (${LEARNER_ID}, ${yesterday}, ${month}, ${source})
        ON CONFLICT (learner_id, day_key) DO NOTHING
      `
      if (source === "credit" && credit) {
        await sql`
          UPDATE freeze_credits
          SET consumed_day_key = ${yesterday}
          WHERE id = ${credit.id}::uuid AND consumed_day_key IS NULL
        `
      }
      frozen.add(yesterday)
      monthsUsed.add(month)
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

