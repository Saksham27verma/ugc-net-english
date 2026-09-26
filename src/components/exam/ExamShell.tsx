"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Markdown } from "@/components/Markdown"
import { Palette, PaletteLegend } from "@/components/exam/Palette"
import { formatClock, formatTimer, timerTone, timerWarning } from "@/lib/clock"
import { firstUnansweredInSection, locateQuestion, paperShortTitle } from "@/lib/paper"
import { answeredCount, getResponse, markedCount, statusCounts } from "@/lib/status"
import { clearActive } from "@/lib/storage"
import { useExam } from "@/lib/use-exam"
import type { Paper, Selected } from "@/lib/types"
import { submitAttempt } from "@/server/score"

export function ExamShell({ paper }: { paper: Paper }) {
  const router = useRouter()
  const exam = useExam(paper)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { attempt, currentNo, remaining, goTo, select, clear, saveAndNext, saveAndMark, previous, flushTime } =
    exam

  const located = locateQuestion(paper, currentNo)
  const response = attempt ? getResponse(attempt, currentNo) : null

  const finish = useCallback(async () => {
    if (submittingRef.current) return
    const flushed = flushTime()
    if (!flushed) return
    submittingRef.current = true
    setError(null)
    try {
      const result = await submitAttempt(paper.setId, flushed.responses, flushed.id, {
        startedAt: flushed.startedAt,
        durationMs: flushed.durationMs,
      })
      clearActive()
      router.push(`/result/${result.attemptId}`)
    } catch (err) {
      submittingRef.current = false
      setError(
        err instanceof Error
          ? `${err.message} Your answers are still saved on this device — try Submit again.`
          : "Could not submit the paper. Your answers are still saved — try Submit again.",
      )
    }
  }, [flushTime, paper.setId, router])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (submitOpen && !dialog.open) dialog.showModal()
    if (!submitOpen && dialog.open) dialog.close()
  }, [submitOpen])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!attempt || submitOpen) return
      const target = event.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return

      if (event.key === "Escape") {
        setPaletteOpen(false)
        return
      }
      if (event.key >= "1" && event.key <= "4") {
        event.preventDefault()
        select(Number(event.key) as Selected)
        return
      }
      if (event.key === "Enter") {
        event.preventDefault()
        saveAndNext()
        return
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        previous()
        return
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        goTo(Math.min(150, currentNo + 1))
        return
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault()
        saveAndMark()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [attempt, submitOpen, select, saveAndNext, previous, goTo, currentNo, saveAndMark])

  if (!attempt || !located || !response) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        Loading paper…
      </div>
    )
  }

  const counts = statusCounts(attempt)
  const answered = answeredCount(attempt)
  const marked = markedCount(attempt)
  const notAnswered = 150 - answered
  const tone = timerTone(remaining)
  const warning = timerWarning(remaining)
  const timer = formatTimer(remaining)
  const timerClass =
    tone === "red" ? "text-red" : tone === "amber" ? "text-amber" : "text-foreground"
  const passage = located.unit.passage

  const actionRow = (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-3">
      <button
        type="button"
        onClick={saveAndNext}
        className="bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Save & Next
      </button>
      <button
        type="button"
        onClick={saveAndMark}
        className="border border-line bg-surface px-3 py-2 text-sm"
      >
        Save & Mark for Review
      </button>
      <button type="button" onClick={clear} className="border border-line bg-surface px-3 py-2 text-sm">
        Clear Response
      </button>
      <button
        type="button"
        onClick={previous}
        disabled={currentNo === 1}
        className="border border-line bg-surface px-3 py-2 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="border border-line bg-surface px-3 py-2 text-sm lg:hidden"
      >
        Palette · {answered} answered
      </button>
      <button
        type="button"
        onClick={() => setSubmitOpen(true)}
        className="ml-auto border border-red px-4 py-2 text-sm font-semibold text-red"
      >
        Submit
      </button>
    </div>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold tracking-tight">
            {paperShortTitle(paper)}
          </p>
          <p className="truncate text-xs text-muted">{paper.title}</p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-2xl font-medium tabular-nums ${timerClass}`}>
            {timer.display}
          </p>
          {timer.overtime ? (
            <p className="text-xs text-red">Overtime — exam continues until you submit</p>
          ) : warning ? (
            <p className={`text-xs ${tone === "red" ? "text-red" : "text-amber"}`}>
              {warning} minute{warning === 1 ? "" : "s"} remaining
            </p>
          ) : (
            <p className="text-xs text-muted">Time remaining</p>
          )}
        </div>
      </header>

      <div className="flex border-b border-line bg-surface px-4">
        {([1, 2] as const).map((paperNo) => {
          const active = located.section.paper === paperNo
          return (
            <button
              key={paperNo}
              type="button"
              onClick={() =>
                goTo(
                  firstUnansweredInSection(paper, paperNo, (n) => Boolean(attempt.responses[n]?.selected)),
                )
              }
              className={`mr-6 border-b-2 py-2.5 text-sm ${
                active
                  ? "border-accent font-semibold text-accent"
                  : "border-transparent text-muted"
              }`}
            >
              {paperNo === 1 ? "Paper I (1–50)" : "Paper II (51–150)"}
            </button>
          )
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {passage ? (
              <>
                <details open className="border-b border-line px-4 py-3 lg:hidden">
                  <summary className="cursor-pointer text-sm font-medium text-muted">Passage</summary>
                  <div
                    key={located.unit.firstQ}
                    className="mt-3 max-h-64 overflow-y-auto pr-1"
                  >
                    <Markdown>{passage}</Markdown>
                  </div>
                </details>
                <aside
                  key={located.unit.firstQ}
                  className="hidden min-h-0 w-[min(42%,28rem)] shrink-0 overflow-y-auto border-r border-line bg-surface px-5 py-5 lg:block"
                >
                  <Markdown>{passage}</Markdown>
                </aside>
              </>
            ) : null}

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="px-4 pt-4 sm:px-6">
                <p className="font-sans text-xs tracking-wide text-muted">
                  {located.unit.name}
                  <span className="mx-2 text-line">·</span>
                  +2 marks · no negative marking
                </p>
              </div>
              {actionRow}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                <h2 className="font-sans text-lg font-semibold">Q.{located.question.no}</h2>
                <div className="mt-4">
                  <Markdown>{located.question.stem}</Markdown>
                </div>
                <fieldset className="mt-6 space-y-2" aria-label="Options">
                  <legend className="sr-only">Choose an option</legend>
                  {located.question.options.map((option, index) => {
                    const value = (index + 1) as 1 | 2 | 3 | 4
                    const checked = response.selected === value
                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-start gap-3 border px-3 py-3 ${
                          checked ? "border-accent bg-[#eef3f8]" : "border-line bg-surface"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentNo}`}
                          value={value}
                          checked={checked}
                          onChange={() => select(value)}
                          className="mt-1 h-4 w-4 accent-[var(--accent)]"
                        />
                        <span className="w-4 shrink-0 font-sans text-sm text-muted">{value}.</span>
                        <Markdown inline className="pt-px">
                          {option}
                        </Markdown>
                      </label>
                    )
                  })}
                </fieldset>
              </div>
            </section>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-line bg-surface px-4 py-4 lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Question palette</p>
          <PaletteLegend counts={counts} />
          <div className="mt-4">
            <Palette attempt={attempt} currentNo={currentNo} onJump={goTo} />
          </div>
        </aside>
      </div>

      {paletteOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label="Question palette">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close palette"
            onClick={() => setPaletteOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto border-t border-line bg-surface px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Question palette</p>
              <button type="button" className="text-sm text-muted" onClick={() => setPaletteOpen(false)}>
                Close
              </button>
            </div>
            <PaletteLegend counts={counts} />
            <div className="mt-4">
              <Palette
                attempt={attempt}
                currentNo={currentNo}
                onJump={(n) => {
                  goTo(n)
                  setPaletteOpen(false)
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={() => setSubmitOpen(false)}
        className="w-[min(32rem,calc(100%-2rem))] border border-line bg-surface p-6 text-foreground"
      >
        <h2 className="font-sans text-lg font-semibold">Submit paper?</h2>
        <p className="mt-2 text-sm text-muted">
          Once submitted, this attempt cannot be reopened. Unanswered questions will score zero.
        </p>
        {timer.overtime ? (
          <p className="mt-2 text-sm text-red">
            Official time has ended. Extra time so far: {formatClock(-remaining)}.
          </p>
        ) : null}
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="border border-line p-3">
            <dt className="text-muted">Answered</dt>
            <dd className="text-lg font-semibold">{answered}</dd>
          </div>
          <div className="border border-line p-3">
            <dt className="text-muted">Not answered</dt>
            <dd className="text-lg font-semibold">{notAnswered}</dd>
          </div>
          <div className="border border-line p-3">
            <dt className="text-muted">Marked</dt>
            <dd className="text-lg font-semibold">{marked}</dd>
          </div>
        </dl>
        {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="border border-line px-4 py-2 text-sm"
            onClick={() => setSubmitOpen(false)}
          >
            Return to paper
          </button>
          <button
            type="button"
            className="bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            onClick={() => void finish()}
          >
            Submit paper
          </button>
        </div>
      </dialog>
    </div>
  )
}
