import { ExamShell } from "@/components/exam/ExamShell"
import { getPaperFromStore } from "@/server/papers"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ExamPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  const paper = await getPaperFromStore(Number(setId))
  if (!paper) notFound()
  return <ExamShell paper={paper} />
}
