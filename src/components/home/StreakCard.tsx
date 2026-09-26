import {
  formatDayKeyShort,
  type FreezeInfo,
  type HeatLevel,
  type StreakCell,
  type StreakData,
} from "@/lib/streak"
import type { LadderItem } from "@/lib/vouchers"

const HEAT_CLASS: Record<HeatLevel, string> = {
  0: "bg-[var(--heat-0)]",
  1: "bg-[var(--heat-1)]",
  2: "bg-[var(--heat-2)]",
  3: "bg-[var(--heat-3)]",
  4: "bg-[var(--heat-4)]",
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]

export function StreakCard({
  streak,
  freeze,
  nextVoucher,
}: {
  streak: StreakData
  freeze?: FreezeInfo
  nextVoucher?: LadderItem | null
}) {
  const {
    learnerName,
    weeks,
    currentStreak,
    longestStreak,
    activeDays,
    totalAttempts,
    daysThisWeek,
    weeklyGoal,
    todayCount,
    todayKey,
  } = streak

  const goalPercent = Math.min(100, Math.round((daysThisWeek / weeklyGoal) * 100))

  const headline =
    currentStreak === 0
      ? `Start a streak today, ${learnerName}`
      : `${currentStreak}-day streak, ${learnerName}`

  const message =
    currentStreak === 0
      ? totalAttempts === 0
        ? "One paper is all it takes to light up the first square."
        : "The grid is waiting — one paper brings the streak back."
      : todayCount > 0
        ? "Today is done. Come back tomorrow to keep it alive."
        : "One paper today and the streak carries on."

  return (
    <section
      aria-labelledby="streak-heading"
      className="rounded-2xl border border-line bg-gradient-to-br from-surface to-[var(--heat-0)] p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Regularity</p>
          <h2 id="streak-heading" className="mt-1 flex items-center gap-2 font-serif text-2xl font-semibold">
            <HeartIcon />
            {headline}
          </h2>
          <p className="mt-1 text-sm text-muted">{message}</p>
          {nextVoucher ? (
            <p className="mt-1 text-sm font-medium text-accent">
              Next voucher in {nextVoucher.unlocksInDays}{" "}
              {nextVoucher.unlocksInDays === 1 ? "day" : "days"}
            </p>
          ) : null}
          {freeze ? <FreezeLine freeze={freeze} /> : null}
        </div>
        <dl className="flex gap-6 text-sm">
          <Stat label="Current" value={`${currentStreak}d`} />
          <Stat label="Longest" value={`${longestStreak}d`} />
          <Stat label="Days practised" value={`${activeDays}`} />
        </dl>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium uppercase tracking-wide text-muted">This week</span>
          <span className="text-muted">
            {daysThisWeek} of {weeklyGoal} days
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Papers this week: ${daysThisWeek} of a ${weeklyGoal} day goal`}
          aria-valuenow={daysThisWeek}
          aria-valuemin={0}
          aria-valuemax={weeklyGoal}
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--heat-1)]"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mx-1 overflow-x-auto px-1">
          <div
            role="img"
            aria-label={`Practice activity for the last ${weeks.length} weeks: ${activeDays} days practised, ${totalAttempts} papers in total.`}
            className="flex min-w-fit gap-1.5 lg:gap-2"
          >
            <div className="mr-1 flex shrink-0 flex-col gap-1.5 pt-5 lg:gap-2">
              {WEEKDAY_LABELS.map((label, row) => (
                <span
                  key={row}
                  aria-hidden="true"
                  className="flex h-4 items-center text-[10px] leading-none text-muted sm:h-5 lg:h-6"
                >
                  {label}
                </span>
              ))}
            </div>
            {weeks.map((week) => (
              <div key={week.key} className="flex shrink-0 flex-col gap-1.5 lg:gap-2">
                <span aria-hidden="true" className="h-5 text-[10px] leading-5 text-muted">
                  {week.monthLabel}
                </span>
                {week.cells.map((cell) => (
                  <span
                    key={cell.key}
                    aria-hidden="true"
                    title={cellTooltip(cell)}
                    className={`h-4 w-4 rounded-md sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${
                      cell.frozen ? "bg-surface" : HEAT_CLASS[cell.level]
                    } ${cell.future ? "opacity-30" : ""} ${
                      cell.frozen
                        ? "ring-2 ring-accent ring-offset-1 ring-offset-surface"
                        : cell.key === todayKey
                          ? "ring-2 ring-accent ring-offset-1 ring-offset-surface"
                          : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as HeatLevel[]).map((level) => (
            <span key={level} aria-hidden="true" className={`h-3 w-3 rounded-[3px] ${HEAT_CLASS[level]}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  )
}

function FreezeLine({ freeze }: { freeze: FreezeInfo }) {
  const parts: string[] = []
  if (freeze.available > 0) {
    parts.push(
      freeze.available === 1 ? "1 freeze available" : `${freeze.available} freezes available`,
    )
  }
  if (freeze.usedOn) {
    parts.push(`Freeze used on ${formatDayKeyShort(freeze.usedOn)}`)
  }
  if (parts.length === 0) return null
  return <p className="mt-1 text-sm text-muted">{parts.join(" · ")}</p>
}

function cellTooltip(cell: StreakCell): string {
  if (cell.future) return cell.label
  if (cell.frozen) return `Streak freeze on ${cell.label}`
  if (cell.count === 0) return `No papers on ${cell.label}`
  const papers = `${cell.count} paper${cell.count === 1 ? "" : "s"}`
  const questions = cell.questions > 0 ? `${cell.questions} questions` : papers
  const score =
    cell.score !== null
      ? `${cell.score} / 300`
      : cell.accuracy !== null
        ? `${cell.accuracy.toFixed(0)}%`
        : papers
  return `${cell.label}: ${questions}, ${score}`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-serif text-xl font-semibold">{value}</dd>
    </div>
  )
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 fill-accent"
    >
      <path d="M12 21s-7.5-4.7-9.3-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9Z" />
    </svg>
  )
}
