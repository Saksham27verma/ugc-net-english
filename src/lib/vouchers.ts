/**
 * Everything in this file is safe to ship to the browser: milestone numbers,
 * voucher numbers and states only. The copy on a voucher lives in
 * src/server/voucher-contents.ts and never leaves the server until the
 * milestone behind it has been earned.
 */
import { shiftDayKey } from "./streak"

export const MILESTONES = [5, 10, 20, 30, 50, 100] as const

export type Milestone = (typeof MILESTONES)[number]

export type VoucherStatus = "locked" | "ready" | "revealed" | "claimed" | "redeemed"

export type VoucherPublic = {
  milestone: number
  number: string
  status: VoucherStatus
  earnedAt: number | null
  revealedAt: number | null
  claimedAt: number | null
  redeemedAt: number | null
  wish: string | null
}

/** The voucher that takes a written wish instead of printed contents. */
export const WISH_MILESTONE = 100

export function isMilestone(value: number): value is Milestone {
  return (MILESTONES as readonly number[]).includes(value)
}

/** No. 001 … No. 006, in milestone order. */
export function voucherNumber(milestone: number): string {
  const index = (MILESTONES as readonly number[]).indexOf(milestone)
  return `${index + 1}`.padStart(3, "0")
}

export function isEarned(status: VoucherStatus): boolean {
  return status !== "locked"
}

export function statusLabel(status: VoucherStatus): string {
  switch (status) {
    case "ready":
      return "Ready to scratch"
    case "revealed":
      return "Revealed"
    case "claimed":
      return "Claimed"
    case "redeemed":
      return "Redeemed"
    default:
      return "Locked"
  }
}

export type LadderItem = VoucherPublic & {
  /** Days of streak still to go. Zero once the milestone is earned. */
  unlocksInDays: number
  /** Where that lands on the calendar if she never misses a day. */
  projectedDayKey: string | null
}

export function buildLadder(
  vouchers: VoucherPublic[],
  currentStreak: number,
  todayKey: string,
): LadderItem[] {
  const byMilestone = new Map(vouchers.map((voucher) => [voucher.milestone, voucher]))
  return MILESTONES.map((milestone) => {
    const voucher = byMilestone.get(milestone) ?? {
      milestone,
      number: voucherNumber(milestone),
      status: "locked" as VoucherStatus,
      earnedAt: null,
      revealedAt: null,
      claimedAt: null,
      redeemedAt: null,
      wish: null,
    }
    const remaining = Math.max(0, milestone - currentStreak)
    return {
      ...voucher,
      unlocksInDays: isEarned(voucher.status) ? 0 : remaining,
      // A projection only means something once a streak is actually running.
      projectedDayKey:
        isEarned(voucher.status) || currentStreak === 0 ? null : shiftDayKey(todayKey, remaining),
    }
  })
}

/** The nearest milestone she has not earned yet, for the Regularity card line. */
export function nextLadderItem(items: LadderItem[]): LadderItem | null {
  return items.find((item) => !isEarned(item.status)) ?? null
}
