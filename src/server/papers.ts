import "server-only"
import type { KeyFile, Paper, PaperSummary, Result } from "@/lib/types"
import { ensureSchema, hasDatabase } from "./db"

function requireDatabase(): void {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not set. Papers are loaded from Neon.")
  }
}

function asPaper(raw: unknown, setId: number): Paper {
  const paper = raw as Paper
  if (!paper || paper.setId !== setId || paper.durationMinutes !== 180) {
    throw new Error(`Stored paper for set ${setId} is invalid`)
  }
  return paper
}

export async function listPapers(): Promise<PaperSummary[]> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT set_id, title, duration_minutes, updated_at
    FROM papers
    ORDER BY set_id
  `
  return rows.map((row) => ({
    setId: Number(row.set_id),
    title: String(row.title),
    durationMinutes: 180 as const,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }))
}

export async function getPaperFromStore(setId: number): Promise<Paper | undefined> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`SELECT paper FROM papers WHERE set_id = ${setId} LIMIT 1`
  if (rows.length === 0) return undefined
  return asPaper(rows[0].paper, setId)
}

export async function paperExists(setId: number): Promise<boolean> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`SELECT 1 FROM papers WHERE set_id = ${setId} LIMIT 1`
  return rows.length > 0
}

export async function nextSetId(): Promise<number> {
  requireDatabase()
  const sql = await ensureSchema()
  const rows = await sql`SELECT COALESCE(MAX(set_id), 0) AS max FROM papers`
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
      INSERT INTO papers (set_id, title, duration_minutes, marks_per_correct, paper, source_filename, updated_at)
      VALUES (
        ${paper.setId},
        ${paper.title},
        ${paper.durationMinutes},
        ${paper.marksPerCorrect},
        ${paper},
        ${sourceFilename},
        now()
      )
      ON CONFLICT (set_id) DO UPDATE SET
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
