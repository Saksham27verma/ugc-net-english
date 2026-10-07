import "server-only"
import type { WeeklyRecap } from "@/lib/motivation"
import { buildStreak, dayKey, shiftDayKey, weekdayOf } from "@/lib/streak"
import { resultFacts } from "@/lib/exams"
import type { Result } from "@/lib/types"
import { ensureSchema, hasDatabase } from "./db"
import { LEARNER_ID } from "./learner"

/**
 * Recap the Sunday–Saturday week that just finished, on Sunday or the first
 * visit after. Marked seen once shown so it does not linger all week.
 */
export async function loadWeeklyRecap(
  history: Result[],
  now: number,
  frozenDays: string[],
): Promise<WeeklyRecap | null> {
  const todayKey = dayKey(now)
  const weekday = weekdayOf(todayKey)
  if (weekday === 6) return null

  const daysBackToSaturday = weekday === 0 ? 1 : weekday + 1
  const weekEnd = shiftDayKey(todayKey, -daysBackToSaturday)
  const weekStart = shiftDayKey(weekEnd, -6)
  const prevEnd = shiftDayKey(weekStart, -1)
  const prevStart = shiftDayKey(prevEnd, -6)

  if (!hasDatabase()) return null
  const sql = await ensureSchema()
  const seen = await sql`
    SELECT 1 FROM recap_seen
    WHERE learner_id = ${LEARNER_ID} AND week_key = ${weekEnd}
    LIMIT 1
  `
  if (seen.length > 0) return null

  const thisWeek = history.filter((item) => inRange(dayKey(item.submittedAt), weekStart, weekEnd))
  const lastWeek = history.filter((item) => inRange(dayKey(item.submittedAt), prevStart, prevEnd))
  if (thisWeek.length === 0 && lastWeek.length === 0) {
    await markSeen(weekEnd)
    return null
  }

  const units = aggregatePaper2(thisWeek)
  const weakest = units
    .filter((unit) => unit.attempted > 2)
    .slice()
    .sort((a, b) => a.accuracy - b.accuracy)[0]

  const attempted = thisWeek.reduce((sum, item) => sum + item.attempted, 0)
  const correct = thisWeek.reduce((sum, item) => sum + item.correct, 0)
  const nowStreak = buildStreak(history.map(toAttempt), now, { frozenDays }).currentStreak
  const thenStreak = buildStreak(history.map(toAttempt), Date.parse(`${weekEnd}T12:00:00+05:30`), {
    frozenDays,
  }).currentStreak

  await markSeen(weekEnd)

  return {
    weekKey: weekEnd,
    thisWeekDays: uniqueDays(thisWeek),
    lastWeekDays: uniqueDays(lastWeek),
    questions: attempted,
    accuracy: attempted === 0 ? 0 : (correct / attempted) * 100,
    units,
    weakest: weakest?.unit ?? null,
    streakNow: nowStreak,
    streakThen: thenStreak,
  }
}

async function markSeen(weekKey: string): Promise<void> {
  const sql = await ensureSchema()
  await sql`
    INSERT INTO recap_seen (learner_id, week_key)
    VALUES (${LEARNER_ID}, ${weekKey})
    ON CONFLICT (learner_id, week_key) DO NOTHING
  `
}

function inRange(key: string, start: string, end: string): boolean {
  return key >= start && key <= end
}

function uniqueDays(results: Result[]): number {
  return new Set(results.map((item) => dayKey(item.submittedAt))).size
}

function toAttempt(item: Result) {
  return {
    submittedAt: item.submittedAt,
    accuracy: item.accuracy,
    attempted: item.attempted,
    total: item.total,
    maxMarks: resultFacts(item).maxMarks,
  }
}

function aggregatePaper2(results: Result[]): WeeklyRecap["units"] {
  const map = new Map<string, { attempted: number; correct: number }>()
  for (const result of results) {
    for (const unit of result.byUnit) {
      if (unit.paper !== 2) continue
      const prev = map.get(unit.unit) ?? { attempted: 0, correct: 0 }
      map.set(unit.unit, {
        attempted: prev.attempted + unit.attempted,
        correct: prev.correct + unit.correct,
      })
    }
  }
  return [...map.entries()]
    .map(([unit, stats]) => ({
      unit,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted === 0 ? 0 : (stats.correct / stats.attempted) * 100,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
}
