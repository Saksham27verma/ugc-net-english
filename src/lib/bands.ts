import type { ExamId } from "./exams"

export function bandFor(score: number, exam: ExamId = "ugc-net"): string {
  if (exam === "uppsc") {
    if (score >= 252) return "Strong range"
    if (score >= 198) return "Competitive range"
    if (score >= 144) return "Borderline — revise the weak units"
    return "Foundation-building needed"
  }
  if (score >= 240) return "JRF-competitive range"
  if (score >= 200) return "Comfortably above typical qualifying cut-off"
  if (score >= 160) return "Borderline — revise the weak units"
  return "Foundation-building needed"
}

export const CUT_OFF_NOTE =
  "Actual cut-offs vary by session and category. These bands are working targets, not official thresholds."
