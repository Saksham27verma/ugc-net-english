export const TIME_ZONE = "Asia/Kolkata"
export const LEARNER_NAME = "Tanya"
export const WEEKS = 12
export const WEEKLY_GOAL = 5

const DAY_MS = 86_400_000

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const dayLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
})

const monthLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  month: "short",
})

const dayDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
})

export type HeatLevel = 0 | 1 | 2 | 3 | 4

export type StreakCell = {
  key: string
  label: string
  count: number
  level: HeatLevel
  future: boolean
  frozen: boolean
  questions: number
  accuracy: number | null
  score: number | null
}

export type StreakWeek = {
  key: string
  monthLabel: string | null
  cells: StreakCell[]
}

export type StreakAttempt = {
  submittedAt: number
  accuracy?: number
  attempted?: number
  total?: number
}

export type StreakOptions = {
  frozenDays?: Iterable<string>
}

export type FreezeInfo = {
  available: number
  usedOn: string | null
}

export type StreakData = {
  learnerName: string
  todayKey: string
  weeks: StreakWeek[]
  currentStreak: number
  longestStreak: number
  activeDays: number
  totalAttempts: number
  daysThisWeek: number
  weeklyGoal: number
  todayCount: number
}

/** Buckets a timestamp into the calendar day it belongs to in TIME_ZONE. */
export function dayKey(ms: number): string {
  return dayKeyFormatter.format(new Date(ms))
}

/**
 * Day keys are anchored at UTC noon so stepping by DAY_MS can never land on the
 * previous or next day, whatever the offset of the zone the key came from.
 */
function keyToNoon(key: string): number {
  const [year, month, day] = key.split("-").map(Number)
  return Date.UTC(year, month - 1, day, 12)
}

function noonToKey(ms: number): string {
  const date = new Date(ms)
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${date.getUTCDate()}`.padStart(2, "0")
  return `${date.getUTCFullYear()}-${month}-${day}`
}

export function shiftDayKey(key: string, days: number): string {
  return noonToKey(keyToNoon(key) + days * DAY_MS)
}

const shift = shiftDayKey

/** "14 Oct 2026" — same string on the server and the client. */
export function formatDayKey(key: string): string {
  return dayDateFormatter.format(new Date(keyToNoon(key)))
}

/** "14 Oct" — the short form used on the heatmap. */
export function formatDayKeyShort(key: string): string {
  return dayLabelFormatter.format(new Date(keyToNoon(key)))
}

export function weekdayOf(key: string): number {
  return new Date(keyToNoon(key)).getUTCDay()
}

/** YYYY-MM in the learner's calendar. */
export function monthKeyOf(key: string): string {
  return key.slice(0, 7)
}

function weekday(key: string): number {
  return weekdayOf(key)
}

function levelFor(count: number): HeatLevel {
  if (count <= 0) return 0
  if (count >= 4) return 4
  return count as 1 | 2 | 3
}

/** Four shades from that day's best accuracy, or from questions if unscored. */
function levelForDay(accuracy: number | null, questions: number, count: number): HeatLevel {
  if (count <= 0) return 0
  if (accuracy !== null) {
    if (accuracy >= 80) return 4
    if (accuracy >= 60) return 3
    if (accuracy >= 40) return 2
    return 1
  }
  if (questions > 0) return levelFor(Math.ceil(questions / 40))
  return levelFor(count)
}

function isActive(key: string, practised: Set<string>, frozen: Set<string>): boolean {
  return practised.has(key) || frozen.has(key)
}

function currentStreakFrom(practised: Set<string>, frozen: Set<string>, todayKey: string): number {
  let cursor = practised.has(todayKey) ? todayKey : shift(todayKey, -1)
  let streak = 0
  while (isActive(cursor, practised, frozen)) {
    streak += 1
    cursor = shift(cursor, -1)
  }
  return streak
}

function longestStreakIn(practised: Set<string>, frozen: Set<string>): number {
  const keys = [...new Set([...practised, ...frozen])].sort()
  let longest = 0
  let run = 0
  let previous: string | null = null
  for (const key of keys) {
    run = previous !== null && shift(previous, 1) === key ? run + 1 : 1
    if (run > longest) longest = run
    previous = key
  }
  return longest
}

function asAttempts(input: number[] | StreakAttempt[]): StreakAttempt[] {
  return input.map((item) => (typeof item === "number" ? { submittedAt: item } : item))
}

export function buildStreak(
  submittedAt: number[] | StreakAttempt[],
  now: number,
  options: StreakOptions = {},
): StreakData {
  const attempts = asAttempts(submittedAt)
  const counts = new Map<string, number>()
  const questions = new Map<string, number>()
  const bestAccuracy = new Map<string, number>()
  const bestScore = new Map<string, number>()
  for (const attempt of attempts) {
    const key = dayKey(attempt.submittedAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    questions.set(key, (questions.get(key) ?? 0) + (attempt.attempted ?? 0))
    if (attempt.accuracy !== undefined) {
      bestAccuracy.set(key, Math.max(bestAccuracy.get(key) ?? 0, attempt.accuracy))
    }
    if (attempt.total !== undefined) {
      bestScore.set(key, Math.max(bestScore.get(key) ?? 0, attempt.total))
    }
  }

  const practised = new Set(counts.keys())
  const frozen = new Set(options.frozenDays ?? [])
  const todayKey = dayKey(now)
  // The grid ends on the Saturday of the current week so today always sits in
  // the last column, like the GitHub graph.
  const lastKey = shift(todayKey, 6 - weekday(todayKey))
  const firstKey = shift(lastKey, -(WEEKS * 7 - 1))

  const weeks: StreakWeek[] = []
  let previousMonth: number | null = null
  let cursor = firstKey

  for (let week = 0; week < WEEKS; week += 1) {
    const cells: StreakCell[] = []
    const weekKey = cursor
    for (let day = 0; day < 7; day += 1) {
      const count = counts.get(cursor) ?? 0
      const frozenDay = frozen.has(cursor) && count === 0
      cells.push({
        key: cursor,
        label: dayLabelFormatter.format(new Date(keyToNoon(cursor))),
        count,
        level: levelForDay(bestAccuracy.get(cursor) ?? null, questions.get(cursor) ?? 0, count),
        future: cursor > todayKey,
        frozen: frozenDay,
        questions: questions.get(cursor) ?? 0,
        accuracy: bestAccuracy.get(cursor) ?? null,
        score: bestScore.get(cursor) ?? null,
      })
      cursor = shift(cursor, 1)
    }
    const month = new Date(keyToNoon(weekKey)).getUTCMonth()
    const monthLabel =
      previousMonth === null || month !== previousMonth
        ? monthLabelFormatter.format(new Date(keyToNoon(weekKey)))
        : null
    previousMonth = month
    weeks.push({ key: weekKey, monthLabel, cells })
  }

  const thisWeek = weeks[weeks.length - 1]
  const daysThisWeek = thisWeek.cells.filter((cell) => !cell.future && cell.count > 0).length

  return {
    learnerName: LEARNER_NAME,
    todayKey,
    weeks,
    currentStreak: currentStreakFrom(practised, frozen, todayKey),
    longestStreak: longestStreakIn(practised, frozen),
    activeDays: practised.size,
    totalAttempts: attempts.length,
    daysThisWeek,
    weeklyGoal: WEEKLY_GOAL,
    todayCount: counts.get(todayKey) ?? 0,
  }
}
