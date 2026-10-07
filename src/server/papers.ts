import "server-only"
import { EXAMS, isExamId, type ExamId } from "@/lib/exams"
import type { KeyFile, Paper, PaperSummary, Result } from "@/lib/types"
import { ensureSchema, hasDatabase } from "./db"

function requireDatabase(): void {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not set. Papers are loaded from Neon.")
  }
}

function asExam(value: unknown): ExamId {
  return isExamId(value) ? value : "ugc-net"
}

type DbRow = Record<string, unknown>

function asPaper(raw: unknown, row: DbRow): Paper {
  const paper = raw as Paper
  const setId = Number(row.set_id)
  const exam = asExam(row.exam ?? paper?.exam)
  const profile = EXAMS[exam]
  if (!paper || !Array.isArray(paper.sections)) {
    throw new Error(`Stored paper for set ${setId} is invalid`)
  }
  const durationMinutes = Number(row.duration_minutes ?? paper.durationMinutes)
  const marksPerCorrect = Number(row.marks_per_correct ?? paper.marksPerCorrect)
  if (durationMinutes !== profile.durationMinutes || marksPerCorrect !== profile.marksPerCorrect) {
    throw new Error(`Stored paper for set ${setId} is invalid`)
  }
  return {
    ...paper,
    setId,
    exam,
    setNumber: Number(row.set_number ?? paper.setNumber ?? setId),
    durationMinutes,
    marksPerCorrect,
    marksPerWrong: paper.marksPerWrong ?? profile.marksPerWrong,
  }
}

function summaryFromRow(row: DbRow): PaperSummary {
  const exam = asExam(row.exam)
  const profile = EXAMS[exam]
  return {
    setId: Number(row.set_id),
    exam,
    setNumber: Number(row.set_number),
    title: String(row.title),
    durationMinutes: Number(row.duration_minutes),
    marksPerCorrect: Number(row.marks_per_correct),
    marksPerWrong: profile.marksPerWrong,
    questionCount: profile.questionCount,
    maxMarks: profile.maxMarks,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

export async function listPapers(): Promise<PaperSummary[]> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT set_id, exam, set_number, title, duration_minutes, marks_per_correct, updated_at
    FROM papers
    ORDER BY exam, set_number
  `
  return rows.map((row) => summaryFromRow(row))
}

export async function getPaperFromStore(setId: number): Promise<Paper | undefined> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT set_id, exam, set_number, duration_minutes, marks_per_correct, paper
    FROM papers
    WHERE set_id = ${setId}
    LIMIT 1
  `
  if (rows.length === 0) return undefined
  return asPaper(rows[0].paper, rows[0])
}

export async function findSetId(exam: ExamId, setNumber: number): Promise<number | null> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT set_id FROM papers
    WHERE exam = ${exam} AND set_number = ${setNumber}
    LIMIT 1
  `
  if (rows.length === 0) return null
  return Number(rows[0].set_id)
}

export async function nextSetId(): Promise<number> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`SELECT COALESCE(MAX(set_id), 0) AS max FROM papers`
  return Number(rows[0]?.max ?? 0) + 1
}

export async function nextSetNumber(exam: ExamId): Promise<number> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT COALESCE(MAX(set_number), 0) AS max FROM papers WHERE exam = ${exam}
  `
  return Number(rows[0]?.max ?? 0) + 1
}

export async function upsertPaper(input: {
  paper: Paper
  key: KeyFile
  sourceFilename: string | null
}): Promise<void> {
  const sql = await ensureSchema()
  const { paper, key, sourceFilename } = input
  await sql.transaction((txn) => [
    txn`
      INSERT INTO papers (
        set_id, exam, set_number, title, duration_minutes, marks_per_correct, paper, source_filename, updated_at
      )
      VALUES (
        ${paper.setId},
        ${paper.exam},
        ${paper.setNumber},
        ${paper.title},
        ${paper.durationMinutes},
        ${paper.marksPerCorrect},
        ${paper},
        ${sourceFilename},
        now()
      )
      ON CONFLICT (set_id) DO UPDATE SET
        exam = EXCLUDED.exam,
        set_number = EXCLUDED.set_number,
        title = EXCLUDED.title,
        duration_minutes = EXCLUDED.duration_minutes,
        marks_per_correct = EXCLUDED.marks_per_correct,
        paper = EXCLUDED.paper,
        source_filename = EXCLUDED.source_filename,
        updated_at = now()
    `,
    txn`
      INSERT INTO answer_keys (set_id, key, updated_at)
      VALUES (${paper.setId}, ${key}, now())
      ON CONFLICT (set_id) DO UPDATE SET
        key = EXCLUDED.key,
        updated_at = now()
    `,
  ])
}

export async function loadKeyFromStore(setId: number): Promise<KeyFile> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`SELECT key FROM answer_keys WHERE set_id = ${setId} LIMIT 1`
  if (rows.length === 0) {
    throw new Error(`Unknown set ${setId}`)
  }
  return rows[0].key as KeyFile
}

function asResult(raw: unknown): Result | undefined {
  const result = raw as Result
  if (!result?.attemptId || !result.setId || !Array.isArray(result.perQuestion)) {
    return undefined
  }
  return result
}

export async function saveAttemptResult(result: Result): Promise<void> {
  requireDatabase()
  const sql = await ensureSchema()
  await sql`
    INSERT INTO attempts (id, visitor_id, set_id, result, submitted_at)
    VALUES (
      ${result.attemptId}::uuid,
      ${"shared"},
      ${result.setId},
      ${result},
      to_timestamp(${result.submittedAt / 1000.0})
    )
    ON CONFLICT (id) DO UPDATE SET
      result = EXCLUDED.result,
      submitted_at = EXCLUDED.submitted_at
  `
}

export async function listAttemptResults(): Promise<Result[]> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT result
    FROM attempts
    ORDER BY submitted_at DESC
    LIMIT 200
  `
  return rows.flatMap((row) => {
    const result = asResult(row.result)
    return result ? [result] : []
  })
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function getAttemptResult(attemptId: string): Promise<Result | undefined> {
  if (!UUID_RE.test(attemptId)) return undefined
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT result
    FROM attempts
    WHERE id = ${attemptId}::uuid
    LIMIT 1
  `
  if (rows.length === 0) return undefined
  return asResult(rows[0].result)
}
