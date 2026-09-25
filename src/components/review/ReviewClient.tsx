"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Markdown } from "@/components/Markdown"
import { locateQuestion } from "@/lib/paper"
import { findResult } from "@/lib/storage"
import type { Paper, Result } from "@/lib/types"
import { getPublishedPaper } from "@/server/paper-actions"

type Filter = "all" | "wrong" | "unattempted" | "marked" | string

export function ReviewClient({ attemptId }: { attemptId: string }) {
  const router = useRouter()
  const [result, setResult] = useState<Result | null | undefined>(undefined)
  const [paper, setPaper] = useState<Paper | null | undefined>(undefined)
  const [filter, setFilter] = useState<Filter>("all")
  const [jump, setJump] = useState<number | null>(null)

  useEffect(() => {
    const found = findResult(attemptId) ?? null
    setResult(found)
    if (!found) {
      setPaper(null)
      return
    }
    setPaper(undefined)
    void getPublishedPaper(found.setId).then((loaded) => setPaper(loaded))
  }, [attemptId])

  useEffect(() => {
    if (result === null) router.replace("/")
  }, [result, router])

  const units = useMemo(() => paper?.sections.flatMap((section) => section.units) ?? [], [paper])

  const visible = useMemo(() => {
    if (!result) return []
    return result.perQuestion.filter((item) => {
      if (filter === "all") return true
      if (filter === "wrong") return item.selected !== null && !item.correct
      if (filter === "unattempted") return item.selected === null
      if (filter === "marked") return item.marked
      const unit = units.find((u) => item.no >= u.firstQ && item.no <= u.lastQ)
      return unit?.name === filter
    })
  }, [result, filter, units])

  useEffect(() => {
    if (jump == null) return
    const el = document.getElementById(`q-${jump}`)
    el?.scrollIntoView({ block: "start" })
    setJump(null)
  }, [jump])

  if (result === undefined || paper === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">Loading review…</div>
  }
  if (!result || !paper) return null

  const shownPassages = new Set<number>()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm">
          <Link href={`/result/${attemptId}`} className="text-muted hover:text-foreground">
            ← Result
          </Link>
          <p className="font-medium">Review · Set {result.setId}</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_14rem]">
        <div>
          <div className="flex flex-wrap gap-2">
            {(["all", "wrong", "unattempted", "marked"] as const).map((chip) => (
              <Chip key={chip} active={filter === chip} onClick={() => setFilter(chip)}>
                {chip === "all" ? "All" : chip[0].toUpperCase() + chip.slice(1)}
              </Chip>
            ))}
            {units.map((unit) => (
              <Chip key={unit.name} active={filter === unit.name} onClick={() => setFilter(unit.name)}>
                {unit.name}
              </Chip>
            ))}
          </div>

          <ol className="mt-6 space-y-8">
            {visible.map((item) => {
              const located = locateQuestion(paper, item.no)
              if (!located) return null
              const showPassage = Boolean(located.unit.passage) && !shownPassages.has(located.unit.firstQ)
              if (located.unit.passage) shownPassages.add(located.unit.firstQ)
              return (
                <li id={`q-${item.no}`} key={item.no} className="border border-line bg-surface p-5">
                  <p className="text-xs tracking-wide text-muted">
                    {located.unit.name}
                    <span className="mx-2">·</span>
                    {item.correct ? "Correct" : item.selected ? "Wrong" : "Unattempted"}
                    {item.marked ? " · Marked" : ""}
                  </p>
                  {showPassage && located.unit.passage ? (
                    <div className="mt-3 border-b border-line pb-4">
                      <Markdown>{located.unit.passage}</Markdown>
                    </div>
                  ) : null}
                  <h2 className="mt-3 font-sans text-base font-semibold">Q.{item.no}</h2>
                  <div className="mt-3">
                    <Markdown>{located.question.stem}</Markdown>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {located.question.options.map((option, index) => {
                      const value = index + 1
                      const isAnswer = value === item.answer
                      const isSelected = value === item.selected
                      return (
                        <li
                          key={value}
                          className={`border px-3 py-2 text-sm ${
                            isAnswer
                              ? "border-answered bg-[#eef6f0]"
                              : isSelected
                                ? "border-not-answered bg-[#fdf2f2]"
                                : "border-line"
                          }`}
                        >
                          <span className="mr-2 text-muted">{value}.</span>
                          <Markdown inline>{option}</Markdown>
                          {isAnswer ? <span className="ml-2 text-xs font-semibold text-answered">Correct</span> : null}
                          {isSelected && !isAnswer ? (
                            <span className="ml-2 text-xs font-semibold text-not-answered">Selected</span>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                  <p className="mt-4 border-t border-line pt-3 font-serif text-[0.98rem] leading-relaxed">
                    <span className="font-sans text-xs font-semibold uppercase tracking-wide text-muted">
                      Explanation
                    </span>
                    <span className="mt-1 block">{item.explanation}</span>
                  </p>
                </li>
              )
            })}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-16 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Jump to</p>
          <div className="grid grid-cols-5 gap-1.5">
            {result.perQuestion.map((item) => (
              <button
                key={item.no}
                type="button"
                onClick={() => {
                  setFilter("all")
                  setJump(item.no)
                }}
                className={`h-8 text-[11px] ${
                  item.correct
                    ? "border border-answered text-answered"
                    : item.selected
                      ? "border border-not-answered text-not-answered"
                      : "border border-line text-muted"
                }`}
                aria-label={`Jump to question ${item.no}`}
              >
                {item.no}
              </button>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-2.5 py-1 text-xs ${
        active ? "border-accent bg-accent text-white" : "border-line bg-surface"
      }`}
    >
      {children}
    </button>
  )
}
