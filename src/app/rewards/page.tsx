import { RewardsClient } from "@/components/rewards/RewardsClient"
import {
  buildLadder,
  isEarned,
  isMilestone,
  type VoucherContents,
  type VoucherPublic,
} from "@/lib/vouchers"
import { isAdmin } from "@/server/admin-auth"
import { loadProgress } from "@/server/progress"
import { syncVouchers } from "@/server/rewards"
import { voucherContents } from "@/server/voucher-contents"

export const dynamic = "force-dynamic"

export default async function RewardsPage() {
  const { streak } = await loadProgress()

  let vouchers: VoucherPublic[] = []
  try {
    vouchers = await syncVouchers(streak.currentStreak)
  } catch {
    // An empty wallet beats a broken page.
  }

  const ladder = buildLadder(vouchers, streak.currentStreak, streak.todayKey)
  // Copy is sent down only for vouchers she has already scratched open. A
  // `ready` voucher still has to go through the scratch card.
  const opened: Record<number, VoucherContents> = {}
  for (const item of ladder) {
    if (!isMilestone(item.milestone)) continue
    if (item.status === "revealed" || item.status === "claimed" || item.status === "redeemed") {
      opened[item.milestone] = voucherContents(item.milestone)
    }
  }

  return (
    <RewardsClient
      earned={ladder.filter((item) => isEarned(item.status))}
      upcoming={ladder.filter((item) => !isEarned(item.status))}
      opened={opened}
      currentStreak={streak.currentStreak}
      admin={await isAdmin()}
    />
  )
}
