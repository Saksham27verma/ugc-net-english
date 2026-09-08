import type { Attempt, AttemptResponse, QuestionStatus } from "./types"

export function questionStatus(response?: AttemptResponse | null): QuestionStatus {
  if (!response || !response.visited) return "Not Visited"
  if (response.selected && response.marked) return "Answered & Marked"
  if (!response.selected && response.marked) return "Marked for Review"
  if (response.selected && !response.marked) return "Answered"
  return "Not Answered"
}

export function emptyResponse(): AttemptResponse {
  return { selected: null, marked: false, visited: false, timeSpentMs: 0 }
}

export function getResponse(attempt: Attempt, no: number): AttemptResponse {
  return attempt.responses[no] ?? emptyResponse()
}

export type StatusCounts = Record<QuestionStatus, number>

export function statusCounts(attempt: Attempt, total = 150): StatusCounts {
  const counts: StatusCounts = {
    "Not Visited": 0,
    "Not Answered": 0,
    Answered: 0,
    "Marked for Review": 0,
    "Answered & Marked": 0,
  }
  for (let n = 1; n <= total; n += 1) {
    counts[questionStatus(attempt.responses[n])] += 1
  }
  return counts
}

export function answeredCount(attempt: Attempt, total = 150): number {
  let n = 0
  for (let q = 1; q <= total; q += 1) {
    if (attempt.responses[q]?.selected) n += 1
  }
  return n
}

export function markedCount(attempt: Attempt, total = 150): number {
  let n = 0
  for (let q = 1; q <= total; q += 1) {
    if (attempt.responses[q]?.marked) n += 1
  }
  return n
}
