import { HomeClient } from "@/components/home/HomeClient"
import { papers } from "@/data/papers"

export default function HomePage() {
  return (
    <HomeClient
      papers={papers.map((paper) => ({
        setId: paper.setId,
        title: paper.title,
        durationMinutes: paper.durationMinutes,
      }))}
    />
  )
}
