import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { neon } from "@neondatabase/serverless"
import { parseMarkdownPaper, SET_FILENAME_RE, setIdFromFilename } from "../src/lib/parse-paper"
import { configureNeonFetch } from "../src/server/neon-fetch"
import { migrate } from "../src/server/schema"

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)))

function loadEnv(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(ROOT, name)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq < 1) continue
      const key = trimmed.slice(0, eq)
      let value = trimmed.slice(eq + 1)
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  }
}

async function main(): Promise<void> {
  loadEnv()
  configureNeonFetch()
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }

  const sql = neon(url)
  await migrate(sql)

  const contentDir = join(ROOT, "content")
  const files = readdirSync(contentDir)
    .filter((name) => SET_FILENAME_RE.test(name))
    .sort((a, b) => a.localeCompare(b, "en"))

  if (files.length === 0) {
    throw new Error(`No Practice-Set-N.md files in ${contentDir}`)
  }

  for (const file of files) {
    const setId = setIdFromFilename(file)
    if (setId == null) continue
    const source = readFileSync(join(contentDir, file), "utf8")
    const { paper, key, distribution } = parseMarkdownPaper(source, setId)
    await sql.transaction((txn) => [
      txn`
        INSERT INTO papers (set_id, title, duration_minutes, marks_per_correct, paper, source_filename, updated_at)
        VALUES (
          ${paper.setId},
          ${paper.title},
          ${paper.durationMinutes},
          ${paper.marksPerCorrect},
          ${paper},
          ${file},
          now()
        )
        ON CONFLICT (set_id) DO UPDATE SET
          title = EXCLUDED.title,
          duration_minutes = EXCLUDED.duration_minutes,
          marks_per_correct = EXCLUDED.marks_per_correct,
          paper = EXCLUDED.paper,
          source_filename = EXCLUDED.source_filename,
          updated_at = now()
      `,
      txn`
        INSERT INTO answer_keys (set_id, key, updated_at)
        VALUES (${paper.setId}, ${key}, now())
        ON CONFLICT (set_id) DO UPDATE SET
          key = EXCLUDED.key,
          updated_at = now()
      `,
    ])
    console.log(
      `Seeded set ${setId} (${file})  1=${distribution[1]} 2=${distribution[2]} 3=${distribution[3]} 4=${distribution[4]}`,
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
