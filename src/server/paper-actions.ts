"use server"

import { getPaperFromStore } from "./papers"
import type { Paper } from "@/lib/types"

export async function getPublishedPaper(setId: number): Promise<Paper | null> {
  const paper = await getPaperFromStore(setId)
  return paper ?? null
}
