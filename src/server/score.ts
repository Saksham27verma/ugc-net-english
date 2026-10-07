"use server"

import "server-only"
import { bandFor } from "@/lib/bands"
import { EXAMS } from "@/lib/exams"
import { questionTotal } from "@/lib/paper"
import type { AttemptResponse, Result, ResultQuestion, ResultUnit, Selected } from "@/lib/types"
import { loadKey } from "./load-key"
import { revalidatePath } from "next/cache"
import { getPaperFromStore, saveAttemptResult } from "./papers"

function asSelected(value: unknown): Selected {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value
  if (value === "1" || value === "2" || value === "3" || value === "4") {
    return Number(value) as 1 | 2 | 3 | 4
  }
  return null
}

export async function submitAttempt(
  setId: number,
  responses: Record<number | string, AttemptResponse>,
  attemptId: string,
  timing?: { startedAt: number; durationMs: number },
): Promise<Result> {
  const paper = await getPaperFromStore(setId)
  if (!paper) {
    throw new Error(`Unknown set ${setId}`)
  }
  const key = await loadKey(setId)
  const perQuestion: ResultQuestion[] = []
  const byUnit: ResultUnit[] = []
  let correct = 0
  let attempted = 0
  let paper1 = 0
  let paper2 = 0

  for (const section of paper.sections) {
    for (const unit of section.units) {
      let unitAttempted = 0
      let unitCorrect = 0
      let unitWrong = 0
      for (const question of unit.questions) {
        const entry = key[String(question.no)]
        if (!entry) {
          throw new Error(`Missing key for Q.${question.no}`)
        }
        const response = responses[question.no] ?? responses[String(question.no)]
        const selected = asSelected(response?.selected)
        const isCorrect = selected === entry.answer
        if (selected !== null) {
          attempted += 1
          unitAttempted += 1
        }
        if (isCorrect) {
          correct += 1
          unitCorrect += 1
          const marks = paper.marksPerCorrect
          if (section.paper === 1) paper1 += marks
          else paper2 += marks
        } else if (selected !== null && paper.marksPerWrong > 0) {
          unitWrong += 1
          const penalty = paper.marksPerWrong
          if (section.paper === 1) paper1 -= penalty
          else paper2 -= penalty
        }
        perQuestion.push({
          no: question.no,
          selected,
          answer: entry.answer,
          correct: isCorrect,
          marked: Boolean(response?.marked),
          explanation: entry.explanation,
        })
      }
      byUnit.push({
        unit: unit.name,
        paper: section.paper,
        total: unit.lastQ - unit.firstQ + 1,
        attempted: unitAttempted,
        correct: unitCorrect,
        marks: unitCorrect * paper.marksPerCorrect - unitWrong * paper.marksPerWrong,
      })
    }
  }

  const wrong = attempted - correct
  const unattempted = questionTotal(paper) - attempted
  const total = paper1 + paper2
  const accuracy = attempted === 0 ? 0 : (correct / attempted) * 100
  const profile = EXAMS[paper.exam]

  const submittedAt = Date.now()
  const elapsedMs = timing ? Math.max(0, submittedAt - timing.startedAt) : 0
  const overtimeMs = timing ? Math.max(0, elapsedMs - timing.durationMs) : 0

  const result: Result = {
    attemptId,
    setId,
    exam: paper.exam,
    setNumber: paper.setNumber,
    maxMarks: profile.maxMarks,
    paper1Max: profile.paper1Max,
    paper2Max: profile.paper2Max,
    durationMinutes: paper.durationMinutes,
    total,
    paper1,
    paper2,
    attempted,
    correct,
    wrong,
    unattempted,
    accuracy,
    band: bandFor(total, paper.exam),
    byUnit,
    perQuestion,
    submittedAt,
    elapsedMs,
    overtimeMs,
  }

  await saveAttemptResult(result)
  revalidatePath("/")
  revalidatePath(`/result/${result.attemptId}`)
  revalidatePath(`/review/${result.attemptId}`)

  return result
}
