import { HomeClient } from "@/components/home/HomeClient"
import { buildStreak } from "@/lib/streak"
import { listAttemptResults, listPapers } from "@/server/papers"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [papers, history] = await Promise.all([listPapers(), listAttemptResults()])
  const streak = buildStreak(
    history.map((item) => item.submittedAt),
    Date.now(),
  )
  return <HomeClient papers={papers} history={history} streak={streak} />
}
