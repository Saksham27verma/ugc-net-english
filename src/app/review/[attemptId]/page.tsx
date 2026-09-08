import { ReviewClient } from "@/components/review/ReviewClient"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  return <ReviewClient attemptId={attemptId} />
}
