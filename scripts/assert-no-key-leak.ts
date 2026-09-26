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

function answerNeedles(): string[] {
  const key = JSON.parse(readFileSync(join(ROOT, "src/server/keys/key-1.json"), "utf8")) as Record<
    string,
    { explanation: string }
  >
  return [key["1"].explanation, key["144"].explanation, key["150"].explanation]
}

/**
 * Reads the voucher copy out of the server-only module as text. Importing it
 * would trip the server-only guard, and the point here is to prove that none
 * of these sentences ever reach the browser bundle.
 */
function voucherNeedles(): string[] {
  const source = readFileSync(join(ROOT, "src/server/voucher-contents.ts"), "utf8")
  const literals = source.match(/"(?:[^"\\]|\\.)*"/g) ?? []
  return literals
    .map((literal) => {
      try {
        return JSON.parse(literal) as string
      } catch {
        return ""
      }
    })
    .filter((text) => text.length >= 20)
}

function main(): void {
  const needles = [
    ...answerNeedles().map((text) => ["answer key", text] as const),
    ...voucherNeedles().map((text) => ["voucher copy", text] as const),
  ]
  const staticDir = join(ROOT, ".next/static")
  const files = walk(staticDir)
  const leaks: string[] = []
  for (const file of files) {
    if (!/\.(js|json|html|txt|map)$/.test(file)) continue
    const text = readFileSync(file, "utf8")
    for (const [kind, needle] of needles) {
      if (needle && text.includes(needle)) {
        leaks.push(`${file} contains ${kind}: ${JSON.stringify(needle.slice(0, 80))}`)
      }
    }
  }
  if (leaks.length > 0) {
    throw new Error(`Secret text leaked into the client bundle:\n${leaks.join("\n")}`)
  }
  console.log(
    `Checked ${files.length} files under .next/static against ${needles.length} strings — nothing leaked.`,
  )
}

main()
