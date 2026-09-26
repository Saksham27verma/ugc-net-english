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
  await sql`
    CREATE TABLE IF NOT EXISTS voucher_state (
      learner_id text NOT NULL,
      milestone integer NOT NULL,
      status text NOT NULL DEFAULT 'locked',
      earned_at timestamptz,
      revealed_at timestamptz,
      claimed_at timestamptz,
      redeemed_at timestamptz,
      wish text,
      PRIMARY KEY (learner_id, milestone),
      CONSTRAINT voucher_state_status_check
        CHECK (status IN ('locked', 'ready', 'revealed', 'claimed', 'redeemed'))
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS freeze_uses (
      learner_id text NOT NULL,
      day_key text NOT NULL,
      month text NOT NULL,
      source text NOT NULL,
      consumed_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (learner_id, day_key),
      CONSTRAINT freeze_uses_source_check
        CHECK (source IN ('monthly', 'credit'))
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS freeze_credits (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      learner_id text NOT NULL,
      reason text NOT NULL,
      granted_at timestamptz NOT NULL DEFAULT now(),
      consumed_day_key text
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS freeze_credits_learner_idx
      ON freeze_credits (learner_id, consumed_day_key)
  `
  await sql`
    CREATE TABLE IF NOT EXISTS comeback_awards (
      learner_id text NOT NULL,
      day_key text NOT NULL,
      granted_at timestamptz NOT NULL DEFAULT now(),
      dismissed_at timestamptz,
      PRIMARY KEY (learner_id, day_key)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS notes_shown (
      learner_id text NOT NULL,
      day_key text NOT NULL,
      note_index integer NOT NULL,
      PRIMARY KEY (learner_id, day_key)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS recap_seen (
      learner_id text NOT NULL,
      week_key text NOT NULL,
      seen_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (learner_id, week_key)
    )
  `
}
