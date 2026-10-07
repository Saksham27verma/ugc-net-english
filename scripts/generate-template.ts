import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { EM_DASH, EN_DASH } from "../src/lib/parse-paper"

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)))

type UnitSpec = {
  name: string
  firstQ: number
  lastQ: number
  passage?: string
}

const PAPER_I_UNITS: UnitSpec[] = [
  {
    name: "Comprehension — Data Interpretation",
    firstQ: 1,
    lastQ: 5,
    passage: [
      "**Study the table carefully and answer the questions that follow.**",
      "",
      "Replace this passage for Q.1–Q.5. Keep any table or chart in Markdown.",
      "",
      "| Item | Value |",
      "|---|---|",
      "| A | 10 |",
      "| B | 20 |",
    ].join("\n"),
  },
  { name: "Teaching Aptitude", firstQ: 6, lastQ: 10 },
  { name: "Research Aptitude", firstQ: 11, lastQ: 15 },
  { name: "Communication", firstQ: 16, lastQ: 20 },
  { name: "Mathematical Reasoning and Aptitude", firstQ: 21, lastQ: 25 },
  { name: "Logical Reasoning", firstQ: 26, lastQ: 30 },
  { name: "Information and Communication Technology", firstQ: 31, lastQ: 35 },
  { name: "People, Development and Environment", firstQ: 36, lastQ: 40 },
  { name: "Higher Education System", firstQ: 41, lastQ: 45 },
  {
    name: "Comprehension",
    firstQ: 46,
    lastQ: 50,
    passage: [
      "**Read the passage and answer the questions that follow.**",
      "",
      "Replace this Paper I comprehension passage for Q.46–Q.50.",
    ].join("\n"),
  },
]

const PAPER_II_UNITS: UnitSpec[] = [
  { name: "Drama", firstQ: 51, lastQ: 58 },
  { name: "Poetry", firstQ: 59, lastQ: 66 },
  { name: "Fiction and Short Story", firstQ: 67, lastQ: 74 },
  { name: "Non-Fictional Prose", firstQ: 75, lastQ: 80 },
  { name: "Language: Basic Concepts, Theories and Pedagogy", firstQ: 81, lastQ: 90 },
  { name: "English in India: History, Evolution and Futures", firstQ: 91, lastQ: 98 },
  { name: "Cultural Studies", firstQ: 99, lastQ: 105 },
  { name: "Literary Criticism", firstQ: 106, lastQ: 115 },
  { name: "Literary Theory Post World War II", firstQ: 116, lastQ: 125 },
  { name: "Research Methods and Materials in English", firstQ: 126, lastQ: 131 },
  { name: "American and Other Non-British Literatures", firstQ: 132, lastQ: 140 },
  {
    name: "Comprehension — Verse",
    firstQ: 141,
    lastQ: 145,
    passage: [
      "**Read the verse passage and answer the questions that follow.**",
      "",
      "Replace this verse passage for Q.141–Q.145.",
    ].join("\n"),
  },
  {
    name: "Comprehension — Prose",
    firstQ: 146,
    lastQ: 150,
    passage: [
      "**Read the prose passage and answer the questions that follow.**",
      "",
      "Replace this prose passage for Q.146–Q.150.",
    ].join("\n"),
  },
]

function unitHeading(unit: UnitSpec): string {
  return `## ${unit.name} (Q.${unit.firstQ}${EN_DASH}Q.${unit.lastQ})`
}

function questionBlock(no: number, unitName: string): string {
  return [
    `**Q.${no}** Replace this stem for ${unitName} Q.${no}.`,
    "1. Option A",
    "2. Option B",
    "3. Option C",
    "4. Option D",
  ].join("\n")
}

function renderUnits(units: UnitSpec[]): string {
  return units
    .map((unit) => {
      const questions = []
      for (let n = unit.firstQ; n <= unit.lastQ; n += 1) {
        questions.push(questionBlock(n, unit.name))
      }
      const body = unit.passage ? `${unit.passage}\n\n${questions.join("\n\n")}` : questions.join("\n\n")
      return `${unitHeading(unit)}\n\n${body}`
    })
    .join("\n\n---\n\n")
}

function quickKey(count: number): string {
  const pairs: string[] = []
  for (let n = 1; n <= count; n += 1) {
    pairs.push(`${n}:1`)
  }
  const lines: string[] = []
  for (let i = 0; i < pairs.length; i += 10) {
    lines.push(pairs.slice(i, i + 10).join("  "))
  }
  return lines.join("\n")
}

function explanations(count: number): string {
  const lines: string[] = []
  for (let n = 1; n <= count; n += 1) {
    lines.push(`**Q.${n} ${EM_DASH} (1)** Replace this explanation for Q.${n}.`)
  }
  return lines.join("\n\n")
}

function build(): string {
  const guide = `<!--
UGC NET English — Markdown paper template
=========================================
Rename this file to UGC-NET-English-Practice-Set-N.md (N = set number) or enter
the set number on the admin upload form.

Required shape (the importer rejects anything else):
- UTF-8 Markdown
- Exactly 150 questions, each with four options labelled 1. 2. 3. 4. in that order
- Two sections, in this order, using an em dash (—):
  # SECTION A — PAPER I : GENERAL APTITUDE (Q.1–Q.50)
  # SECTION B — PAPER II : ENGLISH (Q.51–Q.150)
- Unit headings must use an en dash (–) in the range: ## Unit name (Q.6–Q.10)
- Unit ranges must tile 1…150 with no gaps or overlaps
- These units MUST include a passage (any Markdown before the first **Q.n**):
  Q.1–Q.5, Q.46–Q.50, Q.141–Q.145, Q.146–Q.150
- One "# ANSWER KEY" heading, then a fenced quick-key of 150 pairs n:1-4
- Then 150 explanation lines exactly like:
  **Q.1 — (3)** explanation text…
  The number in parentheses must match the quick key
- Do not put answers or explanations in the question section

Replace every “Replace this …” placeholder before uploading.
-->

`
  return (
    guide +
    [
      "# UGC NET — ENGLISH (Subject Code 30) — FULL-LENGTH PRACTICE PAPER : **SET N**",
      "",
      "| | |",
      "|---|---|",
      "| **Total Questions** | 150 (all compulsory) |",
      "| **Structure** | Q.1–Q.50 → Paper I (General Aptitude) • Q.51–Q.150 → Paper II (English) |",
      "| **Marks** | 2 marks per correct answer • **Maximum Marks: 300** |",
      "| **Negative Marking** | Nil |",
      "| **Duration** | **180 minutes (3 hours)** — single continuous session |",
      "| **Question Type** | MCQ with four options; exactly one correct answer |",
      "",
      "### Instructions",
      "1. Replace the title SET N with the real set number.",
      "2. Replace every placeholder stem, option, passage, and explanation.",
      "3. Keep the heading punctuation: section headings use —, unit ranges use –.",
      "4. Keep exactly 150 questions and 150 matching key/explanation pairs.",
      "",
      "---",
      "",
      `# SECTION A ${EM_DASH} PAPER I : GENERAL APTITUDE (Q.1${EN_DASH}Q.50)`,
      "",
      renderUnits(PAPER_I_UNITS),
      "",
      "---",
      "",
      `# SECTION B ${EM_DASH} PAPER II : ENGLISH (Q.51${EN_DASH}Q.150)`,
      "",
      renderUnits(PAPER_II_UNITS),
      "",
      "> **END OF QUESTION PAPER**",
      "",
      "---",
      "",
      "# ANSWER KEY",
      "",
      "```",
      quickKey(150),
      "```",
      "",
      "### Score interpretation (out of 300)",
      "",
      "| Score | Band |",
      "|---|---|",
      "| 240+ | JRF-competitive range |",
      "| 200–238 | Comfortably above typical qualifying cut-off |",
      "| 160–198 | Borderline; revise weak units |",
      "| Below 160 | Foundation-building needed |",
      "",
      "---",
      "",
      "## Explanations — Paper I",
      "",
      explanations(150)
        .split("\n\n")
        .slice(0, 50)
        .join("\n\n"),
      "",
      "## Explanations — Paper II (English)",
      "",
      explanations(150).split("\n\n").slice(50).join("\n\n"),
      "",
    ].join("\n")
  )
}

const UPPSC_PAPER_I: UnitSpec[] = [
  { name: "Paper I — Unit 1", firstQ: 1, lastQ: 5 },
  { name: "Paper I — Unit 2", firstQ: 6, lastQ: 10 },
  { name: "Paper I — Unit 3", firstQ: 11, lastQ: 15 },
  { name: "Paper I — Unit 4", firstQ: 16, lastQ: 20 },
  { name: "Paper I — Unit 5", firstQ: 21, lastQ: 25 },
  { name: "Paper I — Unit 6", firstQ: 26, lastQ: 30 },
]

const UPPSC_PAPER_II: UnitSpec[] = [
  { name: "Paper II — Unit 1", firstQ: 31, lastQ: 40 },
  { name: "Paper II — Unit 2", firstQ: 41, lastQ: 50 },
  { name: "Paper II — Unit 3", firstQ: 51, lastQ: 60 },
  { name: "Paper II — Unit 4", firstQ: 61, lastQ: 70 },
  { name: "Paper II — Unit 5", firstQ: 71, lastQ: 80 },
  { name: "Paper II — Unit 6", firstQ: 81, lastQ: 90 },
  { name: "Paper II — Unit 7", firstQ: 91, lastQ: 100 },
  { name: "Paper II — Unit 8", firstQ: 101, lastQ: 110 },
  { name: "Paper II — Unit 9", firstQ: 111, lastQ: 120 },
]

function buildUppsc(): string {
  const guide = `<!--
UPPSC Assistant Professor — Markdown paper template
====================================================
Rename this file to UPPSC-Assistant-Professor-Practice-Set-N.md (N = set number)
or choose UPPSC and enter the set number on the admin upload form.

Required shape (the importer rejects anything else):
- UTF-8 Markdown
- Exactly 120 questions, each with four options labelled 1. 2. 3. 4. in that order
- Two sections, in this order, using an em dash (—):
  # SECTION A — PAPER I : GENERAL STUDIES (Q.1–Q.30)
  # SECTION B — PAPER II : SUBJECT (Q.31–Q.120)
- Unit headings must use an en dash (–) in the range: ## Unit name (Q.1–Q.5)
- Unit ranges must tile 1…120 with no gaps or overlaps
- Paper I must be exactly Q.1–Q.30. Paper II must be exactly Q.31–Q.120
- Passages are optional. Put any Markdown before the first **Q.n** of a unit
- One "# ANSWER KEY" heading, then a fenced quick-key of 120 pairs n:1-4
- Then 120 explanation lines exactly like:
  **Q.1 — (3)** explanation text…
  The number in parentheses must match the quick key
- Do not put answers or explanations in the question section
- Rename or split the placeholder units. Keep the 30 / 90 split

Replace every “Replace this …” placeholder before uploading.
-->

`
  const explained = explanations(120).split("\n\n")
  return (
    guide +
    [
      "# UPPSC — ASSISTANT PROFESSOR — FULL-LENGTH PRACTICE PAPER : **SET N**",
      "",
      "| | |",
      "|---|---|",
      "| **Total Questions** | 120 (all compulsory) |",
      "| **Structure** | Q.1–Q.30 → Paper I • Q.31–Q.120 → Paper II |",
      "| **Marks** | +3 per correct answer • −1 per wrong answer • **Maximum Marks: 360** |",
      "| **Negative Marking** | −1 for each wrong answer • unattempted scores 0 |",
      "| **Duration** | **120 minutes** — single continuous session |",
      "| **Question Type** | MCQ with four options; exactly one correct answer |",
      "",
      "### Instructions",
      "1. Replace the title SET N with the real set number.",
      "2. Replace every placeholder stem, option, and explanation.",
      "3. Keep the heading punctuation: section headings use —, unit ranges use –.",
      "4. Keep exactly 120 questions and 120 matching key/explanation pairs.",
      "5. You can rename units and change their ranges, as long as Paper I stays Q.1–Q.30 and Paper II stays Q.31–Q.120.",
      "",
      "---",
      "",
      `# SECTION A ${EM_DASH} PAPER I : GENERAL STUDIES (Q.1${EN_DASH}Q.30)`,
      "",
      renderUnits(UPPSC_PAPER_I),
      "",
      "---",
      "",
      `# SECTION B ${EM_DASH} PAPER II : SUBJECT (Q.31${EN_DASH}Q.120)`,
      "",
      renderUnits(UPPSC_PAPER_II),
      "",
      "> **END OF QUESTION PAPER**",
      "",
      "---",
      "",
      "# ANSWER KEY",
      "",
      "```",
      quickKey(120),
      "```",
      "",
      "### Score interpretation (out of 360)",
      "",
      "| Score | Band |",
      "|---|---|",
      "| 252+ | Strong range |",
      "| 198–251 | Competitive range |",
      "| 144–197 | Borderline; revise weak units |",
      "| Below 144 | Foundation-building needed |",
      "",
      "---",
      "",
      "## Explanations — Paper I",
      "",
      explained.slice(0, 30).join("\n\n"),
      "",
      "## Explanations — Paper II",
      "",
      explained.slice(30).join("\n\n"),
      "",
    ].join("\n")
  )
}

function main(): void {
  const targetDir = join(ROOT, "public/templates")
  mkdirSync(targetDir, { recursive: true })
  const ugc = join(targetDir, "UGC-NET-English-Practice-Set-TEMPLATE.md")
  const uppsc = join(targetDir, "UPPSC-Assistant-Professor-Practice-Set-TEMPLATE.md")
  writeFileSync(ugc, build(), "utf8")
  writeFileSync(uppsc, buildUppsc(), "utf8")
  console.log(`Wrote ${ugc}`)
  console.log(`Wrote ${uppsc}`)
}

main()
