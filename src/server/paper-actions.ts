"use server"

import { revalidatePath } from "next/cache"
import type { Paper, Result } from "@/lib/types"
import { getPaperFromStore, saveAttemptResult } from "./papers"

export async function getPublishedPaper(setId: number): Promise<Paper | null> {
  const paper = await getPaperFromStore(setId)
  return paper ?? null
}

export async function syncLocalHistory(results: Result[]): Promise<number> {
  let saved = 0
  for (const result of results) {
    if (!result?.attemptId || !result.setId) continue
    await saveAttemptResult(result)
    saved += 1
  }
  if (saved > 0) revalidatePath("/")
  return saved
}
