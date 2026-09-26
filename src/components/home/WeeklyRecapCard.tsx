import { formatDayKey } from "@/lib/streak"
import type { WeeklyRecap } from "@/lib/motivation"

export function WeeklyRecapCard({ recap }: { recap: WeeklyRecap }) {
  const delta = recap.thisWeekDays - recap.lastWeekDays
  const streakDelta = recap.streakNow - recap.streakThen
  const daysWord =
    delta === 0
      ? "the same number of days as last week"
      : delta > 0
        ? `${delta} more day${delta === 1 ? "" : "s"} than last week`
        : `${-delta} fewer day${delta === -1 ? "" : "s"} than last week`

  return (
    <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Weekly recap</p>
      <h2 className="mt-1 font-serif text-xl font-semibold">
        Week ending {formatDayKey(recap.weekKey)}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {recap.thisWeekDays} day{recap.thisWeekDays === 1 ? "" : "s"} practised — {daysWord}.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RecapStat label="Questions" value={String(recap.questions)} />
        <RecapStat label="Accuracy" value={`${recap.accuracy.toFixed(1)}%`} />
        <RecapStat
          label="Streak now"
          value={`${recap.streakNow}d`}
        />
        <RecapStat
          label="Streak then"
          value={`${recap.streakThen}d${streakDelta === 0 ? "" : streakDelta > 0 ? ` · +${streakDelta}` : ` · ${streakDelta}`}`}
        />
      </dl>

      {recap.units.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Paper II units</p>
          {recap.weakest ? (
            <p className="mt-2 text-sm">
              Weakest unit this week: <span className="font-medium">{recap.weakest}</span>
            </p>
          ) : null}
          <ul className="mt-3 space-y-1 text-sm">
            {recap.units.map((unit) => (
              <li key={unit.unit} className="flex justify-between gap-4">
                <span>{unit.unit}</span>
                <span className="text-muted tabular-nums">
                  {unit.attempted === 0 ? "—" : `${unit.accuracy.toFixed(0)}%`}
                  <span className="ml-2 text-xs">
                    {unit.correct}/{unit.attempted}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function RecapStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-background p-3">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-lg font-semibold">{value}</dd>
    </div>
  )
}
