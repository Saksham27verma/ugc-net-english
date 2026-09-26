import { ResultClient } from "@/components/result/ResultClient"
import { noteForCompletedDay } from "@/server/notes"
import { getAttemptResult } from "@/server/papers"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const result = await getAttemptResult(attemptId)
  if (!result) notFound()
  let note: string | null = null
  try {
    note = await noteForCompletedDay(result.submittedAt)
  } catch {
    note = null
  }
  return <ResultClient result={result} note={note} />
}
