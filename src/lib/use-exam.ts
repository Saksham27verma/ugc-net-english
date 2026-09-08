"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { remainingMs } from "./clock"
import { getResponse } from "./status"
import { createAttempt, readActive, writeActive } from "./storage"
import type { Attempt, AttemptResponse, Paper, Selected } from "./types"

const TOTAL = 150

function persist(attempt: Attempt): Attempt {
  writeActive(attempt)
  return attempt
}

function resumeAt(attempt: Attempt): number {
  for (let n = 1; n <= TOTAL; n += 1) {
    if (!attempt.responses[n]?.selected) return n
  }
  return TOTAL
}

function applyTime(attempt: Attempt, no: number, enteredAt: number, at: number): Attempt {
  const delta = Math.max(0, at - enteredAt)
  if (delta === 0) return attempt
  const current = getResponse(attempt, no)
  return {
    ...attempt,
    responses: {
      ...attempt.responses,
      [no]: { ...current, timeSpentMs: current.timeSpentMs + delta },
    },
  }
}

function visit(attempt: Attempt, no: number): Attempt {
  const current = getResponse(attempt, no)
  if (current.visited) return attempt
  return {
    ...attempt,
    responses: {
      ...attempt.responses,
      [no]: { ...current, visited: true },
    },
  }
}

export function useExam(paper: Paper) {
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [currentNo, setCurrentNo] = useState(1)
  const [now, setNow] = useState(() => Date.now())
  const enteredAtRef = useRef(Date.now())
  const currentNoRef = useRef(1)
  const attemptRef = useRef<Attempt | null>(null)

  useEffect(() => {
    attemptRef.current = attempt
  }, [attempt])

  useEffect(() => {
    currentNoRef.current = currentNo
  }, [currentNo])

  useEffect(() => {
    const existing = readActive()
    const durationMs = paper.durationMinutes * 60 * 1000
    const started =
      existing && existing.setId === paper.setId
        ? existing
        : persist(createAttempt(paper.setId, durationMs))
    const startNo = resumeAt(started)
    const initial = visit(started, startNo)
    persist(initial)
    setAttempt(initial)
    setCurrentNo(startNo)
    currentNoRef.current = startNo
    enteredAtRef.current = Date.now()
  }, [paper.setId, paper.durationMinutes])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const update = useCallback((mutator: (current: Attempt) => Attempt) => {
    setAttempt((prev) => {
      if (!prev) return prev
      const next = persist(mutator(prev))
      attemptRef.current = next
      return next
    })
  }, [])

  const goTo = useCallback(
    (no: number) => {
      if (no < 1 || no > TOTAL) return
      update((current) => {
        const withTime = applyTime(current, currentNoRef.current, enteredAtRef.current, Date.now())
        const next = visit(withTime, no)
        return next
      })
      currentNoRef.current = no
      enteredAtRef.current = Date.now()
      setCurrentNo(no)
    },
    [update],
  )

  const patchCurrent = useCallback(
    (patch: Partial<AttemptResponse>) => {
      const no = currentNoRef.current
      update((current) => {
        const existing = getResponse(current, no)
        return {
          ...current,
          responses: {
            ...current.responses,
            [no]: { ...existing, visited: true, ...patch },
          },
        }
      })
    },
    [update],
  )

  const select = useCallback(
    (selected: Selected) => {
      patchCurrent({ selected })
    },
    [patchCurrent],
  )

  const clear = useCallback(() => {
    patchCurrent({ selected: null })
  }, [patchCurrent])

  const saveAndNext = useCallback(() => {
    goTo(Math.min(TOTAL, currentNoRef.current + 1))
  }, [goTo])

  const saveAndMark = useCallback(() => {
    patchCurrent({ marked: true })
    goTo(Math.min(TOTAL, currentNoRef.current + 1))
  }, [goTo, patchCurrent])

  const previous = useCallback(() => {
    goTo(Math.max(1, currentNoRef.current - 1))
  }, [goTo])

  const flushTime = useCallback((): Attempt | null => {
    const current = attemptRef.current
    if (!current) return null
    const flushed = persist(applyTime(current, currentNoRef.current, enteredAtRef.current, Date.now()))
    attemptRef.current = flushed
    setAttempt(flushed)
    enteredAtRef.current = Date.now()
    return flushed
  }, [])

  const remaining = attempt ? remainingMs(attempt, now) : paper.durationMinutes * 60 * 1000

  return {
    attempt,
    currentNo,
    remaining,
    goTo,
    select,
    clear,
    saveAndNext,
    saveAndMark,
    previous,
    flushTime,
  }
}
