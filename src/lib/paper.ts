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

export function firstUnansweredInSection(paper: Paper, paperNo: 1 | 2, selected: (n: number) => boolean): number {
  const section = paper.sections.find((s) => s.paper === paperNo)
  if (!section) return paperNo === 1 ? 1 : 51
  for (const unit of section.units) {
    for (const q of unit.questions) {
      if (!selected(q.no)) return q.no
    }
  }
  return section.units[0]?.firstQ ?? (paperNo === 1 ? 1 : 51)
}

export function paperShortTitle(paper: { setId: number }): string {
  return `UGC NET English — Set ${paper.setId}`
}
