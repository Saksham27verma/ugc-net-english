"use server"

import { revalidatePath } from "next/cache"
import {
  isMilestone,
  WISH_MAX_LENGTH,
  WISH_MILESTONE,
  type Milestone,
  type VoucherContents,
} from "@/lib/vouchers"
import { isAdmin } from "./admin-auth"
import {
  setVoucherClaimed,
  setVoucherRedeemed,
  setVoucherRevealed,
  voucherStatus,
} from "./rewards"
import { voucherContents } from "./voucher-contents"

/**
 * The only door the voucher copy comes through. It opens for a milestone that
 * the database says has been earned, and for nothing else — the client cannot
 * talk itself past this check.
 */
async function earnedMilestone(milestone: number): Promise<Milestone> {
  if (!isMilestone(milestone)) {
    throw new Error("Unknown voucher")
  }
  const status = await voucherStatus(milestone)
  if (!status || status === "locked") {
    throw new Error("That voucher has not been earned yet")
  }
  return milestone
}

export async function openVoucher(milestone: number): Promise<VoucherContents> {
  return voucherContents(await earnedMilestone(milestone))
}

export async function revealVoucher(milestone: number): Promise<void> {
  await setVoucherRevealed(await earnedMilestone(milestone))
  revalidatePath("/")
  revalidatePath("/rewards")
}

export async function claimVoucher(milestone: number, wish: string | null): Promise<void> {
  const earned = await earnedMilestone(milestone)
  const trimmed = wish?.trim() ?? ""
  // Only voucher 006 carries a wish; anything else arrives with it stripped.
  const stored =
    earned === WISH_MILESTONE && trimmed.length > 0 ? trimmed.slice(0, WISH_MAX_LENGTH) : null
  await setVoucherClaimed(earned, stored)
  revalidatePath("/")
  revalidatePath("/rewards")
}

/** Chinku marking a claimed voucher as delivered. Admin cookie only. */
export async function redeemVoucher(milestone: number): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Not signed in as admin")
  }
  await setVoucherRedeemed(await earnedMilestone(milestone))
  revalidatePath("/")
  revalidatePath("/rewards")
}
