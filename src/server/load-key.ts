import "server-only"
import type { KeyFile } from "@/lib/types"
import { loadKeyFromStore } from "./papers"

export async function loadKey(setId: number): Promise<KeyFile> {
  return loadKeyFromStore(setId)
}
