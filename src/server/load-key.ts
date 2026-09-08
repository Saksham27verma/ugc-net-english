import "server-only"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { KeyFile } from "@/lib/types"

export function loadKey(setId: number): KeyFile {
  const path = join(process.cwd(), "src/server/keys", `key-${setId}.json`)
  const raw = readFileSync(path, "utf8")
  return JSON.parse(raw) as KeyFile
}
