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
}

export type StreakWeek = {
  key: string
  monthLabel: string | null
  cells: StreakCell[]
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

function weekday(key: string): number {
  return new Date(keyToNoon(key)).getUTCDay()
}

function levelFor(count: number): HeatLevel {
  if (count <= 0) return 0
  if (count >= 4) return 4
  return count as 1 | 2 | 3
}

function currentStreakFrom(counts: Map<string, number>, todayKey: string): number {
  let cursor = counts.has(todayKey) ? todayKey : shift(todayKey, -1)
  let streak = 0
  while (counts.has(cursor)) {
    streak += 1
    cursor = shift(cursor, -1)
  }
  return streak
}

function longestStreakIn(counts: Map<string, number>): number {
  const keys = [...counts.keys()].sort()
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

export function buildStreak(submittedAt: number[], now: number): StreakData {
  const counts = new Map<string, number>()
  for (const ms of submittedAt) {
    const key = dayKey(ms)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

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
      cells.push({
        key: cursor,
        label: dayLabelFormatter.format(new Date(keyToNoon(cursor))),
        count,
        level: levelFor(count),
        future: cursor > todayKey,
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
    currentStreak: currentStreakFrom(counts, todayKey),
    longestStreak: longestStreakIn(counts),
    activeDays: counts.size,
    totalAttempts: submittedAt.length,
    daysThisWeek,
    weeklyGoal: WEEKLY_GOAL,
    todayCount: counts.get(todayKey) ?? 0,
  }
}
