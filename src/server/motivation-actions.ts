"use server"

import { revalidatePath } from "next/cache"
import { dismissComeback } from "./comebacks"

export async function dismissWelcomeBack(dayKey: string): Promise<void> {
  await dismissComeback(dayKey)
  revalidatePath("/")
}
