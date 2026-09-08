export function bandFor(score: number): string {
  if (score >= 240) return "JRF-competitive range"
  if (score >= 200) return "Comfortably above typical qualifying cut-off"
  if (score >= 160) return "Borderline — revise the weak units"
  return "Foundation-building needed"
}

export const CUT_OFF_NOTE =
  "Actual cut-offs vary by session and category. These bands are working targets, not official thresholds."
