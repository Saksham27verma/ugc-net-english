import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { neon } from "@neondatabase/serverless"
import { configureNeonFetch } from "../src/server/neon-fetch"
import { parseMarkdownPaper } from "../src/lib/parse-paper"

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)))

function loadEnv(): void {
  const path = join(ROOT, ".env.local")
  if (!existsSync(path)) throw new Error("missing .env.local")
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const eq = line.indexOf("=")
    if (eq < 1) continue
    const key = line.slice(0, eq)
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

async function main(): Promise<void> {
  loadEnv()
  configureNeonFetch()
  const sql = neon(process.env.DATABASE_URL ?? "")
  const papers = await sql`SELECT set_id, title FROM papers ORDER BY set_id`
  console.log(
    "papers",
    papers.map((row) => ({ setId: Number(row.set_id), title: String(row.title) })),
  )
  const keys = await sql`SELECT set_id FROM answer_keys ORDER BY set_id`
  console.log("keys", keys.map((row) => Number(row.set_id)))
  const ugcTemplate = readFileSync(
    join(ROOT, "public/templates/UGC-NET-English-Practice-Set-TEMPLATE.md"),
    "utf8",
  )
  const ugc = parseMarkdownPaper(ugcTemplate, 99)
  console.log(
    "ugc_template",
    ugc.paper.exam,
    ugc.paper.sections.flatMap((s) => s.units.flatMap((u) => u.questions)).length,
  )
  const uppscTemplate = readFileSync(
    join(ROOT, "public/templates/UPPSC-Assistant-Professor-Practice-Set-TEMPLATE.md"),
    "utf8",
  )
  const uppsc = parseMarkdownPaper(uppscTemplate, 99, "uppsc", 1)
  console.log(
    "uppsc_template",
    uppsc.paper.exam,
    uppsc.paper.durationMinutes,
    uppsc.paper.marksPerCorrect,
    uppsc.paper.marksPerWrong,
    uppsc.paper.sections.flatMap((s) => s.units.flatMap((u) => u.questions)).length,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
