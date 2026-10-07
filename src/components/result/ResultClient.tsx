"use client"

import Link from "next/link"
import { useMemo } from "react"
import { CUT_OFF_NOTE } from "@/lib/bands"
import { resultFacts } from "@/lib/exams"
import { formatClock } from "@/lib/clock"
import type { Result } from "@/lib/types"

export function ResultClient({ result, note }: { result: Result; note?: string | null }) {
  const weakest = useMemo(() => {
    return result.byUnit
      .filter((unit) => unit.attempted > 2)
      .slice()
      .sort((a, b) => a.correct / a.attempted - b.correct / b.attempted)
      .slice(0, 3)
  }, [result])

  const facts = resultFacts(result)
  const units = result.byUnit
    .slice()
    .sort((a, b) => {
      const aAcc = a.attempted === 0 ? 1 : a.correct / a.attempted
      const bAcc = b.attempted === 0 ? 1 : b.correct / b.attempted
      return aAcc - bAcc
    })

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-gradient-to-b from-surface to-background">
        <div className="mx-auto max-w-5xl px-4 py-4 text-sm">
          <Link href="/" className="text-muted hover:text-foreground">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {facts.label} · Set {facts.setNumber}
        </p>
        <p className="mt-2 font-serif text-7xl font-semibold leading-none tracking-tight">
          {result.total}
          <span className="ml-2 text-3xl font-normal text-muted">/ {facts.maxMarks}</span>
        </p>
        <p className="mt-3 text-lg">{result.band}</p>
        <p className="mt-2 max-w-xl text-sm text-muted">{CUT_OFF_NOTE}</p>
        {result.elapsedMs ? (
          <p className="mt-3 text-sm">
            Time taken {formatClock(result.elapsedMs)}
            {result.overtimeMs > 0 ? (
              <span className="text-red"> · {formatClock(result.overtimeMs)} overtime</span>
            ) : (
              <span className="text-muted"> · within {facts.durationMinutes} minutes</span>
            )}
          </p>
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Paper I" value={`${result.paper1} / ${facts.paper1Max}`} />
          <Stat label="Paper II" value={`${result.paper2} / ${facts.paper2Max}`} />
          <Stat label="Attempted" value={String(result.attempted)} />
          <Stat label="Accuracy" value={`${result.accuracy.toFixed(1)}%`} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Correct" value={String(result.correct)} />
          <Stat label="Wrong" value={String(result.wrong)} />
          <Stat label="Unattempted" value={String(result.unattempted)} />
        </div>

        {note ? (
          <section className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">A note from Chinku</p>
            <p className="mt-2 font-serif text-lg">{note}</p>
          </section>
        ) : null}

        {weakest.length > 0 ? (
          <section className="mt-10 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Weakest units
            </h2>
            <p className="mt-1 text-sm text-muted">Among units with more than two attempted questions.</p>
            <ol className="mt-3 space-y-1 text-sm">
              {weakest.map((unit) => (
                <li key={unit.unit}>
                  <span className="font-medium">{unit.unit}</span>
                  <span className="text-muted">
                    {" "}
                    — {unit.correct}/{unit.total} correct ({unit.marks} marks)
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Unit breakdown</h2>
            <Link
              href={`/review/${result.attemptId}`}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Review answers
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-[var(--table-head)] text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Unit</th>
                  <th className="px-3 py-2 font-medium">Correct</th>
                  <th className="px-3 py-2 font-medium">Marks</th>
                  <th className="px-3 py-2 font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const acc = unit.attempted === 0 ? 0 : (unit.correct / unit.attempted) * 100
                  const bar = unit.total === 0 ? 0 : (unit.correct / unit.total) * 100
                  return (
                    <tr key={`${unit.paper}-${unit.unit}`} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-2">
                        <span className="text-xs text-muted">Paper {unit.paper === 1 ? "I" : "II"}</span>
                        <div>{unit.unit}</div>
                      </td>
                      <td className="px-3 py-2">
                        {unit.correct} / {unit.total}
                      </td>
                      <td className="px-3 py-2">{unit.marks}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-14 tabular-nums">{unit.attempted === 0 ? "—" : `${acc.toFixed(0)}%`}</span>
                          <span className="h-2 w-24 overflow-hidden rounded-full bg-[var(--heat-1)]">
                            <span
                              className="block h-full rounded-full bg-accent"
                              style={{ width: `${bar}%` }}
                            />
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}
