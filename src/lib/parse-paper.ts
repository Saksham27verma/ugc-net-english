import type { KeyEntry, Paper, PaperQuestion, PaperSection, PaperUnit } from "./types"

export const EN_DASH = "\u2013"
export const EM_DASH = "\u2014"
export const QUESTION_COUNT = 150
export const REQUIRED_PASSAGE_RANGES: [number, number][] = [
  [1, 5],
  [46, 50],
  [141, 145],
  [146, 150],
]

const SECTION_RE = new RegExp(`^# SECTION (A|B) ${EM_DASH} (.+)$`, "m")
const UNIT_RE = new RegExp(`^## (.+?) \\(Q\\.(\\d+)${EN_DASH}Q\\.(\\d+)\\)$`, "m")
const QUESTION_SPLIT_RE = /^\*\*Q\.(\d+)\*\*/m
const FIRST_QUESTION_RE = /^\*\*Q\.\d+\*\*/m
const OPTION_LINE_RE = /^([1-4])\.\s+(.+)$/
const OPTION_START_RE = /^[1-4]\.\s/m
const QUICK_KEY_RE = /(\d+):([1-4])/g
const EXPLANATION_RE = new RegExp(`^\\*\\*Q\\.(\\d+) ${EM_DASH} \\(([1-4])\\)\\*\\*\\s+(.+)$`, "gm")
export const SET_FILENAME_RE = /Practice-Set-(\d+)\.md$/i

export class PaperParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PaperParseError"
  }
}

function fail(message: string): never {
  throw new PaperParseError(message)
}

function splitWithCaptures(source: string, re: RegExp): string[] {
  return source.split(new RegExp(re.source, re.flags.includes("m") ? "m" : re.flags))
}

function parseOptions(optionBlock: string, questionNo: number, setId: number): string[] {
  const lines = optionBlock.split("\n")
  const options: string[] = []
  let i = 0
  while (i < lines.length && lines[i].trim() === "") i += 1

  for (let expected = 1; expected <= 4; expected += 1) {
    if (i >= lines.length) {
      fail(`Set ${setId} Q.${questionNo}: expected option ${expected}, reached end of block`)
    }
    const line = lines[i]
    const match = line.match(OPTION_LINE_RE)
    if (!match) {
      fail(`Set ${setId} Q.${questionNo}: expected option line ${expected}, got ${JSON.stringify(line)}`)
    }
    const label = Number(match[1])
    const text = match[2].trim()
    if (label !== expected) {
      fail(`Set ${setId} Q.${questionNo}: options must be labelled 1,2,3,4 in order (got ${label})`)
    }
    if (!text) {
      fail(`Set ${setId} Q.${questionNo}: option ${expected} is empty`)
    }
    options.push(text)
    i += 1
  }

  return options
}

function stripTrailingPaperJunk(raw: string): string {
  return raw
    .replace(/^> \*\*END OF QUESTION PAPER[\s\S]*$/m, "")
    .replace(/\n---+\s*$/g, "")
    .replace(/^---+\s*$/gm, "")
    .trim()
}

function parseQuestion(no: number, raw: string, setId: number): PaperQuestion {
  const text = stripTrailingPaperJunk(raw)
  const optionStart = text.search(OPTION_START_RE)
  if (optionStart < 0) {
    fail(`Set ${setId} Q.${no}: no option lines found`)
  }
  const stem = text.slice(0, optionStart).trim()
  if (!stem) {
    fail(`Set ${setId} Q.${no}: empty stem`)
  }
  const options = parseOptions(text.slice(optionStart), no, setId)
  return { no, stem, options }
}

function parseUnit(name: string, firstQ: number, lastQ: number, raw: string, setId: number): PaperUnit {
  const firstQuestion = raw.search(FIRST_QUESTION_RE)
  if (firstQuestion < 0) {
    fail(`Set ${setId} unit "${name}": no questions found`)
  }
  const intro = raw.slice(0, firstQuestion).trim()
  const passage = intro.length > 0 ? intro : null
  const remainder = raw.slice(firstQuestion)
  const parts = splitWithCaptures(remainder, QUESTION_SPLIT_RE)
  const questions: PaperQuestion[] = []

  if (parts[0].trim() !== "") {
    fail(`Set ${setId} unit "${name}": unexpected text before first question`)
  }

  for (let i = 1; i < parts.length; i += 2) {
    const no = Number(parts[i])
    const body = parts[i + 1] ?? ""
    questions.push(parseQuestion(no, body, setId))
  }

  const expectedCount = lastQ - firstQ + 1
  if (questions.length !== expectedCount) {
    fail(
      `Set ${setId} unit "${name}": heading range Q.${firstQ}–Q.${lastQ} implies ${expectedCount} questions, found ${questions.length}`,
    )
  }
  for (let i = 0; i < questions.length; i += 1) {
    const expected = firstQ + i
    if (questions[i].no !== expected) {
      fail(`Set ${setId} unit "${name}": expected Q.${expected}, found Q.${questions[i].no}`)
    }
  }

  return { name, firstQ, lastQ, passage, questions }
}

function parseSections(paperPart: string, setId: number): PaperSection[] {
  const parts = splitWithCaptures(paperPart, SECTION_RE)
  const sections: PaperSection[] = []

  for (let i = 1; i < parts.length; i += 3) {
    const letter = parts[i] as "A" | "B"
    const title = parts[i + 1].trim()
    const body = parts[i + 2]
    const paper = letter === "A" ? 1 : 2
    const unitParts = splitWithCaptures(body, UNIT_RE)
    const units: PaperUnit[] = []

    for (let j = 1; j < unitParts.length; j += 4) {
      const name = unitParts[j].trim()
      const firstQ = Number(unitParts[j + 1])
      const lastQ = Number(unitParts[j + 2])
      const unitBody = unitParts[j + 3]
      units.push(parseUnit(name, firstQ, lastQ, unitBody, setId))
    }

    if (units.length === 0) {
      fail(`Set ${setId} section ${letter}: no units found`)
    }
    sections.push({ paper, title, units })
  }

  if (sections.length !== 2) {
    fail(`Set ${setId}: expected exactly 2 sections, found ${sections.length}`)
  }
  if (sections[0].paper !== 1 || sections[1].paper !== 2) {
    fail(`Set ${setId}: sections must be A (Paper I) then B (Paper II)`)
  }
  return sections
}

function parseQuickKey(keyPart: string, setId: number): Map<number, 1 | 2 | 3 | 4> {
  const fence = keyPart.match(/```[^\n]*\n([\s\S]*?)```/)
  if (!fence) {
    fail(`Set ${setId}: no fenced quick-key block found`)
  }
  const pairs = [...fence[1].matchAll(QUICK_KEY_RE)]
  if (pairs.length !== QUESTION_COUNT) {
    fail(`Set ${setId}: expected ${QUESTION_COUNT} quick-key entries, found ${pairs.length}`)
  }
  const map = new Map<number, 1 | 2 | 3 | 4>()
  for (const match of pairs) {
    const no = Number(match[1])
    const answer = Number(match[2]) as 1 | 2 | 3 | 4
    if (map.has(no)) {
      fail(`Set ${setId}: duplicate quick-key entry for Q.${no}`)
    }
    map.set(no, answer)
  }
  for (let n = 1; n <= QUESTION_COUNT; n += 1) {
    if (!map.has(n)) {
      fail(`Set ${setId}: missing quick-key entry for Q.${n}`)
    }
  }
  return map
}

function parseExplanations(
  keyPart: string,
  setId: number,
): Map<number, { answer: 1 | 2 | 3 | 4; explanation: string }> {
  const matches = [...keyPart.matchAll(EXPLANATION_RE)]
  if (matches.length !== QUESTION_COUNT) {
    fail(`Set ${setId}: expected ${QUESTION_COUNT} explanations, found ${matches.length}`)
  }
  const map = new Map<number, { answer: 1 | 2 | 3 | 4; explanation: string }>()
  for (const match of matches) {
    const no = Number(match[1])
    const answer = Number(match[2]) as 1 | 2 | 3 | 4
    const explanation = match[3].trim()
    if (!explanation) {
      fail(`Set ${setId} Q.${no}: empty explanation`)
    }
    if (map.has(no)) {
      fail(`Set ${setId}: duplicate explanation for Q.${no}`)
    }
    map.set(no, { answer, explanation })
  }
  for (let n = 1; n <= QUESTION_COUNT; n += 1) {
    if (!map.has(n)) {
      fail(`Set ${setId}: missing explanation for Q.${n}`)
    }
  }
  return map
}

function assertQuestionCoverage(sections: PaperSection[], setId: number): PaperQuestion[] {
  const all: PaperQuestion[] = []
  const ranges: { name: string; firstQ: number; lastQ: number }[] = []

  for (const section of sections) {
    for (const unit of section.units) {
      ranges.push({ name: unit.name, firstQ: unit.firstQ, lastQ: unit.lastQ })
      all.push(...unit.questions)
    }
  }

  ranges.sort((a, b) => a.firstQ - b.firstQ)
  if (ranges[0].firstQ !== 1) {
    fail(`Set ${setId}: units must start at Q.1 (got Q.${ranges[0].firstQ})`)
  }
  let expected = 1
  for (const range of ranges) {
    if (range.firstQ !== expected) {
      fail(
        `Set ${setId}: unit ranges do not tile 1…${QUESTION_COUNT} (gap or overlap at Q.${expected}, next unit "${range.name}" starts at ${range.firstQ})`,
      )
    }
    if (range.lastQ < range.firstQ) {
      fail(`Set ${setId} unit "${range.name}": lastQ < firstQ`)
    }
    expected = range.lastQ + 1
  }
  if (expected !== QUESTION_COUNT + 1) {
    fail(`Set ${setId}: units end at Q.${expected - 1}, expected ${QUESTION_COUNT}`)
  }

  if (all.length !== QUESTION_COUNT) {
    fail(`Set ${setId}: expected ${QUESTION_COUNT} questions, found ${all.length}`)
  }
  const seen = new Set<number>()
  for (const q of all) {
    if (seen.has(q.no)) {
      fail(`Set ${setId}: duplicate question Q.${q.no}`)
    }
    if (q.options.length !== 4) {
      fail(`Set ${setId} Q.${q.no}: expected 4 options, found ${q.options.length}`)
    }
    seen.add(q.no)
  }
  for (let n = 1; n <= QUESTION_COUNT; n += 1) {
    if (!seen.has(n)) {
      fail(`Set ${setId}: missing question Q.${n}`)
    }
  }
  return all
}

function assertRequiredPassages(sections: PaperSection[], setId: number): void {
  const units = sections.flatMap((section) => section.units)
  for (const [firstQ, lastQ] of REQUIRED_PASSAGE_RANGES) {
    const unit = units.find((u) => u.firstQ === firstQ && u.lastQ === lastQ)
    if (!unit) {
      fail(`Set ${setId}: expected a unit covering Q.${firstQ}–Q.${lastQ} for a required passage`)
    }
    if (!unit.passage) {
      fail(`Set ${setId}: unit Q.${firstQ}–Q.${lastQ} ("${unit.name}") must have a non-empty passage`)
    }
  }
}

export type ParsedPaper = {
  paper: Paper
  key: Record<string, KeyEntry>
  distribution: Record<1 | 2 | 3 | 4, number>
}

export function setIdFromFilename(fileName: string): number | null {
  const match = fileName.match(SET_FILENAME_RE)
  return match ? Number(match[1]) : null
}

export function parseMarkdownPaper(source: string, setId: number): ParsedPaper {
  if (!Number.isInteger(setId) || setId < 1) {
    fail(`Set id must be a positive integer (got ${setId})`)
  }
  const parts = source.split(/^# ANSWER KEY/m)
  if (parts.length !== 2) {
    fail(`Set ${setId}: expected exactly one "# ANSWER KEY" split, found ${parts.length - 1}`)
  }
  const [paperPart, keyPart] = parts
  const titleMatch = paperPart.match(/^# (.+)$/m)
  if (!titleMatch) {
    fail(`Set ${setId}: missing paper title heading`)
  }
  const title = titleMatch[1].replace(/\*\*/g, "").trim()
  const sections = parseSections(paperPart, setId)
  assertQuestionCoverage(sections, setId)
  assertRequiredPassages(sections, setId)

  const quickKey = parseQuickKey(keyPart, setId)
  const explanations = parseExplanations(keyPart, setId)

  const key: Record<string, KeyEntry> = {}
  const distribution: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  for (let n = 1; n <= QUESTION_COUNT; n += 1) {
    const quick = quickKey.get(n)
    const explained = explanations.get(n)
    if (!quick || !explained) {
      fail(`Set ${setId}: missing key material for Q.${n}`)
    }
    if (explained.answer !== quick) {
      fail(
        `Set ${setId} Q.${n}: explanation answer (${explained.answer}) does not match quick key (${quick})`,
      )
    }
    key[String(n)] = { answer: quick, explanation: explained.explanation }
    distribution[quick] += 1
  }

  const paper: Paper = {
    setId,
    title,
    durationMinutes: 180,
    marksPerCorrect: 2,
    sections,
  }

  const paperJson = JSON.stringify(paper)
  if (/"answer"\s*:/.test(paperJson) || /"explanation"\s*:/.test(paperJson)) {
    fail(`Set ${setId}: paper JSON must not contain answers or explanations`)
  }

  return { paper, key, distribution }
}

export function printVerify(paper: Paper, distribution: Record<1 | 2 | 3 | 4, number>): void {
  console.log(`\n=== SET ${paper.setId} ===`)
  console.log(paper.title)
  console.log("")
  console.log("Unit                                              Qs   Range")
  console.log("-".repeat(64))
  for (const section of paper.sections) {
    console.log(`Paper ${section.paper === 1 ? "I" : "II"} — ${section.title}`)
    for (const unit of section.units) {
      const count = unit.lastQ - unit.firstQ + 1
      const name = unit.name.padEnd(46)
      console.log(`${name} ${String(count).padStart(3)}   Q.${unit.firstQ}–Q.${unit.lastQ}`)
    }
  }
  console.log("-".repeat(64))
  console.log(
    `Answer distribution:  1=${distribution[1]}  2=${distribution[2]}  3=${distribution[3]}  4=${distribution[4]}`,
  )
}
