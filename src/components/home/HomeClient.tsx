"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { formatRemaining, remainingMs } from "@/lib/clock"
import { paperShortTitle } from "@/lib/paper"
import { appendHistory, createAttempt, clearActive, readActive, readHistory, writeActive } from "@/lib/storage"
import type { Attempt, Result } from "@/lib/types"
import { submitAttempt } from "@/server/score"

export function HomeClient({
  papers,
}: {
  papers: { setId: number; title: string; durationMinutes: 180 }[]
}) {
  const router = useRouter()
  const [history, setHistory] = useState<Result[]>([])
  const [active, setActive] = useState<Attempt | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [pendingSetId, setPendingSetId] = useState<number | null>(null)

  useEffect(() => {
    const existing = readActive()
    setHistory(readHistory())
    if (existing && remainingMs(existing) <= 0) {
      void (async () => {
        try {
          const result = await submitAttempt(existing.setId, existing.responses, existing.id)
          appendHistory(result)
          clearActive()
          setActive(null)
          setHistory(readHistory())
        } catch {
          setActive(existing)
        }
      })()
      return
    }
    setActive(existing)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const activeRemaining = active ? remainingMs(active, now) : 0

  function start(setId: number) {
    if (active && remainingMs(active, Date.now()) > 0 && active.setId !== setId) {
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
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Subject Code 30</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">UGC NET English</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Full-length mock papers. 150 questions, 180 minutes, 300 marks. No negative marking.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="grid gap-4 md:grid-cols-2">
          {papers.map((paper) => (
            <SetCard
              key={paper.setId}
              paper={paper}
              history={history}
              active={active}
              remaining={active?.setId === paper.setId ? activeRemaining : 0}
              onStart={() => start(paper.setId)}
            />
          ))}
        </section>

        <section className="mt-12">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Attempt history</h2>
          <HistoryTable history={history} papers={papers} />
        </section>
      </main>

      {pendingSetId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Cancel"
            onClick={() => setPendingSetId(null)}
          />
          <div className="relative w-[min(28rem,calc(100%-2rem))] border border-line bg-surface p-6">
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
  paper: { setId: number; title: string; durationMinutes: 180 }
  history: Result[]
  active: Attempt | null
  remaining: number
  onStart: () => void
}) {
  const attempts = history.filter((item) => item.setId === paper.setId)
  const best = attempts.reduce((max, item) => Math.max(max, item.total), 0)
  const resumable = active?.setId === paper.setId

  return (
    <article className="border border-line bg-surface p-5">
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
        {resumable ? `Resume · ${formatRemaining(remaining)}` : "Start"}
      </button>
    </article>
  )
}

function HistoryTable({
  history,
  papers,
}: {
  history: Result[]
  papers: { setId: number; title: string; durationMinutes: 180 }[]
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
    <div className="mt-3 overflow-x-auto border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-[#f3efe6] text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Set</th>
            <th className="px-3 py-2 font-medium">Score</th>
            <th className="px-3 py-2 font-medium">Accuracy</th>
            <th className="px-3 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.attemptId} className="border-b border-line last:border-b-0">
              <td className="px-3 py-2">
                {new Date(item.submittedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-3 py-2">{titles.get(item.setId) ?? `Set ${item.setId}`}</td>
              <td className="px-3 py-2 font-medium">{item.total} / 300</td>
              <td className="px-3 py-2">{item.accuracy.toFixed(1)}%</td>
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
