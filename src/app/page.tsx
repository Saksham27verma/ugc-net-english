import { HomeClient } from "@/components/home/HomeClient"
import { listAttemptResults, listPapers } from "@/server/papers"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [papers, history] = await Promise.all([listPapers(), listAttemptResults()])
  return <HomeClient papers={papers} history={history} />
}
