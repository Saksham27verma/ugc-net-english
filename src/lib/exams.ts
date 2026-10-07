export type ExamId = "ugc-net" | "uppsc"

export type ExamProfile = {
  id: ExamId
  label: string
  questionCount: number
  paper1Count: number
  paper2Count: number
  durationMinutes: number
  marksPerCorrect: number
  marksPerWrong: number
  maxMarks: number
  paper1Max: number
  paper2Max: number
  requiredPassages: [number, number][]
}

export const EXAMS: Record<ExamId, ExamProfile> = {
  "ugc-net": {
    id: "ugc-net",
    label: "UGC NET",
    questionCount: 150,
    paper1Count: 50,
    paper2Count: 100,
    durationMinutes: 180,
    marksPerCorrect: 2,
    marksPerWrong: 0,
    maxMarks: 300,
    paper1Max: 100,
    paper2Max: 200,
    requiredPassages: [
      [1, 5],
      [46, 50],
      [141, 145],
      [146, 150],
    ],
  },
  uppsc: {
    id: "uppsc",
    label: "UPPSC",
    questionCount: 120,
    paper1Count: 30,
    paper2Count: 90,
    durationMinutes: 120,
    marksPerCorrect: 3,
    marksPerWrong: 1,
    maxMarks: 360,
    paper1Max: 90,
    paper2Max: 270,
    requiredPassages: [],
  },
}

export function isExamId(value: unknown): value is ExamId {
  return value === "ugc-net" || value === "uppsc"
}

export function examProfile(id: ExamId): ExamProfile {
  return EXAMS[id]
}

export type ResultFacts = {
  exam: ExamId
  label: string
  setNumber: number
  maxMarks: number
  paper1Max: number
  paper2Max: number
  durationMinutes: number
}

export function resultFacts(result: {
  exam?: ExamId
  setNumber?: number
  setId: number
  maxMarks?: number
  paper1Max?: number
  paper2Max?: number
  durationMinutes?: number
}): ResultFacts {
  const exam = isExamId(result.exam) ? result.exam : "ugc-net"
  const profile = EXAMS[exam]
  return {
    exam,
    label: profile.label,
    setNumber: result.setNumber ?? result.setId,
    maxMarks: result.maxMarks ?? profile.maxMarks,
    paper1Max: result.paper1Max ?? profile.paper1Max,
    paper2Max: result.paper2Max ?? profile.paper2Max,
    durationMinutes: result.durationMinutes ?? profile.durationMinutes,
  }
}

export function markingLine(marksPerCorrect: number, marksPerWrong: number): string {
  if (marksPerWrong > 0) {
    return `+${marksPerCorrect} / −${marksPerWrong}`
  }
  return `+${marksPerCorrect} · no negative marking`
}
