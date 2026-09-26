"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { formatClock, remainingMs } from "@/lib/clock"
import { paperShortTitle } from "@/lib/paper"
import { createAttempt, clearActive, markHistorySynced, readActive, readHistory, shouldSyncLocalHistory, writeActive } from "@/lib/storage"
import { StreakCard } from "@/components/home/StreakCard"
import { RewardLadder } from "@/components/home/RewardLadder"
import { syncLocalHistory } from "@/server/paper-actions"
import { TIME_ZONE } from "@/lib/streak"
import type { StreakData } from "@/lib/streak"
import { buildLadder, nextLadderItem, type VoucherPublic } from "@/lib/vouchers"
import type { Attempt, PaperSummary, Result } from "@/lib/types"

// Fixed locale and zone so the server and client render the same string.
const submittedFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function HomeClient({
  papers,
  history,
  streak,
  vouchers,
}: {
  papers: PaperSummary[]
  history: Result[]
  streak: StreakData
  vouchers: VoucherPublic[]
}) {
  const router = useRouter()
  const ladder = useMemo(
    () => buildLadder(vouchers, streak.currentStreak, streak.todayKey),
    [vouchers, streak.currentStreak, streak.todayKey],
  )
  const nextVoucher = useMemo(() => nextLadderItem(ladder), [ladder])
  const [active, setActive] = useState<Attempt | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [pendingSetId, setPendingSetId] = useState<number | null>(null)

  useEffect(() => {
    setActive(readActive())
    if (!shouldSyncLocalHistory()) return
    const local = readHistory()
    void syncLocalHistory(local)
      .then(() => {
        markHistorySynced()
        router.refresh()
      })
      .catch(() => {
        // Keep local rows until a later visit succeeds.
      })
  }, [router])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const activeRemaining = active ? remainingMs(active, now) : 0

  function start(setId: number) {
    if (active && active.setId !== setId) {
      setPendingSetId(setId)
      return
    }
    if (active && active.setId === setId) {
      router.push(`/exam/${setId}`)
      return
    }
    begin(setId)
  }

  function begin(setId: number) {
    const paper = papers.find((item) => item.setId === setId)
    if (!paper) return
    clearActive()
    writeActive(createAttempt(setId, paper.durationMinutes * 60 * 1000))
    setPendingSetId(null)
    router.push(`/exam/${setId}`)
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-gradient-to-b from-surface to-background">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Subject Code 30</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">UGC NET English</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Full-length mock papers. 150 questions, 180 minutes, 300 marks. No negative marking.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <StreakCard streak={streak} nextVoucher={nextVoucher} />
        <RewardLadder items={ladder} />

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {papers.length === 0 ? (
            <p className="text-sm text-muted">No papers are in the database yet.</p>
          ) : (
            papers.map((paper) => (
              <SetCard
                key={paper.setId}
                paper={paper}
                history={history}
                active={active}
                remaining={active?.setId === paper.setId ? activeRemaining : 0}
                onStart={() => start(paper.setId)}
              />
            ))
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Attempt history</h2>
          <HistoryTable history={history} papers={papers} />
        </section>
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-muted">
        <Link href="/admin" className="hover:text-foreground">
          Import paper
        </Link>
      </footer>

      {pendingSetId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Cancel"
            onClick={() => setPendingSetId(null)}
          />
          <div className="relative w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Discard the in-progress attempt?</h2>
            <p className="mt-2 text-sm text-muted">
              A paper is already in progress. Starting Set {pendingSetId} will discard that attempt. This cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="border border-line px-4 py-2 text-sm" onClick={() => setPendingSetId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="bg-accent px-4 py-2 text-sm font-semibold text-white"
                onClick={() => begin(pendingSetId)}
              >
                Discard and start
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SetCard({
  paper,
  history,
  active,
  remaining,
  onStart,
}: {
  paper: PaperSummary
  history: Result[]
  active: Attempt | null
  remaining: number
  onStart: () => void
}) {
  const attempts = history.filter((item) => item.setId === paper.setId)
  const best = attempts.reduce((max, item) => Math.max(max, item.total), 0)
  const resumable = active?.setId === paper.setId

  return (
    <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="font-serif text-xl font-semibold">{paperShortTitle(paper)}</h2>
      <p className="mt-1 text-sm text-muted">150 questions · 180 minutes · 300 marks</p>
      <dl className="mt-4 flex gap-6 text-sm">
        <div>
          <dt className="text-muted">Best score</dt>
          <dd className="font-semibold">{attempts.length ? `${best} / 300` : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Attempts</dt>
          <dd className="font-semibold">{attempts.length}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onStart}
        className="mt-5 bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        {resumable
          ? remaining >= 0
            ? `Resume · ${formatClock(remaining)}`
            : `Resume · +${formatClock(-remaining)} overtime`
          : "Start"}
      </button>
    </article>
  )
}

function HistoryTable({
  history,
  papers,
}: {
  history: Result[]
  papers: PaperSummary[]
}) {
  const titles = useMemo(() => {
    const map = new Map<number, string>()
    for (const paper of papers) map.set(paper.setId, `Set ${paper.setId}`)
    return map
  }, [papers])

  if (history.length === 0) {
    return <p className="mt-3 text-sm text-muted">No attempts yet.</p>
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-[var(--table-head)] text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Set</th>
            <th className="px-3 py-2 font-medium">Score</th>
            <th className="px-3 py-2 font-medium">Accuracy</th>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.attemptId} className="border-b border-line last:border-b-0">
              <td className="px-3 py-2">{submittedFormatter.format(new Date(item.submittedAt))}</td>
              <td className="px-3 py-2">{titles.get(item.setId) ?? `Set ${item.setId}`}</td>
              <td className="px-3 py-2 font-medium">{item.total} / 300</td>
              <td className="px-3 py-2">{item.accuracy.toFixed(1)}%</td>
              <td className="px-3 py-2">
                {item.elapsedMs
                  ? item.overtimeMs
                    ? `${formatClock(item.elapsedMs)} (+${formatClock(item.overtimeMs)})`
                    : formatClock(item.elapsedMs)
                  : "—"}
              </td>
              <td className="px-3 py-2">
                <Link href={`/result/${item.attemptId}`} className="text-accent underline-offset-2 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
