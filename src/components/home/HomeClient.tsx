"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { formatClock, remainingMs } from "@/lib/clock"
import { EXAMS, markingLine, resultFacts, type ExamId } from "@/lib/exams"
import { paperShortTitle } from "@/lib/paper"
import { createAttempt, clearActive, markHistorySynced, readActive, readHistory, shouldSyncLocalHistory, writeActive } from "@/lib/storage"
import { StreakCard } from "@/components/home/StreakCard"
import { RewardLadder } from "@/components/home/RewardLadder"
import { WelcomeBack } from "@/components/home/WelcomeBack"
import { WeeklyRecapCard } from "@/components/home/WeeklyRecapCard"
import type { ComebackInfo, WeeklyRecap } from "@/lib/motivation"
import { syncLocalHistory } from "@/server/paper-actions"
import { TIME_ZONE } from "@/lib/streak"
import type { FreezeInfo, StreakData } from "@/lib/streak"
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
  freeze,
  comeback,
  recap,
  examDays,
  vouchers,
}: {
  papers: PaperSummary[]
  history: Result[]
  streak: StreakData
  freeze: FreezeInfo
  comeback: ComebackInfo | null
  recap: WeeklyRecap | null
  examDays: number
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
          <p className="text-xs uppercase tracking-[0.18em] text-muted">English</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">UGC NET and UPPSC</h1>
          <p className="mt-2 font-serif text-lg text-accent">{examLine(examDays)}</p>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Full-length mocks for both exams. Each keeps its own sets, timer, and marking. Weekly target stays{" "}
            {streak.weeklyGoal} of 7 days.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {streak.todayCount === 0 ? (
          <p className="mb-6 rounded-2xl border border-accent bg-[var(--heat-0)] px-4 py-3 text-sm">
            Chinku&apos;s waiting on today&apos;s set
          </p>
        ) : null}
        <StreakCard streak={streak} freeze={freeze} nextVoucher={nextVoucher} />
        {comeback ? <WelcomeBack comeback={comeback} /> : null}
        {recap ? <WeeklyRecapCard recap={recap} /> : null}
        <RewardLadder items={ladder} />

        <div className="mt-8 space-y-10">
          {(["ugc-net", "uppsc"] as const).map((exam) => (
            <ExamGroup
              key={exam}
              exam={exam}
              papers={papers.filter((paper) => paper.exam === exam)}
              history={history}
              active={active}
              activeRemaining={activeRemaining}
              onStart={start}
            />
          ))}
        </div>

        <section className="mt-12">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">Attempt history</h2>
          <HistoryTable history={history} papers={papers} />
        </section>
      </main>
      <footer className="mx-auto flex max-w-5xl gap-4 px-4 pb-8 text-xs text-muted">
        <Link href="/rewards" className="hover:text-foreground">
          Rewards
        </Link>
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
              A paper is already in progress. Starting{" "}
              {paperShortTitle(papers.find((item) => item.setId === pendingSetId) ?? { setId: pendingSetId })} will
              discard that attempt. This cannot be undone.
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

function ExamGroup({
  exam,
  papers,
  history,
  active,
  activeRemaining,
  onStart,
}: {
  exam: ExamId
  papers: PaperSummary[]
  history: Result[]
  active: Attempt | null
  activeRemaining: number
  onStart: (setId: number) => void
}) {
  const profile = EXAMS[exam]
  const blurb = `${profile.questionCount} questions · ${profile.durationMinutes} minutes · ${profile.maxMarks} marks · ${markingLine(profile.marksPerCorrect, profile.marksPerWrong)}. Paper I is ${profile.paper1Count} questions, Paper II is ${profile.paper2Count}.`

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-serif text-2xl font-semibold">{profile.label}</h2>
        <p className="mt-1 text-sm text-muted">{blurb}</p>
      </div>
      {papers.length === 0 ? (
        <p className="text-sm text-muted">No {profile.label} papers yet. Import one from the admin page.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {papers.map((paper) => (
            <SetCard
              key={paper.setId}
              paper={paper}
              history={history}
              active={active}
              remaining={active?.setId === paper.setId ? activeRemaining : 0}
              onStart={() => onStart(paper.setId)}
            />
          ))}
        </div>
      )}
    </section>
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
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{EXAMS[paper.exam].label}</p>
      <h2 className="mt-1 font-serif text-xl font-semibold">Set {paper.setNumber}</h2>
      <p className="mt-1 text-sm text-muted">
        {paper.questionCount} questions · {paper.durationMinutes} minutes · {paper.maxMarks} marks ·{" "}
        {markingLine(paper.marksPerCorrect, paper.marksPerWrong)}
      </p>
      <dl className="mt-4 flex gap-6 text-sm">
        <div>
          <dt className="text-muted">Best score</dt>
          <dd className="font-semibold">{attempts.length ? `${best} / ${paper.maxMarks}` : "—"}</dd>
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

function examLine(days: number): string {
  if (days > 1) return `${days} days to the exam`
  if (days === 1) return "1 day to the exam"
  if (days === 0) return "Exam day"
  return "The exam date has passed"
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
    for (const paper of papers) map.set(paper.setId, paperShortTitle(paper))
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
              <td className="px-3 py-2">{titles.get(item.setId) ?? paperShortTitle(item)}</td>
              <td className="px-3 py-2 font-medium">
                {item.total} / {resultFacts(item).maxMarks}
              </td>
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
