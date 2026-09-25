import { HomeClient } from "@/components/home/HomeClient"
import { listPapers } from "@/server/papers"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const papers = await listPapers()
  return <HomeClient papers={papers} />
}
