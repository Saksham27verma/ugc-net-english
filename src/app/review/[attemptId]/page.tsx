import { ReviewClient } from "@/components/review/ReviewClient"
import { getAttemptResult, getPaperFromStore } from "@/server/papers"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const result = await getAttemptResult(attemptId)
  if (!result) notFound()
  const paper = await getPaperFromStore(result.setId)
  if (!paper) notFound()
  return <ReviewClient result={result} paper={paper} />
}
