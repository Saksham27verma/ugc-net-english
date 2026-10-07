import { EXAMS, type ExamId } from "./exams"
import type { Paper, PaperQuestion, PaperSection, PaperUnit } from "./types"

export type LocatedQuestion = {
  question: PaperQuestion
  unit: PaperUnit
  section: PaperSection
}

export function locateQuestion(paper: Paper, no: number): LocatedQuestion | null {
  for (const section of paper.sections) {
    for (const unit of section.units) {
      const question = unit.questions.find((q) => q.no === no)
      if (question) return { question, unit, section }
    }
  }
  return null
}

export function sectionRange(paper: Paper, paperNo: 1 | 2): { start: number; end: number } {
  const section = paper.sections.find((item) => item.paper === paperNo)
  const first = section?.units[0]?.firstQ
  const lastUnit = section?.units[section.units.length - 1]
  if (first && lastUnit) return { start: first, end: lastUnit.lastQ }
  const profile = EXAMS[paper.exam ?? "ugc-net"]
  if (paperNo === 1) return { start: 1, end: profile.paper1Count }
  return { start: profile.paper1Count + 1, end: profile.questionCount }
}

export function questionTotal(paper: Paper): number {
  return sectionRange(paper, 2).end
}

export function firstUnansweredInSection(paper: Paper, paperNo: 1 | 2, selected: (n: number) => boolean): number {
  const fallback = sectionRange(paper, paperNo).start
  const section = paper.sections.find((item) => item.paper === paperNo)
  if (!section) return fallback
  for (const unit of section.units) {
    for (const q of unit.questions) {
      if (!selected(q.no)) return q.no
    }
  }
  return section.units[0]?.firstQ ?? fallback
}

export function paperShortTitle(paper: { setId: number; exam?: ExamId; setNumber?: number }): string {
  const exam = paper.exam ?? "ugc-net"
  const setNumber = paper.setNumber ?? paper.setId
  return `${EXAMS[exam].label} · Set ${setNumber}`
}
