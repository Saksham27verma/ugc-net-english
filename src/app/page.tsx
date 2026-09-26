import { HomeClient } from "@/components/home/HomeClient"
import type { VoucherPublic } from "@/lib/vouchers"
import { listPapers } from "@/server/papers"
import { loadProgress } from "@/server/progress"
import { syncVouchers } from "@/server/rewards"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [papers, progress] = await Promise.all([listPapers(), loadProgress()])
  let vouchers: VoucherPublic[] = []
  try {
    vouchers = await syncVouchers(progress.streak.currentStreak)
  } catch {
    // The ladder falls back to locked cards rather than taking the page down.
  }
  return (
    <HomeClient
      papers={papers}
      history={progress.history}
      streak={progress.streak}
      freeze={progress.freeze}
      vouchers={vouchers}
    />
  )
}
