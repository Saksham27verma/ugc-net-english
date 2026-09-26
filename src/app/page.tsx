import { HomeClient } from "@/components/home/HomeClient"
import { buildStreak } from "@/lib/streak"
import type { VoucherPublic } from "@/lib/vouchers"
import { listAttemptResults, listPapers } from "@/server/papers"
import { syncVouchers } from "@/server/rewards"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [papers, history] = await Promise.all([listPapers(), listAttemptResults()])
  const streak = buildStreak(
    history.map((item) => item.submittedAt),
    Date.now(),
  )
  // Earning happens here, server-side, every time the dashboard loads.
  let vouchers: VoucherPublic[] = []
  try {
    vouchers = await syncVouchers(streak.currentStreak)
  } catch {
    // The ladder falls back to locked cards rather than taking the page down.
  }
  return <HomeClient papers={papers} history={history} streak={streak} vouchers={vouchers} />
}
