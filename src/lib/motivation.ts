export type ComebackInfo = {
  dayKey: string
  grantedAt: number
}

export type WeeklyRecap = {
  weekKey: string
  thisWeekDays: number
  lastWeekDays: number
  questions: number
  accuracy: number
  units: Array<{
    unit: string
    attempted: number
    correct: number
    accuracy: number
  }>
  weakest: string | null
  streakNow: number
  streakThen: number
}
