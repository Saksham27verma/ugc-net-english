import { ExamShell } from "@/components/exam/ExamShell"
import { getPaper, papers } from "@/data/papers"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return papers.map((paper) => ({ setId: String(paper.setId) }))
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  const paper = getPaper(Number(setId))
  if (!paper) notFound()
  return <ExamShell paper={paper} />
}
