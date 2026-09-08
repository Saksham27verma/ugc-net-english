import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)))

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return acc
  }
  for (const name of entries) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, acc)
    else acc.push(path)
  }
  return acc
}

function main(): void {
  const key = JSON.parse(readFileSync(join(ROOT, "src/server/keys/key-1.json"), "utf8")) as Record<
    string,
    { explanation: string }
  >
  const needles = [
    key["1"].explanation,
    key["144"].explanation,
    key["150"].explanation,
  ]
  const staticDir = join(ROOT, ".next/static")
  const files = walk(staticDir)
  const leaks: string[] = []
  for (const file of files) {
    if (!/\.(js|json|html|txt|map)$/.test(file)) continue
    const text = readFileSync(file, "utf8")
    for (const needle of needles) {
      if (needle && text.includes(needle)) {
        leaks.push(`${file} contains key text: ${JSON.stringify(needle.slice(0, 80))}`)
      }
    }
  }
  if (leaks.length > 0) {
    throw new Error(`Answer key leaked into the client bundle:\n${leaks.join("\n")}`)
  }
  console.log(`Checked ${files.length} files under .next/static — no answer strings found.`)
}

main()
