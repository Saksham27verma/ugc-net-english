import "server-only"
import { MILESTONES, voucherNumber, type VoucherPublic, type VoucherStatus } from "@/lib/vouchers"
import { ensureSchema, hasDatabase } from "./db"
import { LEARNER_ID } from "./learner"

function asMillis(value: unknown): number | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function lockedLadder(): VoucherPublic[] {
  return MILESTONES.map((milestone) => ({
    milestone,
    number: voucherNumber(milestone),
    status: "locked" as VoucherStatus,
    earnedAt: null,
    revealedAt: null,
    claimedAt: null,
    redeemedAt: null,
    wish: null,
  }))
}

/**
 * Creates any missing rows and promotes every milestone she has reached from
 * `locked` to `ready`. The WHERE on the conflict clause is what makes this
 * idempotent: a voucher that is already ready, revealed, claimed or redeemed
 * is left exactly as it is, so a broken streak can never take one back.
 */
export async function syncVouchers(currentStreak: number): Promise<VoucherPublic[]> {
  if (!hasDatabase()) return lockedLadder()
  const sql = await ensureSchema()
  // Drop retired milestones (e.g. the old 100-day row) so the ladder matches MILESTONES.
  await sql`
    DELETE FROM voucher_state
    WHERE learner_id = ${LEARNER_ID}
      AND NOT (milestone = ANY(${[...MILESTONES]}::int[]))
  `
  await sql`
    INSERT INTO voucher_state (learner_id, milestone, status, earned_at)
    SELECT
      ${LEARNER_ID},
      milestone,
      CASE WHEN milestone <= ${currentStreak} THEN 'ready' ELSE 'locked' END,
      CASE WHEN milestone <= ${currentStreak} THEN now() ELSE NULL END
    FROM unnest(${[...MILESTONES]}::int[]) AS m(milestone)
    ON CONFLICT (learner_id, milestone) DO UPDATE
      SET status = 'ready', earned_at = COALESCE(voucher_state.earned_at, now())
      WHERE voucher_state.status = 'locked' AND EXCLUDED.status = 'ready'
  `
  return listVouchers()
}

export async function listVouchers(): Promise<VoucherPublic[]> {
  if (!hasDatabase()) return lockedLadder()
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT milestone, status, earned_at, revealed_at, claimed_at, redeemed_at, wish
    FROM voucher_state
    WHERE learner_id = ${LEARNER_ID}
    ORDER BY milestone
  `
  const byMilestone = new Map(
    rows.map((row) => [
      Number(row.milestone),
      {
        milestone: Number(row.milestone),
        number: voucherNumber(Number(row.milestone)),
        status: String(row.status) as VoucherStatus,
        earnedAt: asMillis(row.earned_at),
        revealedAt: asMillis(row.revealed_at),
        claimedAt: asMillis(row.claimed_at),
        redeemedAt: asMillis(row.redeemed_at),
        wish: row.wish === null || row.wish === undefined ? null : String(row.wish),
      } satisfies VoucherPublic,
    ]),
  )
  // Milestones the table has not caught up with yet still render as locked.
  return lockedLadder().map((fallback) => byMilestone.get(fallback.milestone) ?? fallback)
}

/**
 * Every mutation below is guarded by the status already in the table, so a
 * replayed or out-of-order request can never move a voucher backwards.
 */
export async function setVoucherRevealed(milestone: number): Promise<void> {
  const sql = await ensureSchema()
  await sql`
    UPDATE voucher_state
    SET status = 'revealed', revealed_at = COALESCE(revealed_at, now())
    WHERE learner_id = ${LEARNER_ID} AND milestone = ${milestone} AND status = 'ready'
  `
}

export async function setVoucherClaimed(milestone: number, wish: string | null): Promise<void> {
  const sql = await ensureSchema()
  await sql`
    UPDATE voucher_state
    SET
      status = 'claimed',
      revealed_at = COALESCE(revealed_at, now()),
      claimed_at = COALESCE(claimed_at, now()),
      wish = ${wish}
    WHERE learner_id = ${LEARNER_ID}
      AND milestone = ${milestone}
      AND status IN ('ready', 'revealed')
  `
}

export async function setVoucherRedeemed(milestone: number): Promise<void> {
  const sql = await ensureSchema()
  await sql`
    UPDATE voucher_state
    SET status = 'redeemed', redeemed_at = COALESCE(redeemed_at, now())
    WHERE learner_id = ${LEARNER_ID} AND milestone = ${milestone} AND status = 'claimed'
  `
}

export async function voucherStatus(milestone: number): Promise<VoucherStatus | null> {
  if (!hasDatabase()) return null
  const sql = await ensureSchema()
  const rows = await sql`
    SELECT status
    FROM voucher_state
    WHERE learner_id = ${LEARNER_ID} AND milestone = ${milestone}
    LIMIT 1
  `
  if (rows.length === 0) return null
  return String(rows[0].status) as VoucherStatus
}
