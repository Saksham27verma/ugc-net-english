import type { ExamId } from "./exams"

export type Selected = 1 | 2 | 3 | 4 | null

export type QuestionStatus =
  | "Not Visited"
  | "Not Answered"
  | "Answered"
  | "Marked for Review"
  | "Answered & Marked"

export type PaperQuestion = {
  no: number
  stem: string
  options: string[]
}

export type PaperUnit = {
  name: string
  firstQ: number
  lastQ: number
  passage: string | null
  questions: PaperQuestion[]
}

export type PaperSection = {
  paper: 1 | 2
  title: string
  units: PaperUnit[]
}

export type Paper = {
  setId: number
  exam: ExamId
  setNumber: number
  title: string
  durationMinutes: number
  marksPerCorrect: number
  marksPerWrong: number
  sections: PaperSection[]
}

export type PaperSummary = {
  setId: number
  exam: ExamId
  setNumber: number
  title: string
  durationMinutes: number
  marksPerCorrect: number
  marksPerWrong: number
  questionCount: number
  maxMarks: number
  updatedAt?: string
}

export type KeyEntry = {
  answer: 1 | 2 | 3 | 4
  explanation: string
}

export type KeyFile = Record<string, KeyEntry>

export type AttemptResponse = {
  selected: Selected
  marked: boolean
  visited: boolean
  timeSpentMs: number
}

export type Attempt = {
  id: string
  setId: number
  startedAt: number
  durationMs: number
  responses: Record<number, AttemptResponse>
  submittedAt: number | null
}

export type ResultUnit = {
  unit: string
  paper: 1 | 2
  total: number
  attempted: number
  correct: number
  marks: number
}

export type ResultQuestion = {
  no: number
  selected: Selected
  answer: number
  correct: boolean
  marked: boolean
  explanation: string
}

export type Result = {
  attemptId: string
  setId: number
  exam?: ExamId
  setNumber?: number
  maxMarks?: number
  paper1Max?: number
  paper2Max?: number
  durationMinutes?: number
  total: number
  paper1: number
  paper2: number
  attempted: number
  correct: number
  wrong: number
  unattempted: number
  accuracy: number
  band: string
  byUnit: ResultUnit[]
  perQuestion: ResultQuestion[]
  submittedAt: number
  elapsedMs: number
  overtimeMs: number
}
