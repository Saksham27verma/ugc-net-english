import type { NeonQueryFunction } from "@neondatabase/serverless"

type Sql = NeonQueryFunction<false, false>

export async function migrate(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS papers (
      set_id integer PRIMARY KEY,
      title text NOT NULL,
      duration_minutes integer NOT NULL DEFAULT 180,
      marks_per_correct integer NOT NULL DEFAULT 2,
      paper jsonb NOT NULL,
      source_filename text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS answer_keys (
      set_id integer PRIMARY KEY REFERENCES papers(set_id) ON DELETE CASCADE,
      key jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS attempts (
      id uuid PRIMARY KEY,
      visitor_id text NOT NULL,
      set_id integer NOT NULL REFERENCES papers(set_id),
      result jsonb NOT NULL,
      submitted_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS attempts_visitor_submitted_idx
      ON attempts (visitor_id, submitted_at DESC)
  `
}
