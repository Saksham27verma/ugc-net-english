import { dayKey, shiftDayKey } from "./streak"

export const EXAM_DATE = process.env.EXAM_DATE ?? "2026-12-20"

/** Whole days from today (Asia/Kolkata) to the exam date. Negative after it. */
export function daysUntilExam(now = Date.now(), examDate = EXAM_DATE): number {
  const today = dayKey(now)
  let days = 0
  if (examDate >= today) {
    let cursor = today
    while (cursor < examDate && days < 4000) {
      cursor = shiftDayKey(cursor, 1)
      days += 1
    }
    return days
  }
  let cursor = examDate
  while (cursor < today && days < 4000) {
    cursor = shiftDayKey(cursor, 1)
    days += 1
  }
  return -days
}
